import Link from "next/link";
import { FileText } from "lucide-react";
import { DeleteDocumentButton } from "@/components/knowledge/delete-document-button";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { RetryIndexButton } from "@/components/knowledge/retry-index-button";
import { documentKind } from "@/lib/knowledge/library";
import { isIndexing, isWaitingForRetry } from "@/lib/knowledge/pipeline";
import type { KnowledgeDocument } from "@/lib/types";

const KIND_LABEL = {
  pdf: "PDF",
  md: "Markdown",
  txt: "Text",
  other: "File",
} as const;

export function DocumentRows({
  documents,
  canManage,
}: {
  documents: KnowledgeDocument[];
  canManage: boolean;
}) {
  return (
    <ul className="overflow-hidden rounded-2xl bg-[#111]">
      {documents.map((doc) => {
        const running = isIndexing(doc.status);
        const failed = doc.status === "failed";
        return (
          <li key={doc.id} className="border-t border-white/[0.05] first:border-t-0">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <DocumentIdentity document={doc} />
              <DocumentActions document={doc} canManage={canManage} />
            </div>
            {running || failed ? (
              <div className="px-5 pb-5">
                <ProcessingStatus current={doc.status} fileName={doc.name} error={doc.error_message} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DocumentCards({
  documents,
  canManage,
}: {
  documents: KnowledgeDocument[];
  canManage: boolean;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-col rounded-2xl bg-[#111] p-4">
          <DocumentIdentity document={doc} />
          <div className="mt-4 flex items-center justify-end gap-2">
            <DocumentActions document={doc} canManage={canManage} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DocumentIdentity({ document }: { document: KnowledgeDocument }) {
  const kind = documentKind(document.file_type);
  return (
    <Link href={`/dashboard/knowledge/${document.id}`} className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <FileText className="size-4 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium">{document.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-white/40">
          {KIND_LABEL[kind]} ·{" "}
          {new Date(document.created_at).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {document.status === "indexed" ? " · Ready to cite" : null}
          {isWaitingForRetry(document.status, document.error_message) ? " · Waiting to retry" : null}
          {document.status === "failed" ? " · Failed" : null}
        </p>
      </div>
    </Link>
  );
}

function DocumentActions({
  document,
  canManage,
}: {
  document: KnowledgeDocument;
  canManage: boolean;
}) {
  if (!canManage) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <RetryIndexButton documentId={document.id} status={document.status} />
      <DeleteDocumentButton documentId={document.id} />
    </div>
  );
}

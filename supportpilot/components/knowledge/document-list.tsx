import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteDocumentButton } from "@/components/knowledge/delete-document-button";
import { RetryIndexButton } from "@/components/knowledge/retry-index-button";
import type { KnowledgeDocument } from "@/lib/types";

const statusLabel: Record<KnowledgeDocument["status"], string> = {
  queued: "Queued",
  uploading: "Uploading",
  extracting: "Extracting",
  chunking: "Chunking",
  embedding: "Embedding",
  indexed: "Indexed",
  failed: "Failed",
};

export function DocumentList({
  documents,
  canManage,
}: {
  documents: KnowledgeDocument[];
  canManage: boolean;
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-beige-deep bg-cream px-6 py-16 text-center">
        <FileText className="mx-auto size-8 text-primary" />
        <p className="mt-3 font-medium">No documents yet</p>
        <p className="mx-auto mt-1 max-w-md text-[14px] text-steel">
          Upload PDFs, Markdown, or text. The pipeline will extract, chunk, embed, and index
          them for retrieval.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline-soft overflow-hidden rounded-lg border border-hairline-soft bg-canvas">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-cream-light">
          <Link href={`/dashboard/knowledge/${doc.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <FileText className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-medium">{doc.name}</p>
              <p className="text-[13px] text-steel">
                {doc.file_type.toUpperCase()} ·{" "}
                {new Date(doc.created_at).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {doc.error_message ? (
                <p className="mt-1 truncate text-[12px] text-primary">{doc.error_message}</p>
              ) : null}
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            {canManage ? <RetryIndexButton documentId={doc.id} status={doc.status} /> : null}
            {canManage ? <DeleteDocumentButton documentId={doc.id} /> : null}
            <Badge variant={doc.status === "indexed" ? "default" : doc.status === "failed" ? "high" : "secondary"}>
              {statusLabel[doc.status]}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeDocument } from "@/lib/types";

const statusLabel: Record<KnowledgeDocument["status"], string> = {
  uploading: "Uploading",
  extracting: "Extracting",
  chunking: "Chunking",
  embedding: "Embedding",
  indexed: "Indexed",
  failed: "Failed",
};

export function DocumentList({ documents }: { documents: KnowledgeDocument[] }) {
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
        <li key={doc.id}>
          <Link
            href={`/dashboard/knowledge/${doc.id}`}
            className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-cream-light"
          >
            <div className="flex min-w-0 items-center gap-3">
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
              </div>
            </div>
            <Badge variant={doc.status === "indexed" ? "default" : "secondary"}>
              {statusLabel[doc.status]}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

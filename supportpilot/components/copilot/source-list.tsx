import type { CopilotSource } from "@/lib/ai/types";
import { FileText } from "lucide-react";

export function SourceList({ sources }: { sources: CopilotSource[] }) {
  return (
    <footer className="border-t border-hairline-soft bg-canvas px-5 py-3">
      <p className="typo-eyebrow text-steel">Sources</p>
      {sources.length === 0 ? (
        <p className="mt-2 text-[14px] text-steel">
          Citations appear after retrieval. Nothing is invented without a document
          behind it.
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {sources.map((source) => (
            <li
              key={source.chunkId}
              className="inline-flex items-center gap-1.5 rounded-full bg-cream-deeper px-2.5 py-1 text-[13px] font-semibold"
            >
              <FileText className="size-3.5 text-steel" />
              {source.documentName}
              {source.pageNumber ? ` · Page ${source.pageNumber}` : ""}
            </li>
          ))}
        </ul>
      )}
    </footer>
  );
}

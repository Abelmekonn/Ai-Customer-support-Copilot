import type { CopilotSource } from "@/lib/ai/types";
import { formatPercent } from "@/lib/utils";
import { FileText } from "lucide-react";

export function Citation({ source }: { source: CopilotSource }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <FileText className="mt-0.5 size-4 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{source.documentName}</p>
        <p className="text-xs text-muted-foreground">
          {source.pageNumber ? `Page ${source.pageNumber} · ` : ""}
          similarity {formatPercent(source.similarity)}
        </p>
      </div>
    </div>
  );
}

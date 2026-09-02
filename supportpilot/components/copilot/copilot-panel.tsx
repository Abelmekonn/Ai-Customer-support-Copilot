import { ConfidenceScore } from "@/components/copilot/confidence-score";
import { IntentCard } from "@/components/copilot/intent-card";
import { ResponseEditor } from "@/components/copilot/response-editor";
import { Button } from "@/components/ui/button";
import type { CopilotResult } from "@/lib/ai/types";
import Link from "next/link";

export function CopilotPanel({ result }: { result: CopilotResult | null }) {
  return (
    <aside className="flex min-h-0 flex-col bg-black">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="typo-eyebrow text-steel">AI copilot</p>
        <p className="mt-2 text-[14px] leading-[1.5] text-ink-tint">
          Assists the agent. Never sends on its own.
        </p>
      </div>
      <div className="flex-1 space-y-5 overflow-auto px-5 py-4">
        <IntentCard intent={result?.intent} category={result?.category} />
        <ConfidenceScore value={result?.confidence} />
        {result ? (
          <ResponseEditor initialValue={result.response} />
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#111] p-6">
            <p className="text-[16px] font-medium">Drafts need a knowledge base</p>
            <p className="mt-2 text-[14px] leading-[1.5] text-steel">
              Upload policies, FAQs, and product docs so retrieval can ground the
              reply.
            </p>
            <Button className="mt-4" size="sm" variant="dark" asChild>
              <Link href="/dashboard/knowledge">Open knowledge base</Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

import { ConfidenceScore } from "@/components/copilot/confidence-score";
import { GenerateDraftButton } from "@/components/copilot/generate-draft-button";
import { IntentCard } from "@/components/copilot/intent-card";
import { ResponseEditor } from "@/components/copilot/response-editor";
import type { CopilotResult } from "@/lib/ai/types";
import type { DraftCapResult } from "@/lib/billing/plans";

export function CopilotPanel({
  ticketId,
  generationId,
  result,
  drafts,
  draftMessage,
}: {
  ticketId: string;
  generationId?: string;
  result: CopilotResult | null;
  drafts?: Pick<DraftCapResult, "blocked" | "warning">;
  draftMessage?: string | null;
}) {
  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-white/10 bg-black lg:w-[380px] lg:border-t-0">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="typo-eyebrow text-steel">AI copilot</p>
        <p className="mt-2 text-[14px] leading-[1.5] text-ink-tint">
          Drafts from indexed policy. You review and send.
        </p>
      </div>
      <div className="flex-1 space-y-5 overflow-auto px-5 py-4">
        {drafts?.warning && !drafts.blocked && draftMessage ? (
          <p className="text-[13px] text-[#c4a35a]">{draftMessage}</p>
        ) : null}
        <IntentCard intent={result?.intent} category={result?.category} />
        <ConfidenceScore value={result?.confidence} />
        {result ? (
          <ResponseEditor
            key={result.response}
            ticketId={ticketId}
            generationId={generationId}
            initialValue={result.response}
            draftBlocked={drafts?.blocked}
            draftBlockedMessage={draftMessage}
          />
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#111] p-6">
            <p className="text-[16px] font-medium">Draft a reply from this ticket</p>
            <p className="mt-2 text-[14px] leading-[1.5] text-steel">
              The copilot searches your knowledge base. If nothing matches, it
              will refuse instead of inventing policy.
            </p>
            <div className="mt-4">
              <GenerateDraftButton
                ticketId={ticketId}
                blocked={drafts?.blocked}
                blockedMessage={draftMessage}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

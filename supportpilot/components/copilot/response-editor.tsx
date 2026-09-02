"use client";

import { useActionState, useState } from "react";
import { sendReplyAction, type ActionState } from "@/app/dashboard/actions";
import { GenerateDraftButton } from "@/components/copilot/generate-draft-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = {};

export function ResponseEditor({
  ticketId,
  generationId,
  initialValue = "",
  draftBlocked = false,
  draftBlockedMessage,
}: {
  ticketId: string;
  generationId?: string;
  initialValue?: string;
  draftBlocked?: boolean;
  draftBlockedMessage?: string | null;
}) {
  const [value, setValue] = useState(initialValue);
  const [state, action, pending] = useActionState(sendReplyAction, initial);

  return (
    <div>
      <p className="typo-eyebrow text-steel">Suggested response</p>
      <form action={action}>
        <input type="hidden" name="ticketId" value={ticketId} />
        {generationId ? <input type="hidden" name="generationId" value={generationId} /> : null}
        <Textarea
          name="content"
          className="mt-2 min-h-40"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="A grounded draft will appear here."
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending || !value.trim()}>
            {pending ? "Sending…" : "Send this draft"}
          </Button>
        </div>
        {state.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="mt-2 text-sm text-primary">{state.success}</p> : null}
      </form>
      <div className="mt-2">
        <GenerateDraftButton
          ticketId={ticketId}
          label="Regenerate"
          blocked={draftBlocked}
          blockedMessage={draftBlockedMessage}
        />
      </div>
    </div>
  );
}

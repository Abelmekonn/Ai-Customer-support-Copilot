"use client";

import { useActionState, useState } from "react";
import { sendReplyAction, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = {};

export function ReplyComposer({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(sendReplyAction, initial);
  const [internal, setInternal] = useState(false);

  return (
    <form action={action} className="border-t border-hairline-soft bg-canvas p-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      {internal ? <input type="hidden" name="isInternal" value="true" /> : null}
      <Textarea
        name="content"
        required
        placeholder={
          internal
            ? "Internal note — not emailed to the customer."
            : "Write the reply the customer will receive. The copilot drafts; you send."
        }
        className="min-h-24"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[13px] text-steel">
          <input
            type="checkbox"
            checked={internal}
            onChange={(event) => setInternal(event.target.checked)}
            className="size-4 accent-primary"
          />
          Internal note
        </label>
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-steel">
            {state.error ??
              state.success ??
              (internal ? "Saved on the ticket only." : "Sends as you — never automatically by the model.")}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? (internal ? "Saving…" : "Sending…") : internal ? "Save note" : "Send reply"}
          </Button>
        </div>
      </div>
    </form>
  );
}

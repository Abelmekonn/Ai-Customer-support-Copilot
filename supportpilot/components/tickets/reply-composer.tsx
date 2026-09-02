"use client";

import { useActionState } from "react";
import { sendReplyAction, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = {};

export function ReplyComposer({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(sendReplyAction, initial);

  return (
    <form action={action} className="border-t border-hairline-soft bg-canvas p-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Textarea
        name="content"
        required
        placeholder="Write the reply the customer will receive. The copilot drafts; you send."
        className="min-h-24"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-steel">
          {state.error ?? state.success ?? "Replies are sent as you — never automatically by the model."}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </form>
  );
}

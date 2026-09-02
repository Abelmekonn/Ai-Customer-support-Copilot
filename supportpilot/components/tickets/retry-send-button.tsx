"use client";

import { useActionState } from "react";
import { retryOutboundSendAction, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

const initial: ActionState = {};

export function RetrySendButton({
  ticketId,
  messageId,
}: {
  ticketId: string;
  messageId: string;
}) {
  const [state, action, pending] = useActionState(retryOutboundSendAction, initial);

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="messageId" value={messageId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Retrying…" : "Retry send"}
      </Button>
      {state.error ? <p className="mt-1 text-[13px] text-destructive">{state.error}</p> : null}
    </form>
  );
}

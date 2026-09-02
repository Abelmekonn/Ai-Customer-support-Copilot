"use client";

import { useActionState } from "react";
import {
  generateCopilotDraftAction,
  type CopilotActionState,
} from "@/app/dashboard/tickets/copilot-actions";
import { Button } from "@/components/ui/button";

const initial: CopilotActionState = {};

export function GenerateDraftButton({
  ticketId,
  label = "Generate draft",
}: {
  ticketId: string;
  label?: string;
}) {
  const [state, action, pending] = useActionState(generateCopilotDraftAction, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="sm" variant="dark" disabled={pending}>
        {pending ? "Drafting with MiniMax…" : label}
      </Button>
    </form>
  );
}

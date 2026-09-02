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
  blocked = false,
  blockedMessage,
}: {
  ticketId: string;
  label?: string;
  blocked?: boolean;
  blockedMessage?: string | null;
}) {
  const [state, action, pending] = useActionState(generateCopilotDraftAction, initial);
  const error = state.error ?? (blocked ? blockedMessage : null);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" variant="dark" disabled={pending || blocked}>
        {pending ? "Drafting with MiniMax…" : label}
      </Button>
    </form>
  );
}

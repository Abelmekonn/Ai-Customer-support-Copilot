"use client";

import { updateTicketStatusAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import type { TicketStatus } from "@/lib/types";

export function TicketStatusActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: TicketStatus;
}) {
  return (
    <div className="flex gap-2">
      {status !== "open" ? (
        <Button variant="outline" size="sm" onClick={() => updateTicketStatusAction(ticketId, "open")}>
          Reopen
        </Button>
      ) : null}
      {status !== "pending" ? (
        <Button variant="outline" size="sm" onClick={() => updateTicketStatusAction(ticketId, "pending")}>
          Mark pending
        </Button>
      ) : null}
      {status !== "resolved" ? (
        <Button size="sm" onClick={() => updateTicketStatusAction(ticketId, "resolved")}>
          Resolve
        </Button>
      ) : null}
    </div>
  );
}

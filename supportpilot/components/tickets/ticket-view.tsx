"use client";

import {
  sendTicketMessage,
  updateTicketStatus,
} from "@/app/dashboard/tickets/actions";
import { TicketMessage } from "@/components/tickets/ticket-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message, Ticket, TicketStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TicketView({
  ticket,
  messages,
  customerName,
  agentName,
}: {
  ticket: Ticket;
  messages: Message[];
  customerName: string;
  agentName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSend(formData: FormData) {
    startTransition(async () => {
      const result = await sendTicketMessage(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      (document.getElementById("reply") as HTMLTextAreaElement | null)?.form?.reset();
      router.refresh();
    });
  }

  function onStatus(status: TicketStatus) {
    const formData = new FormData();
    formData.set("ticketId", ticket.id);
    formData.set("status", status);
    startTransition(async () => {
      await updateTicketStatus(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-auto p-5">
        {messages.map((message) => (
          <TicketMessage
            key={message.id}
            message={message}
            customerName={customerName}
            agentName={agentName}
          />
        ))}
      </div>
      <form action={onSend} className="border-t border-border p-4">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <Textarea
          id="reply"
          name="content"
          placeholder="Write a reply. The copilot will draft this for you in Stage 5."
          required
        />
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {ticket.status !== "resolved" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => onStatus("resolved")}
              >
                Resolve
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => onStatus("open")}
              >
                Reopen
              </Button>
            )}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}

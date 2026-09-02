import { notFound } from "next/navigation";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { SourceList } from "@/components/copilot/source-list";
import { PriorityBadge, StatusBadge } from "@/components/tickets/ticket-badges";
import { ReplyComposer } from "@/components/tickets/reply-composer";
import { TicketMessage } from "@/components/tickets/ticket-message";
import { TicketStatusActions } from "@/components/tickets/ticket-status-actions";
import { getCurrentUser, getTicket, listMessages } from "@/lib/data";
import { formatTicketNumber } from "@/lib/utils";

export default async function TicketWorkspacePage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { ticketId } = await params;
  const ticket = await getTicket(user.organization_id, ticketId);
  if (!ticket) notFound();

  const messages = await listMessages(ticket.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-hairline-soft bg-canvas px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-medium">{ticket.subject}</h1>
            <span className="font-mono text-[13px] text-steel">
              {formatTicketNumber(ticket.ticket_number)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span>{ticket.category ?? "General"}</span>
          </div>
        </div>
        <TicketStatusActions ticketId={ticket.id} status={ticket.status} />
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-0 flex-col border-r border-border">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
            <p className="mt-1 font-medium">{ticket.customer.name}</p>
            <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message) => (
              <TicketMessage
                key={message.id}
                message={message}
                customerName={ticket.customer.name}
                agentName={user.full_name}
              />
            ))}
          </div>
          <ReplyComposer ticketId={ticket.id} />
        </section>
        <CopilotPanel result={null} />
      </div>
      <SourceList sources={[]} />
    </div>
  );
}

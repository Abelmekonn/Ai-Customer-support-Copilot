import Link from "next/link";
import { PriorityBadge } from "@/components/tickets/ticket-badges";
import type { TicketWithCustomer } from "@/lib/types";
import { formatRelativeTime, formatTicketNumber } from "@/lib/utils";

export function NeedsYouList({ tickets }: { tickets: TicketWithCustomer[] }) {
  return (
    <section className="flex h-full min-h-[22rem] flex-col rounded-2xl bg-[#111]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-medium">Needs you</h2>
          <p className="mt-0.5 text-[13px] text-white/35">
            {tickets.length === 0 ? "Nothing open" : `${tickets.length} in this list`}
          </p>
        </div>
        <Link href="/dashboard/tickets" className="text-[13px] text-white/40 hover:text-white">
          Open inbox
        </Link>
      </div>
      {tickets.length === 0 ? (
        <p className="px-5 pb-6 text-[14px] text-white/40">New mail lands here.</p>
      ) : (
        <ul className="flex-1">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="border-t border-white/[0.05]">
              <Link
                href={`/dashboard/tickets/${ticket.id}`}
                className="flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">{ticket.subject}</p>
                  <p className="mt-1 truncate text-[13px] text-white/40">
                    {ticket.customer.name}
                    {ticket.assignee?.full_name ? ` · ${ticket.assignee.full_name}` : " · Unassigned"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <p className="font-mono text-[12px] text-white/30">
                    {formatTicketNumber(ticket.ticket_number)} · {formatRelativeTime(ticket.last_message_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

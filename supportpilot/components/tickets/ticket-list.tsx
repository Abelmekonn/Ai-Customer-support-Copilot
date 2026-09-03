"use client";

import { LoadSampleTickets } from "@/components/demo/load-sample-tickets";
import { PriorityBadge } from "@/components/tickets/ticket-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TicketStatus, TicketWithCustomer } from "@/lib/types";
import { formatRelativeTime, formatTicketNumber, initials } from "@/lib/utils";
import { Inbox, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const QUEUE_LABEL: Record<TicketStatus, string> = {
  open: "open",
  pending: "pending",
  resolved: "resolved",
};

export function TicketList({
  tickets,
  status,
  statusCount,
  totalInOrg,
  isDemo,
}: {
  tickets: TicketWithCustomer[];
  status: TicketStatus;
  statusCount: number;
  totalInOrg: number;
  isDemo: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const query = searchParams.get("q") ?? "";

  function onSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0a]">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <label className="relative mx-auto block w-full max-w-[420px]">
          <span className="sr-only">Search tickets</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            defaultValue={query}
            placeholder="Search subject, customer, or category..."
            onChange={(event) => onSearch(event.target.value)}
            className="h-10 w-full rounded-full border border-white/[0.08] bg-[#141414] pr-4 pl-10 text-[13px] text-white outline-none placeholder:text-white/30 focus-visible:border-white/20"
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-7 pb-6">
        <div className="shrink-0 pb-4">
          <h1 className="typo-heading-1">Inbox</h1>
          <p className="mt-2 text-[14px] text-white/45">
            {query
              ? `${tickets.length} matching in ${QUEUE_LABEL[status]}`
              : statusCount === 0
                ? `Nothing ${QUEUE_LABEL[status]}.`
                : `${statusCount} ${QUEUE_LABEL[status]}`}
          </p>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-auto rounded-2xl bg-[#111] ${pending ? "opacity-70" : ""}`}
        >
          {tickets.length === 0 ? (
            <EmptyQueue query={query} status={status} totalInOrg={totalInOrg} isDemo={isDemo} />
          ) : (
            <ul>
              {tickets.map((ticket) => (
                <li key={ticket.id} className="border-b border-white/[0.05] last:border-b-0">
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <Avatar className="mt-0.5 size-10">
                      <AvatarFallback className="bg-white/10 text-[12px] font-semibold text-white">
                        {initials(ticket.customer.name || ticket.customer.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-white">{ticket.subject}</p>
                      <p className="mt-0.5 truncate text-[13px] text-white/40">
                        {ticket.customer.name}
                        {ticket.assignee?.full_name
                          ? ` · ${ticket.assignee.full_name}`
                          : " · Unassigned"}
                      </p>
                      {ticket.last_message_preview ? (
                        <p className="mt-1 truncate text-[13px] text-white/35">
                          {ticket.last_message_preview}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <PriorityBadge priority={ticket.priority} />
                      <p className="font-mono text-[12px] text-white/30">
                        {formatTicketNumber(ticket.ticket_number)} ·{" "}
                        {formatRelativeTime(ticket.last_message_at ?? ticket.created_at)}
                      </p>
                      <p className="text-[12px] text-white/30">{ticket.category ?? "General"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyQueue({
  query,
  status,
  totalInOrg,
  isDemo,
}: {
  query: string;
  status: TicketStatus;
  totalInOrg: number;
  isDemo: boolean;
}) {
  if (query) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center px-8 py-12 text-center">
        <Inbox className="size-8 text-white/25" />
        <p className="mt-4 text-[16px] font-medium text-white">No matching tickets</p>
        <p className="mt-2 max-w-sm text-[14px] leading-6 text-white/40">
          Nothing in this queue matches “{query}”.
        </p>
      </div>
    );
  }

  if (totalInOrg === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center px-8 py-12 text-center">
        <p className="text-[16px] font-medium text-white">The inbox is empty</p>
        <p className="mt-2 max-w-md text-[14px] leading-6 text-white/40">
          {isDemo
            ? "Load a sample queue, or forward customer mail to the inbound address in Settings."
            : "Forward customer mail to the inbound address in Settings. New messages become tickets."}
        </p>
        <div className="mt-6">
          {isDemo ? (
            <LoadSampleTickets />
          ) : (
            <Link href="/dashboard/settings#mailbox" className="text-[14px] font-medium text-primary">
              Open mailbox
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-8 py-12 text-center">
      <Inbox className="size-8 text-white/25" />
      <p className="mt-4 text-[16px] font-medium text-white">Nothing {QUEUE_LABEL[status]}</p>
      <p className="mt-2 max-w-sm text-[14px] leading-6 text-white/40">
        This queue is clear. Switch status on the left to see the rest of the inbox.
      </p>
    </div>
  );
}

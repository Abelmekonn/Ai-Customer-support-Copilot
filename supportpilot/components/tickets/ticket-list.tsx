"use client";

import { LoadSampleTickets } from "@/components/demo/load-sample-tickets";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { TicketPriority, TicketStatus, TicketWithCustomer } from "@/lib/types";
import { formatRelativeTime, formatTicketNumber } from "@/lib/utils";
import { Inbox, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PRIORITY_VARIANT: Record<TicketPriority, "high" | "medium" | "low"> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const QUEUE_LABEL: Record<TicketStatus, string> = {
  open: "open",
  pending: "pending",
  resolved: "resolved",
};

export function TicketList({
  tickets,
  status,
  totalInOrg,
  isDemo,
}: {
  tickets: TicketWithCustomer[];
  status: TicketStatus;
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-black">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            defaultValue={query}
            placeholder="Search subject, customer, or category"
            className="h-11 rounded-xl border-white/15 bg-[#111] pl-10 text-[14px] placeholder:text-white/35"
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
      </div>
      <div className={`min-h-0 flex-1 overflow-auto ${pending ? "opacity-70" : ""}`}>
        {tickets.length === 0 ? (
          <EmptyQueue query={query} status={status} totalInOrg={totalInOrg} isDemo={isDemo} />
        ) : (
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border-b border-white/8">
                <Link
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="block px-6 py-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-white/40">
                          {formatTicketNumber(ticket.ticket_number)}
                        </span>
                        <p className="truncate text-[15px] font-medium text-white">
                          {ticket.subject}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-[13px] text-white/50">
                        {ticket.customer.name}
                        {ticket.last_message_preview
                          ? ` · ${ticket.last_message_preview}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-white/40">
                      {formatRelativeTime(ticket.last_message_at ?? ticket.created_at)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[12px] text-white/45">
                      {ticket.category ?? "General"}
                    </span>
                    <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
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
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
        <Inbox className="size-8 text-white/30" />
        <p className="mt-4 text-[16px] font-medium text-white">No matching tickets</p>
        <p className="mt-2 max-w-sm text-[14px] leading-6 text-white/50">
          Nothing in this queue matches “{query}”.
        </p>
      </div>
    );
  }

  if (totalInOrg === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15">
          <Inbox className="size-6 text-primary" />
        </div>
        <p className="mt-5 text-[18px] font-medium text-white">The inbox is empty</p>
        <p className="mt-2 max-w-md text-[14px] leading-6 text-white/50">
          {isDemo
            ? "Load a sample queue, or forward customer mail to the inbound address in Settings."
            : "Forward customer mail to the inbound address in Settings. New messages become tickets."}
        </p>
        <div className="mt-6">
          {isDemo ? <LoadSampleTickets /> : (
            <Link href="/dashboard/settings" className="text-[14px] font-medium text-primary">
              Open inbound settings
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
      <Inbox className="size-8 text-white/30" />
      <p className="mt-4 text-[16px] font-medium text-white">
        Nothing {QUEUE_LABEL[status]}
      </p>
      <p className="mt-2 max-w-sm text-[14px] leading-6 text-white/50">
        This queue is clear. Switch status on the left to see the rest of the inbox.
      </p>
    </div>
  );
}

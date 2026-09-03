import Link from "next/link";
import { Inbox, Ticket, Timer, Users } from "lucide-react";
import { LoadSampleTickets } from "@/components/demo/load-sample-tickets";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CustomerDirectoryRow } from "@/lib/types";
import { formatRelativeTime, formatTicketNumber, initials } from "@/lib/utils";

const FILTERS = [
  { id: "all" as const, label: "All" },
  { id: "open" as const, label: "Need a reply" },
  { id: "pending" as const, label: "Waiting" },
];

export function CustomerDirectory({
  rows,
  filter,
  query,
  isDemo,
}: {
  rows: CustomerDirectoryRow[];
  filter: "all" | "open" | "pending";
  query: string;
  isDemo: boolean;
}) {
  const people = rows.length;
  const needReply = rows.filter((row) => row.openCount > 0).length;
  const waiting = rows.filter((row) => row.pendingCount > 0).length;
  const tickets = rows.reduce((sum, row) => sum + row.ticketCount, 0);

  const needle = query.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (filter === "open" && row.openCount === 0) return false;
    if (filter === "pending" && row.pendingCount === 0) return false;
    if (!needle) return true;
    const haystack = `${row.name} ${row.email} ${row.lastTicket?.subject ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="typo-heading-1">Customers</h1>
          <p className="mt-2 text-[14px] text-white/45">People who have written into this workspace.</p>
        </div>
        <Link
          href="/dashboard/tickets"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06]"
        >
          Open inbox
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="People" value={String(people)} href={href({ query, filter: "all" })} icon={Users} hint="From inbound mail" />
        <KpiCard
          label="Need a reply"
          value={String(needReply)}
          href={href({ query, filter: "open" })}
          icon={Inbox}
          hint={needReply > 0 ? "Have an open ticket" : "None waiting on you"}
        />
        <KpiCard
          label="Waiting"
          value={String(waiting)}
          href={href({ query, filter: "pending" })}
          icon={Timer}
          hint={waiting > 0 ? "Pending on the customer" : "None pending"}
        />
        <KpiCard
          label="Tickets"
          value={String(tickets)}
          href="/dashboard/tickets"
          icon={Ticket}
          hint="Across this directory"
        />
      </div>

      {people === 0 ? (
        <EmptyDirectory isDemo={isDemo} />
      ) : (
        <section className="rounded-2xl bg-[#111]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-medium">Directory</h2>
              <p className="mt-0.5 text-[13px] text-white/35">
                {visible.length === rows.length
                  ? `${visible.length} ${visible.length === 1 ? "person" : "people"}`
                  : `${visible.length} of ${rows.length}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <Link
                    key={item.id}
                    href={href({ query, filter: item.id })}
                    className={
                      active
                        ? "rounded-full bg-[#1a1a1a] px-3 py-1.5 text-[13px] font-medium text-white"
                        : "rounded-full px-3 py-1.5 text-[13px] text-white/40 hover:bg-white/[0.04] hover:text-white"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="border-t border-white/[0.05] px-5 py-8 text-[14px] text-white/40">
              No one matches that search.
            </p>
          ) : (
            <ul>
              {visible.map((row) => (
                <CustomerRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function CustomerRow({ row }: { row: CustomerDirectoryRow }) {
  const href =
    row.openTicketId
      ? `/dashboard/tickets/${row.openTicketId}`
      : row.lastTicket
        ? `/dashboard/tickets/${row.lastTicket.id}`
        : `/dashboard/tickets?q=${encodeURIComponent(row.email)}`;

  return (
    <li className="border-t border-white/[0.05]">
      <Link href={href} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
        <Avatar className="size-10">
          <AvatarFallback className="bg-white/10 text-[12px] font-semibold text-white">
            {initials(row.name || row.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{row.name || row.email}</p>
          <p className="mt-0.5 truncate text-[13px] text-white/40">{row.email}</p>
          {row.lastTicket ? (
            <p className="mt-1 truncate text-[13px] text-white/35">
              {formatTicketNumber(row.lastTicket.ticket_number)} · {row.lastTicket.subject}
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-white/30">No tickets yet</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <QueueCounts open={row.openCount} pending={row.pendingCount} resolved={row.resolvedCount} />
          <p className="text-[12px] text-white/30">
            {row.lastTicket ? formatRelativeTime(row.lastTicket.last_message_at) : null}
          </p>
        </div>
      </Link>
    </li>
  );
}

function QueueCounts({
  open,
  pending,
  resolved,
}: {
  open: number;
  pending: number;
  resolved: number;
}) {
  if (open === 0 && pending === 0 && resolved === 0) {
    return <span className="text-[12px] text-white/30">0 tickets</span>;
  }

  return (
    <span className="flex items-center gap-2 text-[12px] tabular-nums">
      {open > 0 ? (
        <span className="text-[#fa520f]">
          {open} open
        </span>
      ) : null}
      {pending > 0 ? (
        <span className="text-[#4d8bff]">
          {pending} pending
        </span>
      ) : null}
      {open === 0 && pending === 0 ? (
        <span className="text-white/35">{resolved} resolved</span>
      ) : null}
    </span>
  );
}

function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  href: string;
  icon: typeof Inbox;
  hint: string;
}) {
  return (
    <Link href={href} className="rounded-2xl bg-[#111] p-5 transition-colors hover:bg-[#161616]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-white/45">{label}</p>
        <Icon className="size-4 text-white/25" strokeWidth={1.75} />
      </div>
      <p className="mt-4 font-[family-name:var(--font-display)] text-[34px] leading-none tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-[13px] text-white/40">{hint}</p>
    </Link>
  );
}

function EmptyDirectory({ isDemo }: { isDemo: boolean }) {
  return (
    <section className="rounded-2xl bg-[#111] px-5 py-8">
      <h2 className="text-[15px] font-medium">No one has written in yet</h2>
      <p className="mt-2 max-w-lg text-[14px] leading-6 text-white/40">
        Customers appear here when inbound mail creates a ticket. This is not a CRM you fill by hand.
      </p>
      {isDemo ? (
        <div className="mt-5">
          <LoadSampleTickets />
        </div>
      ) : (
        <Link href="/dashboard/settings#mailbox" className="mt-5 inline-block text-[13px] font-medium text-primary">
          Connect mailbox
        </Link>
      )}
    </section>
  );
}

function href({ query, filter }: { query: string; filter: "all" | "open" | "pending" }) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filter !== "all") params.set("filter", filter);
  const qs = params.toString();
  return qs ? `/dashboard/customers?${qs}` : "/dashboard/customers";
}

import Link from "next/link";
import { LoadSampleTickets } from "@/components/demo/load-sample-tickets";
import { PriorityBadge, StatusBadge } from "@/components/tickets/ticket-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getDashboardStats, getOrganization, listRecentTickets } from "@/lib/data";
import { formatRelativeTime, formatTicketNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [org, stats, recent] = await Promise.all([
    getOrganization(user.organization_id),
    getDashboardStats(user.organization_id),
    listRecentTickets(user.organization_id),
  ]);

  const totalTickets = stats.openTickets + stats.pendingTickets + stats.resolvedTickets;

  return (
    <div className="mx-auto h-full max-w-6xl space-y-8 overflow-y-auto p-6">
      <div>
        <h1 className="typo-heading-1">
          {org?.name ?? "Workspace"}
        </h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          {totalTickets === 0
            ? "Load a realistic inbox to walk the ticket workspace before RAG is wired up."
            : "Open tickets, copilot assists, and the queue that needs a human."}
        </p>
      </div>

      {totalTickets === 0 ? <LoadSampleTickets /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open tickets" value={stats.openTickets} />
        <Stat label="Pending" value={stats.pendingTickets} />
        <Stat label="AI assisted" value={stats.aiAssisted} hint="Generations stored for this org" />
        <Stat label="Customers" value={stats.customers} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent tickets</CardTitle>
          <Link href="/dashboard/tickets" className="text-[14px] font-medium text-primary">
            Open inbox
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="px-6 pb-6 text-[14px] text-steel">Nothing in the queue yet.</p>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {recent.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-cream-light"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{ticket.subject}</p>
                      <p className="text-[14px] text-steel">
                        {ticket.customer.name} · {ticket.category}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="hidden w-28 text-right font-mono text-[13px] text-steel sm:block">
                      {formatTicketNumber(ticket.ticket_number)}
                    </span>
                    <span className="hidden w-28 text-right text-[13px] text-steel md:block">
                      {formatRelativeTime(ticket.last_message_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <CardHeader>
        <p className="typo-eyebrow text-steel">{label}</p>
        <p className="typo-stat">{value}</p>
        {hint ? <p className="text-[13px] text-steel">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

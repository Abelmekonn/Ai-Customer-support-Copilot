import { Suspense } from "react";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { getCurrentUser, getOrganization, listTickets } from "@/lib/data";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const status = params.status ?? "open";
  const query = (params.q ?? "").trim().toLowerCase();

  const [org, open, pending, resolved, tickets] = await Promise.all([
    getOrganization(user.organization_id),
    listTickets(user.organization_id, "open"),
    listTickets(user.organization_id, "pending"),
    listTickets(user.organization_id, "resolved"),
    listTickets(user.organization_id, status),
  ]);

  const filtered = query
    ? tickets.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(query) ||
          ticket.customer.name.toLowerCase().includes(query) ||
          (ticket.category ?? "").toLowerCase().includes(query),
      )
    : tickets;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      <Suspense>
        <TicketFilters
          counts={{
            open: open.length,
            pending: pending.length,
            resolved: resolved.length,
          }}
        />
      </Suspense>
      <TicketList
        tickets={filtered}
        status={status as "open" | "pending" | "resolved"}
        totalInOrg={open.length + pending.length + resolved.length}
        isDemo={org?.is_demo !== false}
      />
    </div>
  );
}

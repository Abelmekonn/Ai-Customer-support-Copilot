import { HomeGreeting, KpiRow } from "@/components/dashboard/home-greeting";
import { HomeSearch } from "@/components/dashboard/home-search";
import { NeedsYouList } from "@/components/dashboard/needs-you-list";
import { SetupStrip } from "@/components/dashboard/setup-strip";
import { WorkspaceHealth } from "@/components/dashboard/workspace-health";
import { getBillingSnapshot } from "@/lib/billing/usage";
import { getChannelAccount } from "@/lib/channels/email/account";
import { getCurrentUser, getOrganization, getWorkspaceHome } from "@/lib/data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [organization, home, billing, channel] = await Promise.all([
    getOrganization(user.organization_id),
    getWorkspaceHome(user.organization_id, user.id),
    getBillingSnapshot(user.organization_id),
    getChannelAccount(user.organization_id),
  ]);

  const hasPolicy = home.documents.total > 0;
  const hasInbound = Boolean(channel);
  const hasTickets = home.ticketCount > 0;
  const showQueue = home.needsYou.length > 0;
  const primary = primaryAction({
    nextTicketId: home.nextTicket?.id ?? null,
    hasPolicy,
    hasInbound,
  });

  const health = (
    <WorkspaceHealth
      openCount={home.openCount}
      pendingCount={home.pendingCount}
      resolvedCount={home.resolvedCount}
      drafts={billing.drafts}
      documents={home.documents}
      inboundAddress={channel?.inbound_address ?? null}
    />
  );

  const setup = (
    <SetupStrip
      hasPolicy={hasPolicy}
      hasInbound={hasInbound}
      hasTickets={hasTickets}
      isDemo={organization?.is_demo !== false}
    />
  );

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#0a0a0a]">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <HomeSearch />
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-7 pb-16">
        <HomeGreeting fullName={user.full_name} primary={primary} />
        <KpiRow
          open={home.openCount}
          unassigned={home.unassignedCount}
          pending={home.pendingCount}
          draftsUsed={billing.drafts.used}
          draftsCap={billing.drafts.cap}
          draftsRemaining={billing.drafts.remaining}
          indexed={home.documents.indexed}
          failed={home.documents.failed}
        />
        {showQueue ? (
          <>
            <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
              <NeedsYouList tickets={home.needsYou} />
              {health}
            </div>
            {setup}
          </>
        ) : (
          <>
            {setup}
            <div className="grid items-stretch gap-3 lg:grid-cols-2">
              <NeedsYouList tickets={home.needsYou} />
              {health}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function primaryAction({
  nextTicketId,
  hasPolicy,
  hasInbound,
}: {
  nextTicketId: string | null;
  hasPolicy: boolean;
  hasInbound: boolean;
}) {
  if (nextTicketId) {
    return { href: `/dashboard/tickets/${nextTicketId}`, label: "Open next ticket" };
  }
  if (!hasPolicy) {
    return { href: "/dashboard/knowledge", label: "Upload policy" };
  }
  if (!hasInbound) {
    return { href: "/dashboard/settings#mailbox", label: "Connect mailbox" };
  }
  return { href: "/dashboard/tickets", label: "Open inbox" };
}

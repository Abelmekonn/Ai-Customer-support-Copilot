import { InboundMailboxCard } from "@/components/settings/inbound-mailbox-card";
import { OutboundMailboxCard } from "@/components/settings/outbound-mailbox-card";
import { PlanCard } from "@/components/settings/plan-card";
import { SettingsForm } from "@/components/settings/settings-form";
import { SettingsNav } from "@/components/settings/settings-shell";
import { TeamCard } from "@/components/settings/team-card";
import { ensureChannelAccount, inboundWebhookUrl } from "@/lib/channels/email/account";
import { outboundFromLabel, outboundConfig } from "@/lib/channels/email/config";
import { formatOutboundFrom } from "@/lib/channels/email/headers";
import { canInviteMembers, canManageBilling, canManageMailbox } from "@/lib/auth/roles";
import { PLAN_IDS, priceIdForPlan, type PlanId } from "@/lib/billing/plans";
import { stripeSecretConfigured } from "@/lib/billing/stripe";
import { getBillingSnapshot } from "@/lib/billing/usage";
import { getCurrentUser, getOrganization, listInvites, listTeammates } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const organization = await getOrganization(user.organization_id);
  if (!organization) notFound();

  const { billing: billingQuery } = await searchParams;
  const [channel, teammates, invites, billing] = await Promise.all([
    ensureChannelAccount({
      organizationId: organization.id,
      slug: organization.slug,
    }),
    listTeammates(organization.id),
    listInvites(organization.id, canInviteMembers(user.role)),
    getBillingSnapshot(organization.id),
  ]);

  const checkoutPrices = Object.fromEntries(
    PLAN_IDS.map((id) => [id, Boolean(priceIdForPlan(id))]),
  ) as Partial<Record<PlanId, boolean>>;

  const hasActiveSubscription =
    Boolean(billing.stripeSubscriptionId) &&
    ["active", "trialing", "past_due"].includes(billing.subscriptionStatus);

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <header className="max-w-2xl">
          <h1 className="typo-heading-1">Settings</h1>
          <p className="typo-subtitle mt-2 text-ink-tint">
            Plan usage, workspace identity, teammates, and the mailbox this team sends from.
          </p>
        </header>
        <SettingsNav />
        <div className="mt-8 space-y-6">
          <PlanCard
            planId={billing.plan.id}
            subscriptionStatus={billing.subscriptionStatus}
            drafts={billing.drafts}
            seatsUsed={billing.seats.used}
            seats={billing.seats.seats}
            canManage={canManageBilling(user.role)}
            stripeConfigured={stripeSecretConfigured()}
            hasCustomer={Boolean(billing.stripeCustomerId)}
            hasActiveSubscription={hasActiveSubscription}
            checkoutPrices={checkoutPrices}
            billingQuery={billingQuery}
          />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <SettingsForm user={user} organization={organization} />
            <TeamCard
              members={teammates}
              invites={invites}
              canInvite={canInviteMembers(user.role)}
              seatsBlocked={billing.seats.blocked}
              seatsLabel={`${billing.seats.used} of ${billing.seats.seats} seats`}
            />
          </div>
          <div id="mailbox" className="grid scroll-mt-24 items-start gap-6 lg:grid-cols-2">
            <InboundMailboxCard
              inboundAddress={channel.inbound_address}
              webhookUrl={inboundWebhookUrl()}
              webhookSecret={channel.webhook_secret}
              canManage={canManageMailbox(user.role)}
            />
            <OutboundMailboxCard
              configured={outboundConfig().configured}
              fromAddress={
                outboundFromLabel()
                  ? formatOutboundFrom(outboundFromLabel() as string, organization.from_name)
                  : organization.from_name
              }
              replyTo={organization.reply_to || channel.inbound_address}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

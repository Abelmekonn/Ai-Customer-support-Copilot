import { InboundMailboxCard } from "@/components/settings/inbound-mailbox-card";
import { SettingsForm } from "@/components/settings/settings-form";
import { ensureChannelAccount, inboundWebhookUrl } from "@/lib/channels/email/account";
import { getCurrentUser, getOrganization } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const organization = await getOrganization(user.organization_id);
  if (!organization) notFound();

  const channel = await ensureChannelAccount({
    organizationId: organization.id,
    slug: organization.slug,
  });

  return (
    <div className="h-full min-h-0 w-full space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="typo-heading-1">Settings</h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          Workspace identity and the inbound mailbox that creates tickets.
        </p>
      </div>
      <SettingsForm user={user} organization={organization} />
      <InboundMailboxCard
        inboundAddress={channel.inbound_address}
        webhookUrl={inboundWebhookUrl()}
        webhookSecret={channel.webhook_secret}
        canManage={user.role === "admin" || user.role === "manager"}
      />
    </div>
  );
}

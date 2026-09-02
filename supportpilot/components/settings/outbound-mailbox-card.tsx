import { SettingsSection } from "@/components/settings/settings-shell";

export function OutboundMailboxCard({
  configured,
  fromAddress,
  replyTo,
}: {
  configured: boolean;
  fromAddress: string | null;
  replyTo: string;
}) {
  return (
    <SettingsSection
      id="outbound"
      title="Outbound email"
      description="Send on a ticket goes out through Resend. Reply-To stays on your inbound address so the thread holds. The copilot never sends on its own."
    >
      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium">From</dt>
          <dd className="mt-1 font-mono text-[13px] text-ink-tint">
            {configured && fromAddress ? fromAddress : "Not configured"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Reply-To</dt>
          <dd className="mt-1 font-mono text-[13px] text-ink-tint">{replyTo}</dd>
        </div>
      </dl>
      {!configured ? (
        <p className="mt-4 text-[13px] text-steel">
          Add RESEND_API_KEY and RESEND_FROM on the server, then retry a reply.
        </p>
      ) : null}
    </SettingsSection>
  );
}

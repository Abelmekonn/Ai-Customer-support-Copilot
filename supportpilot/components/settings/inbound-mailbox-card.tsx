"use client";

import { useActionState } from "react";
import { rotateInboundSecretAction } from "@/app/dashboard/settings/actions";
import { CopyField } from "@/components/settings/copy-field";
import { SettingsSection } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";

const initial: { error?: string; success?: string } = {};

export function InboundMailboxCard({
  inboundAddress,
  webhookUrl,
  webhookSecret,
  canManage,
}: {
  inboundAddress: string;
  webhookUrl: string;
  webhookSecret: string;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(rotateInboundSecretAction, initial);

  return (
    <SettingsSection
      id="inbound"
      title="Inbound email"
      description="Forward Gmail or Outlook here. New mail becomes a ticket. Replies with In-Reply-To join the same thread."
    >
      <div className="space-y-4">
        <CopyField
          id="inboundAddress"
          label="Inbound address"
          value={inboundAddress}
          hint="Forward customer mail here. SupportPilot never auto-replies."
        />
        <CopyField
          id="webhookUrl"
          label="Webhook URL"
          value={webhookUrl}
          hint="POST JSON from Resend or Postmark. Include the secret below."
        />
        <CopyField
          id="webhookSecret"
          label="Webhook secret"
          value={webhookSecret}
          secret
          hint="Send as x-inbound-secret or Authorization Bearer. Svix signatures work if the secret starts with whsec_."
        />
        {canManage ? (
          <form action={action}>
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {pending ? "Rotating…" : "Rotate secret"}
            </Button>
            {state.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}
            {state.success ? <p className="mt-2 text-sm text-primary">{state.success}</p> : null}
          </form>
        ) : (
          <p className="text-[13px] text-steel">Ask an admin to rotate the webhook secret.</p>
        )}
      </div>
    </SettingsSection>
  );
}

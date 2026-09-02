"use client";

import { useActionState, type ReactNode } from "react";
import { updateProfileAction, type ActionState } from "@/app/dashboard/actions";
import { SettingsSection } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canEditWorkspace, canManageMailbox } from "@/lib/auth/roles";
import type { AppUser, Organization } from "@/lib/types";

const initial: ActionState = {};

export function SettingsForm({ user, organization }: { user: AppUser; organization: Organization }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const canEditOrg = canEditWorkspace(user.role);
  const canEditMailbox = canManageMailbox(user.role);

  return (
    <SettingsSection
      id="workspace"
      title="Workspace"
      description="How this team appears on drafts and outbound mail."
    >
      <form action={action} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="fullName">Display name</Label>
            <Input id="fullName" name="fullName" defaultValue={user.full_name} required />
          </Field>
          <Field>
            <Label htmlFor="organizationName">Organization</Label>
            <Input
              id="organizationName"
              name="organizationName"
              defaultValue={organization.name}
              disabled={!canEditOrg}
            />
          </Field>
          <Field>
            <Label htmlFor="role">Your role</Label>
            <Input id="role" value={user.role} disabled className="capitalize" />
          </Field>
        </div>
        {canEditMailbox ? (
          <div className="grid gap-4 border-t border-hairline-soft pt-6 sm:grid-cols-2">
            <Field>
              <Label htmlFor="fromName">From name</Label>
              <Input
                id="fromName"
                name="fromName"
                defaultValue={organization.from_name ?? ""}
                placeholder="Support"
              />
            </Field>
            <Field>
              <Label htmlFor="replyTo">Reply-To</Label>
              <Input
                id="replyTo"
                name="replyTo"
                type="email"
                defaultValue={organization.reply_to ?? ""}
                placeholder="Uses the inbound address if blank"
              />
            </Field>
            <Field className="sm:col-span-2">
              <Label htmlFor="brandTone">Brand tone</Label>
              <Input
                id="brandTone"
                name="brandTone"
                defaultValue={organization.brand_tone ?? ""}
                placeholder="Warm, concise, never promise refunds"
                maxLength={200}
              />
              <p className="text-[13px] text-steel">One line. Used when the copilot drafts a reply.</p>
            </Field>
          </div>
        ) : null}
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-primary">{state.success}</p> : null}
        <Button variant="dark" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </SettingsSection>
  );
}

function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-2 ${className ?? ""}`}>{children}</div>;
}

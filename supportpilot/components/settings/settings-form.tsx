"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppUser, Organization } from "@/lib/types";

const initial: ActionState = {};

export function SettingsForm({ user, organization }: { user: AppUser; organization: Organization }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const canEditOrg = user.role === "admin" || user.role === "manager";

  return (
    <form action={action} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Display name</Label>
        <Input id="fullName" name="fullName" defaultValue={user.full_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization</Label>
        <Input
          id="organizationName"
          name="organizationName"
          defaultValue={organization.name}
          disabled={!canEditOrg}
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Input value={user.role} disabled className="capitalize" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-primary">{state.success}</p> : null}
      <Button variant="dark" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

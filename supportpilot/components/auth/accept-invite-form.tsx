"use client";

import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteState } from "@/app/(auth)/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicInvite } from "@/lib/team/invites";

const initial: AcceptInviteState = {};

export function AcceptInviteForm({
  token,
  invite,
}: {
  token: string;
  invite: PublicInvite;
}) {
  const [state, action, pending] = useActionState(acceptInviteAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label>Work email</Label>
        <Input value={invite.email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Your name</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          defaultValue={state.fields?.fullName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button variant="dark" className="w-full" disabled={pending}>
        {pending ? "Joining…" : `Join as ${invite.role}`}
      </Button>
    </form>
  );
}

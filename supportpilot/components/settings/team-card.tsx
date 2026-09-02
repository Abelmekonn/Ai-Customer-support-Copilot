"use client";

import { useActionState } from "react";
import {
  inviteMemberAction,
  revokeInviteAction,
  type TeamActionState,
} from "@/app/dashboard/settings/team-actions";
import { SettingsSection } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUrl } from "@/lib/team/invites";
import type { AppUser, Invite, UserRole } from "@/lib/types";

const initial: TeamActionState = {};

export function TeamCard({
  members,
  invites,
  canInvite,
  seatsBlocked = false,
  seatsLabel,
}: {
  members: AppUser[];
  invites: Invite[];
  canInvite: boolean;
  seatsBlocked?: boolean;
  seatsLabel?: string;
}) {
  const pending = invites.filter((invite) => !invite.accepted_at);
  const [state, action, pendingSubmit] = useActionState(inviteMemberAction, initial);

  return (
    <SettingsSection
      id="team"
      title="Team"
      description={
        seatsLabel
          ? `${seatsLabel}. Admins manage docs and billing. Agents work the queue.`
          : "Admins manage docs and billing. Agents work the queue."
      }
    >
      <ul className="divide-y divide-hairline-soft rounded-lg border border-hairline-strong">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 px-3 py-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-[12px] font-medium"
            >
              {initials(member.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">{member.full_name}</p>
              <p className="truncate text-[13px] text-steel">{member.email}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] capitalize text-steel">
              {member.role}
            </span>
          </li>
        ))}
      </ul>
      {pending.length > 0 ? (
        <div className="mt-5 space-y-2">
          <p className="text-[13px] font-medium">Pending invites</p>
          <ul className="space-y-2">
            {pending.map((invite) => (
              <PendingInviteRow key={invite.id} invite={invite} canInvite={canInvite} />
            ))}
          </ul>
        </div>
      ) : null}
      {canInvite && !seatsBlocked ? (
        <form action={action} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Invite email</Label>
              <Input id="inviteEmail" name="email" type="email" required placeholder="agent@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <select
                id="inviteRole"
                name="role"
                defaultValue="agent"
                className="flex h-11 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-base"
              >
                {(["agent", "manager", "admin"] as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-primary">{state.success}</p> : null}
          <Button type="submit" variant="outline" size="sm" disabled={pendingSubmit}>
            {pendingSubmit ? "Inviting…" : "Send invite"}
          </Button>
        </form>
      ) : canInvite && seatsBlocked ? (
        <p className="mt-4 text-[13px] text-steel">
          This workspace is at its seat cap. Upgrade the plan or revoke a pending invite.
        </p>
      ) : (
        <p className="mt-4 text-[13px] text-steel">Ask an admin to invite teammates.</p>
      )}
    </SettingsSection>
  );
}

function PendingInviteRow({ invite, canInvite }: { invite: Invite; canInvite: boolean }) {
  const link = inviteUrl(invite.token);

  return (
    <li className="rounded-lg border border-hairline-strong px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px]">{invite.email}</p>
          <p className="text-[12px] capitalize text-steel">{invite.role}, pending</p>
        </div>
        {canInvite ? (
          <form action={revokeInviteAction}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <Button type="submit" variant="ghost" size="sm" className="h-8 px-2 text-[12px]">
              Revoke
            </Button>
          </form>
        ) : null}
      </div>
      {canInvite ? (
        <button
          type="button"
          className="mt-2 truncate text-left text-[12px] text-primary"
          onClick={() => navigator.clipboard.writeText(link)}
        >
          Copy invite link
        </button>
      ) : null}
    </li>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?").slice(0, 2);
}

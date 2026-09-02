import { describe, expect, it } from "vitest";
import { canInviteMembers, canManageBilling, canManageKnowledge, canViewAnalytics } from "@/lib/auth/roles";
import { formatOutboundFrom } from "@/lib/channels/email/headers";
import { inviteExpiresAt, INVITE_TTL_DAYS, newInviteToken, normalizeInviteEmail } from "@/lib/team/invites";

describe("roles", () => {
  it("lets admins manage knowledge, invites, and billing, not agents", () => {
    expect(canManageKnowledge("admin")).toBe(true);
    expect(canManageKnowledge("agent")).toBe(false);
    expect(canManageKnowledge("manager")).toBe(false);
    expect(canInviteMembers("admin")).toBe(true);
    expect(canInviteMembers("agent")).toBe(false);
    expect(canManageBilling("admin")).toBe(true);
    expect(canManageBilling("agent")).toBe(false);
    expect(canManageBilling("manager")).toBe(false);
  });

  it("hides analytics from agents", () => {
    expect(canViewAnalytics("manager")).toBe(true);
    expect(canViewAnalytics("agent")).toBe(false);
  });
});

describe("invites", () => {
  it("normalizes emails and mints opaque tokens", () => {
    expect(normalizeInviteEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(newInviteToken().startsWith("inv_")).toBe(true);
    expect(inviteExpiresAt(new Date("2026-09-02T00:00:00Z")).toISOString()).toBe(
      new Date("2026-09-16T00:00:00Z").toISOString(),
    );
    expect(INVITE_TTL_DAYS).toBe(14);
  });
});

describe("formatOutboundFrom", () => {
  it("prefers the workspace from-name over the provider default", () => {
    expect(formatOutboundFrom("Support <mail@example.com>", "Acme Help")).toBe(
      "Acme Help <mail@example.com>",
    );
  });
});

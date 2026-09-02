import { createAdminClient } from "@/lib/supabase/admin";
import {
  draftCapMessage,
  evaluateDraftCap,
  evaluateSeatCap,
  getPlan,
  utcMonthStart,
  type DraftCapResult,
  type Plan,
} from "@/lib/billing/plans";

export type BillingSnapshot = {
  plan: Plan;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  drafts: DraftCapResult;
  seats: ReturnType<typeof evaluateSeatCap>;
  message: string | null;
};

export async function countMonthlyDrafts(organizationId: string, now = new Date()) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("usage_events")
    .select("quantity")
    .eq("organization_id", organizationId)
    .eq("type", "draft")
    .gte("created_at", utcMonthStart(now).toISOString());

  if (error) {
    throw new Error("Could not read draft usage for this workspace.");
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
}

export async function getBillingSnapshot(organizationId: string): Promise<BillingSnapshot> {
  const admin = createAdminClient();
  const [{ data: organization }, used, { count: memberCount }, { count: pendingInvites }] =
    await Promise.all([
      admin
        .from("organizations")
        .select("plan_id, subscription_status, stripe_customer_id, stripe_subscription_id")
        .eq("id", organizationId)
        .single(),
      countMonthlyDrafts(organizationId),
      admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      admin
        .from("invites")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("accepted_at", null),
    ]);

  const plan = getPlan(organization?.plan_id);
  const drafts = evaluateDraftCap({
    organizationId,
    used,
    cap: plan.monthlyDraftCap,
  });
  const seats = evaluateSeatCap({
    seats: plan.seats,
    members: memberCount ?? 0,
    pendingInvites: pendingInvites ?? 0,
  });

  return {
    plan,
    subscriptionStatus: organization?.subscription_status ?? "active",
    stripeCustomerId: organization?.stripe_customer_id ?? null,
    stripeSubscriptionId: organization?.stripe_subscription_id ?? null,
    drafts,
    seats,
    message: draftCapMessage(drafts),
  };
}

export async function assertCanGenerateDraft(organizationId: string) {
  const snapshot = await getBillingSnapshot(organizationId);
  if (snapshot.drafts.blocked) {
    return { ok: false as const, snapshot, error: snapshot.message ?? "Draft cap reached." };
  }
  return { ok: true as const, snapshot };
}

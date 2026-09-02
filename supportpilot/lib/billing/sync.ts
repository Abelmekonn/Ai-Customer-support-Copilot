import { DEFAULT_PLAN_ID, planIdFromPriceId, type PlanId } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

const KNOWN_STATUSES = ["active", "trialing", "past_due", "canceled", "incomplete", "unpaid"] as const;
export type SubscriptionStatus = (typeof KNOWN_STATUSES)[number];

export type SubscriptionSnapshot = {
  organizationId?: string | null;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  status: string;
};

export type OrganizationBillingPatch = {
  plan_id?: PlanId;
  stripe_customer_id?: string;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  subscription_status: SubscriptionStatus;
};

export function normalizeSubscriptionStatus(status: string): SubscriptionStatus {
  return KNOWN_STATUSES.includes(status as SubscriptionStatus)
    ? (status as SubscriptionStatus)
    : "active";
}

export function billingPatchFromSubscription(snapshot: SubscriptionSnapshot): OrganizationBillingPatch {
  const status = normalizeSubscriptionStatus(snapshot.status);
  if (status === "canceled") {
    return {
      plan_id: DEFAULT_PLAN_ID,
      stripe_customer_id: snapshot.customerId,
      stripe_subscription_id: null,
      stripe_price_id: null,
      subscription_status: "canceled",
    };
  }

  const planId = planIdFromPriceId(snapshot.priceId);
  return {
    ...(planId ? { plan_id: planId } : {}),
    stripe_customer_id: snapshot.customerId,
    stripe_subscription_id: snapshot.subscriptionId,
    stripe_price_id: snapshot.priceId,
    subscription_status: status,
  };
}

export async function applyBillingPatch(organizationId: string, patch: OrganizationBillingPatch) {
  const admin = createAdminClient();
  const payload = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
  const { error } = await admin.from("organizations").update(payload).eq("id", organizationId);
  if (error) {
    throw new Error("Could not update workspace billing.");
  }
}

export async function findOrganizationIdForCustomer(customerId: string, metadataOrgId?: string | null) {
  if (metadataOrgId && isUuid(metadataOrgId)) return metadataOrgId;
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

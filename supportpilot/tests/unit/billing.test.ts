import { describe, expect, it } from "vitest";
import {
  billingPatchFromSubscription,
  normalizeSubscriptionStatus,
} from "@/lib/billing/sync";
import {
  evaluateDraftCap,
  evaluateSeatCap,
  getPlan,
  utcMonthStart,
} from "@/lib/billing/plans";

describe("evaluateDraftCap", () => {
  it("blocks only the workspace that hit the monthly cap", () => {
    const capped = evaluateDraftCap({ organizationId: "org-a", used: 40, cap: 40 });
    const other = evaluateDraftCap({ organizationId: "org-b", used: 2, cap: 40 });
    expect(capped.blocked).toBe(true);
    expect(capped.organizationId).toBe("org-a");
    expect(other.blocked).toBe(false);
    expect(other.remaining).toBe(38);
  });

  it("warns at 80% without blocking", () => {
    const warning = evaluateDraftCap({ organizationId: "org-a", used: 32, cap: 40 });
    expect(warning.warning).toBe(true);
    expect(warning.blocked).toBe(false);
  });
});

describe("evaluateSeatCap", () => {
  it("counts members plus pending invites against the plan", () => {
    expect(evaluateSeatCap({ seats: 3, members: 2, pendingInvites: 1 }).blocked).toBe(true);
    expect(evaluateSeatCap({ seats: 3, members: 2, pendingInvites: 0 }).remaining).toBe(1);
  });
});

describe("plans", () => {
  it("defaults unknown plan ids to starter", () => {
    expect(getPlan("nope").id).toBe("starter");
    expect(getPlan("scale").monthlyDraftCap).toBe(1500);
  });

  it("starts the meter at the first of the month UTC", () => {
    expect(utcMonthStart(new Date("2026-09-18T15:00:00Z")).toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("billingPatchFromSubscription", () => {
  it("falls back to starter when Stripe cancels, keeping the customer id", () => {
    const patch = billingPatchFromSubscription({
      customerId: "cus_1",
      subscriptionId: "sub_1",
      priceId: "price_scale",
      status: "canceled",
    });
    expect(patch.plan_id).toBe("starter");
    expect(patch.stripe_subscription_id).toBeNull();
    expect(patch.stripe_customer_id).toBe("cus_1");
    expect(patch.subscription_status).toBe("canceled");
  });

  it("normalizes unknown Stripe statuses", () => {
    expect(normalizeSubscriptionStatus("paused")).toBe("active");
    expect(normalizeSubscriptionStatus("past_due")).toBe("past_due");
  });
});

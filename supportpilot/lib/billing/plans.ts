export const PLAN_IDS = ["starter", "team", "scale"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  seats: number;
  monthlyDraftCap: number;
  priceEnv: "STRIPE_PRICE_STARTER" | "STRIPE_PRICE_TEAM" | "STRIPE_PRICE_SCALE";
  blurb: string;
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    seats: 3,
    monthlyDraftCap: 40,
    priceEnv: "STRIPE_PRICE_STARTER",
    blurb: "Small team, hosted drafts and retrieval.",
  },
  team: {
    id: "team",
    name: "Team",
    seats: 8,
    monthlyDraftCap: 300,
    priceEnv: "STRIPE_PRICE_TEAM",
    blurb: "More seats and a higher monthly draft cap.",
  },
  scale: {
    id: "scale",
    name: "Scale",
    seats: 25,
    monthlyDraftCap: 1500,
    priceEnv: "STRIPE_PRICE_SCALE",
    blurb: "Higher volume without bringing your own keys.",
  },
};

export const DEFAULT_PLAN_ID: PlanId = "starter";
export const DRAFT_CAP_WARNING_RATIO = 0.8;

export function isPlanId(value: string | null | undefined): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

export function getPlan(planId: string | null | undefined): Plan {
  return isPlanId(planId) ? PLANS[planId] : PLANS[DEFAULT_PLAN_ID];
}

export function priceIdForPlan(planId: PlanId) {
  const value = process.env[PLANS[planId].priceEnv]?.trim();
  return value || null;
}

export function planIdFromPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const plan of Object.values(PLANS)) {
    if (process.env[plan.priceEnv]?.trim() === priceId) return plan.id;
  }
  return null;
}

export type DraftCapInput = {
  organizationId: string;
  used: number;
  cap: number;
};

export type DraftCapResult = {
  organizationId: string;
  used: number;
  cap: number;
  remaining: number;
  ratio: number;
  warning: boolean;
  blocked: boolean;
};

export function evaluateDraftCap(input: DraftCapInput): DraftCapResult {
  const used = Math.max(0, input.used);
  const cap = Math.max(0, input.cap);
  const remaining = Math.max(0, cap - used);
  const ratio = cap === 0 ? 1 : used / cap;
  return {
    organizationId: input.organizationId,
    used,
    cap,
    remaining,
    ratio,
    warning: cap > 0 && ratio >= DRAFT_CAP_WARNING_RATIO && used < cap,
    blocked: cap <= 0 || used >= cap,
  };
}

export function draftCapMessage(cap: DraftCapResult) {
  if (cap.blocked) {
    return `This workspace has used all ${cap.cap} drafts this month. Upgrade the plan in Settings. Other workspaces are not affected.`;
  }
  if (cap.warning) {
    return `This workspace has used ${cap.used} of ${cap.cap} drafts this month.`;
  }
  return null;
}

export function evaluateSeatCap(input: { seats: number; members: number; pendingInvites: number }) {
  const used = input.members + input.pendingInvites;
  return {
    used,
    seats: input.seats,
    remaining: Math.max(0, input.seats - used),
    blocked: used >= input.seats,
  };
}

export function utcMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

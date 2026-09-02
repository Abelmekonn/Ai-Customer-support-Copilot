"use client";

import { useActionState } from "react";
import {
  openBillingPortalAction,
  startCheckoutAction,
  type BillingActionState,
} from "@/app/dashboard/settings/billing-actions";
import { SettingsSection } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { PLANS, type DraftCapResult, type PlanId } from "@/lib/billing/plans";

const initial: BillingActionState = {};

export function PlanCard({
  planId,
  subscriptionStatus,
  drafts,
  seatsUsed,
  seats,
  canManage,
  stripeConfigured,
  hasCustomer,
  hasActiveSubscription,
  checkoutPrices,
  billingQuery,
}: {
  planId: PlanId;
  subscriptionStatus: string;
  drafts: DraftCapResult;
  seatsUsed: number;
  seats: number;
  canManage: boolean;
  stripeConfigured: boolean;
  hasCustomer: boolean;
  hasActiveSubscription: boolean;
  checkoutPrices: Partial<Record<PlanId, boolean>>;
  billingQuery?: string;
}) {
  const [checkoutState, checkoutAction, checkoutPending] = useActionState(startCheckoutAction, initial);
  const [portalState, portalAction, portalPending] = useActionState(openBillingPortalAction, initial);
  const current = PLANS[planId];
  const usagePercent = Math.min(100, Math.round(drafts.ratio * 100));
  const barClass = drafts.blocked ? "bg-destructive" : drafts.warning ? "bg-sunshine-700" : "bg-primary";
  const statusLabel = subscriptionStatus.replaceAll("_", " ");

  return (
    <SettingsSection
      id="plan"
      title="Plan"
      description="Drafts and seats are counted for this workspace only. Other customers are not affected."
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[22px] font-medium tracking-tight">{current.name}</p>
          <p className="mt-1 text-[13px] capitalize text-steel">{statusLabel}</p>
        </div>
        {canManage && hasActiveSubscription ? (
          <form action={portalAction}>
            <Button type="submit" variant="dark" size="sm" disabled={portalPending}>
              {portalPending ? "Opening…" : "Manage billing"}
            </Button>
          </form>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <MeterTile
          label="Drafts this month"
          value={`${drafts.used} / ${drafts.cap}`}
          hint={
            drafts.blocked
              ? `All ${drafts.cap} drafts used. Upgrade to keep generating.`
              : drafts.warning
                ? `${drafts.used} of ${drafts.cap} drafts used.`
                : `${drafts.remaining} remaining`
          }
          percent={usagePercent}
          barClass={barClass}
          alert={drafts.blocked || drafts.warning}
        />
        <MeterTile
          label="Seats"
          value={`${seatsUsed} / ${seats}`}
          hint={`${Math.max(0, seats - seatsUsed)} open`}
          percent={seats === 0 ? 100 : Math.min(100, Math.round((seatsUsed / seats) * 100))}
          barClass="bg-white"
        />
      </div>

      {billingQuery === "success" ? (
        <p className="mt-4 text-sm text-primary">Billing updated. Refresh if the plan still looks old.</p>
      ) : null}
      {billingQuery === "canceled" ? (
        <p className="mt-4 text-sm text-steel">Checkout canceled. You are still on {current.name}.</p>
      ) : null}

      {canManage ? (
        <div className="mt-6 space-y-3">
          {!stripeConfigured ? (
            <p className="text-[13px] text-steel">
              Add Stripe keys on the server to subscribe. Caps still apply on Starter.
            </p>
          ) : null}
          {!hasActiveSubscription && stripeConfigured ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {(["team", "scale"] as const).map((id) => {
                const plan = PLANS[id];
                const hasPrice = Boolean(checkoutPrices[id]);
                return (
                  <li
                    key={id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-hairline-strong px-4 py-4"
                  >
                    <div>
                      <p className="text-[14px] font-medium">{plan.name}</p>
                      <p className="mt-1 text-[13px] text-steel">
                        {plan.seats} seats, {plan.monthlyDraftCap} drafts / month
                      </p>
                    </div>
                    {hasPrice ? (
                      <form action={checkoutAction}>
                        <input type="hidden" name="planId" value={id} />
                        <Button type="submit" variant="outline" size="sm" disabled={checkoutPending}>
                          {checkoutPending ? "Redirecting…" : "Subscribe"}
                        </Button>
                      </form>
                    ) : (
                      <p className="shrink-0 text-[12px] text-steel">Add Stripe keys</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {hasCustomer && !hasActiveSubscription && stripeConfigured ? (
            <form action={portalAction}>
              <Button type="submit" variant="ghost" size="sm" disabled={portalPending}>
                {portalPending ? "Opening…" : "Open customer portal"}
              </Button>
            </form>
          ) : null}
          {checkoutState.error ? <p className="text-sm text-destructive">{checkoutState.error}</p> : null}
          {portalState.error ? <p className="text-sm text-destructive">{portalState.error}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-steel">Ask an admin to change the plan.</p>
      )}
    </SettingsSection>
  );
}

function MeterTile({
  label,
  value,
  hint,
  percent,
  barClass,
  alert,
}: {
  label: string;
  value: string;
  hint: string;
  percent: number;
  barClass: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline-strong px-4 py-4">
      <p className="text-[12px] text-steel">{label}</p>
      <p className="mt-2 font-mono text-[22px] tracking-tight">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
      <p className={`mt-2 text-[13px] ${alert ? "text-sunshine-700" : "text-steel"}`}>{hint}</p>
    </div>
  );
}

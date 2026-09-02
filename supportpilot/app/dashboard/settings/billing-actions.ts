"use server";

import { redirect } from "next/navigation";
import { canManageBilling } from "@/lib/auth/roles";
import { isPlanId, priceIdForPlan } from "@/lib/billing/plans";
import { getStripe, siteOrigin } from "@/lib/billing/stripe";
import { requireUser } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

export type BillingActionState = { error?: string };

async function loadOrganization(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", organizationId)
    .single();
  return data;
}

async function ensureStripeCustomer(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  existingCustomerId: string | null;
}) {
  const stripe = getStripe();
  if (!stripe) return null;
  if (input.existingCustomerId) return input.existingCustomerId;

  const customer = await stripe.customers.create({
    email: input.email,
    name: input.organizationName,
    metadata: { organization_id: input.organizationId },
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", input.organizationId);
  if (error) {
    throw new Error("Could not save the Stripe customer for this workspace.");
  }
  return customer.id;
}

export async function startCheckoutAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const user = await requireUser();
  if (!canManageBilling(user.role)) {
    return { error: "Only admins can manage billing." };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Add Stripe keys to subscribe. Caps still apply on the Starter plan." };
  }

  const planId = String(formData.get("planId") ?? "");
  if (!isPlanId(planId) || planId === "starter") {
    return { error: "Choose a Team or Scale plan." };
  }

  const priceId = priceIdForPlan(planId);
  if (!priceId) {
    return { error: "Add Stripe keys to subscribe. Caps still apply on the Starter plan." };
  }

  const organization = await loadOrganization(user.organization_id);
  if (!organization) return { error: "Workspace not found." };

  let checkoutUrl: string;
  try {
    const customerId = await ensureStripeCustomer({
      organizationId: organization.id,
      organizationName: organization.name,
      email: user.email,
      existingCustomerId: organization.stripe_customer_id,
    });
    if (!customerId) {
      return { error: "Add Stripe keys to subscribe. Caps still apply on the Starter plan." };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: organization.id,
      metadata: { organization_id: organization.id },
      subscription_data: { metadata: { organization_id: organization.id } },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteOrigin()}/dashboard/settings?billing=success`,
      cancel_url: `${siteOrigin()}/dashboard/settings?billing=canceled`,
    });
    if (!session.url) {
      return { error: "Stripe did not return a checkout URL. Try again." };
    }
    checkoutUrl = session.url;
  } catch {
    return { error: "Could not start checkout. Try again." };
  }

  redirect(checkoutUrl);
}

export async function openBillingPortalAction(
  _prev: BillingActionState,
  _formData: FormData,
): Promise<BillingActionState> {
  const user = await requireUser();
  if (!canManageBilling(user.role)) {
    return { error: "Only admins can manage billing." };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Add Stripe keys to subscribe. Caps still apply on the Starter plan." };
  }

  const organization = await loadOrganization(user.organization_id);
  if (!organization?.stripe_customer_id) {
    return { error: "Subscribe first, then you can manage billing here." };
  }

  let portalUrl: string;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: `${siteOrigin()}/dashboard/settings`,
    });
    if (!session.url) {
      return { error: "Could not open the billing portal. Try again." };
    }
    portalUrl = session.url;
  } catch {
    return { error: "Could not open the billing portal. Try again." };
  }

  redirect(portalUrl);
}

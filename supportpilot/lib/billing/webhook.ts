import type Stripe from "stripe";
import {
  applyBillingPatch,
  billingPatchFromSubscription,
  findOrganizationIdForCustomer,
  type SubscriptionSnapshot,
} from "@/lib/billing/sync";

function customerIdOf(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function snapshotFromSubscription(subscription: Stripe.Subscription, organizationId?: string | null): SubscriptionSnapshot | null {
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) return null;
  return {
    organizationId: organizationId ?? subscription.metadata?.organization_id ?? null,
    customerId,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0]?.price?.id ?? null,
    status: subscription.status,
  };
}

async function applySnapshot(snapshot: SubscriptionSnapshot) {
  const organizationId = await findOrganizationIdForCustomer(
    snapshot.customerId,
    snapshot.organizationId,
  );
  if (!organizationId) return;
  await applyBillingPatch(organizationId, billingPatchFromSubscription(snapshot));
}

export async function handleStripeEvent(event: Stripe.Event, stripe: Stripe) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organization_id || session.client_reference_id;
      const customerId = customerIdOf(session.customer);
      if (!customerId) return;

      let subscription: Stripe.Subscription | null = null;
      if (typeof session.subscription === "string") {
        subscription = await stripe.subscriptions.retrieve(session.subscription);
      } else if (session.subscription) {
        subscription = session.subscription;
      }

      if (subscription) {
        const snapshot = snapshotFromSubscription(subscription, organizationId);
        if (snapshot) await applySnapshot(snapshot);
        return;
      }

      const orgId = await findOrganizationIdForCustomer(customerId, organizationId);
      if (!orgId) return;
      await applyBillingPatch(orgId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        stripe_price_id: null,
        subscription_status: "incomplete",
      });
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const snapshot = snapshotFromSubscription(event.data.object as Stripe.Subscription);
      if (snapshot) await applySnapshot(snapshot);
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdOf(invoice.customer);
      if (!customerId) return;
      const organizationId = await findOrganizationIdForCustomer(
        customerId,
        invoice.parent?.subscription_details?.metadata?.organization_id,
      );
      if (!organizationId) return;
      const subscription = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id ?? null;
      await applyBillingPatch(organizationId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "past_due",
      });
      return;
    }
    default:
      return;
  }
}

import Stripe from "stripe";

let client: Stripe | null | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (client === undefined) {
    client = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  }
  return client;
}

export function stripeSecretConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

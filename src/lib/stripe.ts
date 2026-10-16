import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null | undefined;

/** Gibt null zurück, wenn kein STRIPE_SECRET_KEY gesetzt ist (Demo-Modus). */
export function getStripe(): Stripe | null {
  if (stripe === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    stripe = key ? new Stripe(key) : null;
  }
  return stripe;
}

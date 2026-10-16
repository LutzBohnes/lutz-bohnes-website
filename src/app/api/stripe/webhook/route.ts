import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { grantPurchasedCredits } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 400 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const credits = Number(session.metadata?.credits);
    if (session.payment_status === "paid" && userId && credits > 0) {
      await db.$transaction((tx) => grantPurchasedCredits(tx, userId, credits, session.id));
    }
  }
  return NextResponse.json({ received: true });
}

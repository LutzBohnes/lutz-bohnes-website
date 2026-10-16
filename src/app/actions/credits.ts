"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { CREDIT_PACKAGES, MIN_PAYOUT_CREDITS } from "@/lib/config";
import { grantPurchasedCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import type { ActionState } from "@/lib/action-state";

export async function buyCredits(formData: FormData) {
  const user = await requireUser();
  const pkg = CREDIT_PACKAGES.find((p) => p.id === formData.get("packageId"));
  if (!pkg) redirect("/credits");

  const stripe = getStripe();
  if (!stripe) {
    // Demo-Modus ohne Stripe: Credits direkt gutschreiben.
    await db.$transaction((tx) =>
      grantPurchasedCredits(tx, user.id, pkg.credits, `demo:${user.id}:${Date.now()}`),
    );
    redirect("/credits?success=1");
  }

  const { siteName } = await getSettings();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pkg.priceCents,
          product_data: { name: `${pkg.credits} Credits – ${siteName}` },
        },
      },
    ],
    metadata: { userId: user.id, credits: String(pkg.credits) },
    success_url: `${appUrl}/credits?success=1`,
    cancel_url: `${appUrl}/credits`,
  });
  redirect(session.url!);
}

export async function requestPayout(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const credits = Number(formData.get("credits"));
  const iban = String(formData.get("iban") ?? "").replace(/\s+/g, "").toUpperCase();
  if (!Number.isInteger(credits) || credits < MIN_PAYOUT_CREDITS) {
    return { error: `Mindestens ${MIN_PAYOUT_CREDITS} Credits pro Auszahlung.` };
  }
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return { error: "Bitte gib eine gültige IBAN an." };

  const ok = await db.$transaction(async (tx) => {
    const res = await tx.user.updateMany({
      where: { id: user.id, earnings: { gte: credits } },
      data: { earnings: { decrement: credits } },
    });
    if (res.count === 0) return false;
    const payout = await tx.payoutRequest.create({ data: { userId: user.id, credits, iban } });
    await tx.creditTransaction.create({
      data: { userId: user.id, type: "PAYOUT", amount: -credits, reference: `payout:${payout.id}` },
    });
    return true;
  });
  if (!ok) return { error: "Dein Verdienst reicht für diese Auszahlung nicht aus." };
  revalidatePath("/konto", "layout");
  return { ok: "Auszahlung beantragt. Sie wird in der Regel innerhalb von 5 Werktagen überwiesen." };
}

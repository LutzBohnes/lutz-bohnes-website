"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditEarnings, InsufficientCreditsError, providerShare, refundCredits, spendCredits } from "@/lib/credits";
import { getSettings } from "@/lib/settings";
import type { ActionState } from "@/lib/action-state";

/**
 * Bestellung: Credits werden sofort vom Guthaben abgebucht und treuhänderisch
 * gehalten. Die Anbieterin erhält ihren Anteil erst, wenn sie die Leistung als
 * erledigt markiert. Bei Stornierung gehen die Credits zurück.
 */
export async function orderListing(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const listingId = String(formData.get("listingId"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  const listing = await db.listing.findUnique({ where: { id: listingId }, include: { provider: true } });
  if (!listing || !listing.active || listing.provider.verification !== "VERIFIED" || listing.provider.banned) {
    return { error: "Diese Anzeige ist nicht verfügbar." };
  }
  if (listing.providerId === user.id) return { error: "Du kannst deine eigene Anzeige nicht buchen." };

  const { platformFeePercent } = await getSettings();
  const fee = listing.priceCredits - providerShare(listing.priceCredits, platformFeePercent);
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          listingId,
          buyerId: user.id,
          providerId: listing.providerId,
          priceCredits: listing.priceCredits,
          platformFee: fee,
          note,
        },
      });
      await spendCredits(tx, user.id, listing.priceCredits, `order:${order.id}`);
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) return { error: e.message };
    throw e;
  }
  revalidatePath("/konto");
  return { ok: "Gebucht! Die Anbieterin wurde benachrichtigt. Du findest die Buchung in deinem Konto." };
}

export async function deliverOrder(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("orderId"));
  const deliveryUrl = String(formData.get("deliveryUrl") ?? "").trim() || null;
  if (deliveryUrl && !/^https?:\/\//.test(deliveryUrl)) return { error: "Der Link muss mit http(s):// beginnen." };

  const done = await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id, providerId: user.id, status: "OPEN" },
      data: { status: "DELIVERED", deliveryUrl },
    });
    if (res.count === 0) return false;
    const order = await tx.order.findUniqueOrThrow({ where: { id } });
    await creditEarnings(tx, user.id, order.priceCredits - order.platformFee, `order:${id}`);
    return true;
  });
  if (!done) return { error: "Buchung nicht gefunden oder bereits abgeschlossen." };
  revalidatePath("/konto");
  return { ok: "Als erledigt markiert. Dein Verdienst wurde gutgeschrieben." };
}

export async function cancelOrder(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("orderId"));
  await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id, status: "OPEN", OR: [{ buyerId: user.id }, { providerId: user.id }] },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) return;
    const order = await tx.order.findUniqueOrThrow({ where: { id } });
    await refundCredits(tx, order.buyerId, order.priceCredits, `order:${id}`);
  });
  revalidatePath("/konto");
}

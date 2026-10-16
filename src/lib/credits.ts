import "server-only";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Nicht genügend Credits. Bitte lade dein Guthaben auf.");
  }
}

/** Anteil der Anbieterin nach Abzug der Plattformgebühr (abgerundet). */
export function providerShare(credits: number, feePercent: number) {
  return Math.floor((credits * (100 - feePercent)) / 100);
}

/** Bucht Credits atomar vom Guthaben ab; wirft, wenn das Guthaben nicht reicht. */
export async function spendCredits(tx: Tx, userId: string, amount: number, reference: string) {
  const res = await tx.user.updateMany({
    where: { id: userId, credits: { gte: amount } },
    data: { credits: { decrement: amount } },
  });
  if (res.count === 0) throw new InsufficientCreditsError();
  await tx.creditTransaction.create({ data: { userId, type: "SPEND", amount: -amount, reference } });
}

export async function refundCredits(tx: Tx, userId: string, amount: number, reference: string) {
  await tx.user.update({ where: { id: userId }, data: { credits: { increment: amount } } });
  await tx.creditTransaction.create({ data: { userId, type: "REFUND", amount, reference } });
}

/** Schreibt der Anbieterin ihren (bereits berechneten) Anteil gut. */
export async function creditEarnings(tx: Tx, providerId: string, share: number, reference: string) {
  if (share > 0) {
    await tx.user.update({ where: { id: providerId }, data: { earnings: { increment: share } } });
  }
  await tx.creditTransaction.create({ data: { userId: providerId, type: "EARN", amount: share, reference } });
}

/** Idempotente Gutschrift gekaufter Credits (reference = Stripe-Session-ID). */
export async function grantPurchasedCredits(tx: Tx, userId: string, credits: number, reference: string) {
  const existing = await tx.creditTransaction.findUnique({
    where: { type_reference: { type: "PURCHASE", reference } },
  });
  if (existing) return false;
  await tx.creditTransaction.create({ data: { userId, type: "PURCHASE", amount: credits, reference } });
  await tx.user.update({ where: { id: userId }, data: { credits: { increment: credits } } });
  return true;
}

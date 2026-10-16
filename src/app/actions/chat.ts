"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditEarnings, InsufficientCreditsError, providerShare, spendCredits } from "@/lib/credits";
import { findBlockedTerm } from "@/lib/moderation";
import { getSettings } from "@/lib/settings";
import type { ActionState } from "@/lib/action-state";

export async function startConversation(formData: FormData) {
  const user = await requireUser();
  const providerId = String(formData.get("providerId"));
  if (providerId === user.id) redirect("/nachrichten");
  const provider = await db.user.findUnique({ where: { id: providerId } });
  if (!provider || provider.role === "USER" || provider.verification !== "VERIFIED" || provider.banned) {
    redirect("/");
  }
  const conv = await db.conversation.upsert({
    where: { buyerId_providerId: { buyerId: user.id, providerId } },
    update: {},
    create: { buyerId: user.id, providerId },
  });
  redirect(`/nachrichten/${conv.id}`);
}

/**
 * Kund:innen zahlen pro Nachricht den Chat-Preis der Anbieterin in Credits.
 * Antworten der Anbieterin sind kostenlos.
 */
export async function sendMessage(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Bitte schreibe eine Nachricht." };
  if (body.length > 2000) return { error: "Die Nachricht ist zu lang (max. 2000 Zeichen)." };
  if (findBlockedTerm(body)) {
    return { error: "Die Nachricht enthält unzulässige Inhalte und wurde nicht gesendet." };
  }

  const conv = await db.conversation.findUnique({ where: { id: conversationId }, include: { provider: true } });
  if (!conv || (conv.buyerId !== user.id && conv.providerId !== user.id)) return { error: "Chat nicht gefunden." };
  if (conv.provider.banned) return { error: "Dieser Chat ist nicht mehr verfügbar." };

  const isBuyer = conv.buyerId === user.id;
  const cost = isBuyer ? conv.provider.chatPrice : 0;
  const { platformFeePercent } = await getSettings();

  try {
    await db.$transaction(async (tx) => {
      const msg = await tx.message.create({ data: { conversationId, senderId: user.id, body, cost } });
      if (cost > 0) {
        await spendCredits(tx, user.id, cost, `msg:${msg.id}`);
        await creditEarnings(tx, conv.providerId, providerShare(cost, platformFeePercent), `msg:${msg.id}`);
      }
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/nachrichten/${conversationId}`);
  return { ok: "sent" };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findBlockedTerm } from "@/lib/moderation";
import type { ActionState } from "@/lib/action-state";

const listingSchema = z.object({
  title: z.string().trim().min(5, "Der Titel ist zu kurz.").max(100),
  description: z.string().trim().min(20, "Bitte beschreibe dein Angebot etwas genauer.").max(4000),
  categoryId: z.string().min(1, "Bitte wähle eine Kategorie."),
  type: z.enum(["SERVICE", "GREETING_VIDEO"]),
  priceCredits: z.coerce.number().int().min(1, "Der Preis muss mindestens 1 Credit sein.").max(100000),
  city: z.string().trim().min(2, "Bitte gib deinen Ort an.").max(80),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Bitte gib eine 5-stellige PLZ an."),
  imageUrl: z.union([z.url("Die Bild-URL ist ungültig."), z.literal("")]).optional(),
});

export async function createListing(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role === "USER") return { error: "Nur Anbieterinnen können Anzeigen erstellen." };
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (findBlockedTerm(data.title, data.description)) {
    return {
      error: "Deine Anzeige enthält unzulässige Begriffe. Erotische oder sexuelle Angebote sind verboten.",
    };
  }
  if (!(await db.category.findUnique({ where: { id: data.categoryId } }))) {
    return { error: "Unbekannte Kategorie." };
  }
  const listing = await db.listing.create({
    data: { ...data, imageUrl: data.imageUrl || null, providerId: user.id },
  });
  redirect(`/anzeige/${listing.id}`);
}

export async function toggleListing(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || (listing.providerId !== user.id && user.role !== "ADMIN")) return;
  await db.listing.update({ where: { id }, data: { active: !listing.active } });
  revalidatePath("/konto");
  revalidatePath(`/anzeige/${id}`);
}

export async function reportListing(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const listingId = String(formData.get("listingId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Bitte beschreibe kurz den Grund der Meldung." };
  if (!(await db.listing.findUnique({ where: { id: listingId } }))) return { error: "Anzeige nicht gefunden." };
  await db.report.create({ data: { listingId, reporterId: user.id, reason: reason.slice(0, 1000) } });
  return { ok: "Danke für deine Meldung. Unser Team prüft die Anzeige." };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { FONT_CHOICES } from "@/lib/config";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Farben bitte als Hex-Wert, z. B. #0f766e.");
const optionalUrl = z.union([z.url("Die Logo-URL ist ungültig."), z.literal("")]);

const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Bitte gib einen Namen an.").max(60),
  tagline: z.string().trim().max(120),
  logoUrl: optionalUrl,
  heroTitle: z.string().trim().max(120),
  heroText: z.string().trim().max(600),
  footerText: z.string().trim().max(300),
  headingFont: z.enum(FONT_CHOICES),
  bodyFont: z.enum(FONT_CHOICES),
  primaryColor: color,
  accentColor: color,
  backgroundColor: color,
  textColor: color,
  borderRadius: z.coerce.number().int().min(0).max(32),
  platformFeePercent: z.coerce.number().int().min(0, "Gebühr 0–50 %.").max(50, "Gebühr 0–50 %."),
});

export async function updateSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = { ...parsed.data, logoUrl: parsed.data.logoUrl || null };
  await db.siteSettings.upsert({ where: { id: "site" }, update: data, create: { id: "site", ...data } });
  revalidatePath("/", "layout");
  return { ok: "Einstellungen gespeichert." };
}

export async function resetSettings() {
  await requireAdmin();
  await db.siteSettings.deleteMany({ where: { id: "site" } });
  revalidatePath("/", "layout");
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Name zu kurz." };
  const slug = slugify(name);
  if (await db.category.findUnique({ where: { slug } })) return { error: "Kategorie existiert bereits." };
  await db.category.create({ data: { name, slug } });
  revalidatePath("/", "layout");
  return { ok: `Kategorie „${name}“ angelegt.` };
}

export async function renameCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;
  await db.category.update({ where: { id: String(formData.get("id")) }, data: { name } });
  revalidatePath("/", "layout");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  // Nur löschbar, wenn keine Anzeigen mehr daran hängen.
  if ((await db.listing.count({ where: { categoryId: id } })) > 0) return;
  await db.category.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function setVerification(formData: FormData) {
  await requireAdmin();
  const status = z.enum(["VERIFIED", "REJECTED", "NONE"]).parse(formData.get("status"));
  await db.user.update({ where: { id: String(formData.get("userId")) }, data: { verification: status } });
  revalidatePath("/admin");
}

export async function setBanned(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  if (userId === admin.id) return;
  const banned = formData.get("banned") === "true";
  await db.user.update({ where: { id: userId }, data: { banned } });
  if (banned) {
    await db.session.deleteMany({ where: { userId } });
    await db.listing.updateMany({ where: { providerId: userId }, data: { active: false } });
  }
  revalidatePath("/admin");
}

export async function resolveReport(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("reportId"));
  const action = String(formData.get("action"));
  const report = await db.report.update({
    where: { id },
    data: { status: action === "dismiss" ? "DISMISSED" : "RESOLVED" },
  });
  if (action === "deactivate") {
    await db.listing.update({ where: { id: report.listingId }, data: { active: false } });
  }
  revalidatePath("/admin");
}

export async function setPayoutStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("payoutId"));
  const status = z.enum(["PAID", "REJECTED"]).parse(formData.get("status"));
  await db.$transaction(async (tx) => {
    const res = await tx.payoutRequest.updateMany({ where: { id, status: "REQUESTED" }, data: { status } });
    if (res.count === 0 || status !== "REJECTED") return;
    // Abgelehnte Auszahlung: Verdienst zurückbuchen.
    const payout = await tx.payoutRequest.findUniqueOrThrow({ where: { id } });
    await tx.user.update({ where: { id: payout.userId }, data: { earnings: { increment: payout.credits } } });
    await tx.creditTransaction.create({
      data: { userId: payout.userId, type: "REFUND", amount: payout.credits, reference: `payout:${id}` },
    });
  });
  revalidatePath("/admin");
}

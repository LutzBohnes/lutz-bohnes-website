"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATEGORY_ICONS, FONT_CHOICES } from "@/lib/config";
import { db } from "@/lib/db";
import { findBlockedTerm } from "@/lib/moderation";
import { isBlockedDomain, parseDomains } from "@/lib/social";
import type { ActionState } from "@/lib/action-state";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Farben bitte als Hex-Wert, z. B. #0f766e.");
const optionalUrl = z.union([z.url("Die Logo-URL ist ungültig."), z.literal("")]);

const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

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
  filterPrice: checkbox,
  filterExperience: checkbox,
  filterLanguage: checkbox,
  filterPhotos: checkbox,
  filterSocial: checkbox,
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

function categoryIcon(formData: FormData) {
  const icon = String(formData.get("icon") ?? "tag");
  return (CATEGORY_ICONS as readonly string[]).includes(icon) ? icon : "tag";
}

export async function createCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "Bitte gib einen Namen mit 2 bis 40 Zeichen an." };
  const slug = slugify(name);
  if (await db.category.findUnique({ where: { slug } })) return { error: "Diese Kategorie gibt es schon." };
  await db.category.create({ data: { name, slug, icon: categoryIcon(formData) } });
  revalidatePath("/", "layout");
  return { ok: `Kategorie „${name}“ angelegt.` };
}

/** Name und Symbol ändern. Der Slug (für Links) bleibt gleich, damit geteilte Such-Links weiter funktionieren. */
export async function updateCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "Bitte gib einen Namen mit 2 bis 40 Zeichen an." };
  const clash = await db.category.findFirst({ where: { name: { equals: name, mode: "insensitive" }, id: { not: id } } });
  if (clash) return { error: "Diese Kategorie gibt es schon." };
  await db.category.update({ where: { id }, data: { name, icon: categoryIcon(formData) } });
  revalidatePath("/", "layout");
  return { ok: "Gespeichert." };
}

/** Löschen; vorhandene Anzeigen werden vorher in die gewählte Kategorie verschoben. */
export async function deleteCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const moveTo = String(formData.get("moveTo") ?? "");
  const count = await db.listing.count({ where: { categoryId: id } });
  if (count > 0) {
    if (!moveTo || moveTo === id || !(await db.category.findUnique({ where: { id: moveTo } }))) {
      return { error: `Bitte wähle, wohin ${count === 1 ? "die Anzeige" : `die ${count} Anzeigen`} verschoben werden ${count === 1 ? "soll" : "sollen"}.` };
    }
    await db.listing.updateMany({ where: { categoryId: id }, data: { categoryId: moveTo } });
  }
  await db.category.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: "Kategorie gelöscht." };
}

export async function setVerification(formData: FormData) {
  await requireAdmin();
  const status = z.enum(["VERIFIED", "REJECTED", "NONE"]).parse(formData.get("status"));
  await db.user.update({ where: { id: String(formData.get("userId")) }, data: { verification: status } });
  revalidatePath("/admin", "layout");
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
  revalidatePath("/admin", "layout");
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
  revalidatePath("/admin", "layout");
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
  revalidatePath("/admin", "layout");
}

/* ---------- Social-Media-Plattformen ---------- */

function platformInput(formData: FormData): { name: string; domains: string } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const domains = parseDomains(String(formData.get("domains") ?? ""));
  if (name.length < 2 || name.length > 40) return { error: "Bitte gib einen Namen mit 2 bis 40 Zeichen an." };
  if (domains.length === 0) return { error: "Bitte gib mindestens eine Domain an, z. B. instagram.com." };
  const blocked = domains.find(isBlockedDomain);
  if (blocked) return { error: `${blocked} ist eine Erotik- oder Link-Sammel-Plattform und kann nicht angelegt werden.` };
  if (findBlockedTerm(name)) return { error: "Dieser Name ist nicht erlaubt." };
  return { name, domains: domains.join(", ") };
}

export async function createPlatform(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const input = platformInput(formData);
  if ("error" in input) return input;
  if (await db.socialPlatform.findUnique({ where: { name: input.name } })) return { error: "Diese Plattform gibt es schon." };
  const position = await db.socialPlatform.count();
  await db.socialPlatform.create({ data: { ...input, position } });
  revalidatePath("/", "layout");
  return { ok: `${input.name} angelegt.` };
}

export async function updatePlatform(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const input = platformInput(formData);
  if ("error" in input) return input;
  const id = String(formData.get("id"));
  const clash = await db.socialPlatform.findUnique({ where: { name: input.name } });
  if (clash && clash.id !== id) return { error: "Diese Plattform gibt es schon." };
  await db.socialPlatform.update({ where: { id }, data: input });
  revalidatePath("/", "layout");
  return { ok: "Gespeichert." };
}

export async function togglePlatform(formData: FormData) {
  await requireAdmin();
  const p = await db.socialPlatform.findUnique({ where: { id: String(formData.get("id")) } });
  if (!p) return;
  await db.socialPlatform.update({ where: { id: p.id }, data: { active: !p.active } });
  revalidatePath("/", "layout");
}

export async function movePlatform(formData: FormData) {
  await requireAdmin();
  const all = await db.socialPlatform.findMany({ orderBy: { position: "asc" } });
  const from = all.findIndex((p) => p.id === formData.get("id"));
  const to = from + (formData.get("direction") === "up" ? -1 : 1);
  if (from < 0 || to < 0 || to >= all.length) return;
  const [moved] = all.splice(from, 1);
  all.splice(to, 0, moved);
  await db.$transaction(all.map((p, i) => db.socialPlatform.update({ where: { id: p.id }, data: { position: i } })));
  revalidatePath("/", "layout");
}

export async function deletePlatform(formData: FormData) {
  await requireAdmin();
  await db.socialPlatform.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/", "layout");
}

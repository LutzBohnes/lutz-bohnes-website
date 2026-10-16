"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { MAX_CHAT_PRICE, MIN_CHAT_PRICE } from "@/lib/config";
import { db } from "@/lib/db";
import { findBlockedTerm } from "@/lib/moderation";
import { deleteImage, saveImage, UploadError } from "@/lib/storage";
import type { ActionState } from "@/lib/action-state";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().regex(/^\d{5}$|^$/, "Bitte gib eine 5-stellige PLZ an.").optional(),
  chatPrice: z.coerce.number().int().min(MIN_CHAT_PRICE).max(MAX_CHAT_PRICE).optional(),
});

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { chatPrice, ...data } = parsed.data;
  if (findBlockedTerm(data.name, data.bio)) {
    return { error: "Dein Profil enthält unzulässige Inhalte. Erotische Angebote sind nicht erlaubt." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { ...data, ...(user.role !== "USER" && chatPrice ? { chatPrice } : {}) },
  });
  revalidatePath("/konto", "layout");
  return { ok: "Profil gespeichert." };
}

export async function becomeProvider() {
  const user = await requireUser();
  if (user.role === "USER") await db.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });
  revalidatePath("/konto", "layout");
}

export async function requestVerification(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role === "USER") return { error: "Nur Anbieterinnen können sich verifizieren lassen." };
  if (user.verification === "VERIFIED") return { ok: "Du bist bereits verifiziert." };
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!formData.get("adult")) return { error: "Bitte bestätige, dass du mindestens 18 Jahre alt bist." };
  await db.user.update({
    where: { id: user.id },
    data: { verification: "PENDING", verificationNote: note || null },
  });
  revalidatePath("/konto", "layout");
  return { ok: "Danke! Wir melden uns zur Identitätsprüfung bei dir." };
}

export async function uploadAvatar(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Bitte wähle ein Foto aus." };
  try {
    const url = await saveImage(file, 600);
    if (user.avatarUrl) await deleteImage(user.avatarUrl);
    await db.user.update({ where: { id: user.id }, data: { avatarUrl: url } });
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: "Profilfoto gespeichert." };
}

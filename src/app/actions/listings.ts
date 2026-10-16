"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findBlockedTerm } from "@/lib/moderation";
import { deleteImage, filesFrom, MAX_PHOTOS_PER_LISTING, saveImage, UploadError } from "@/lib/storage";
import type { ActionState } from "@/lib/action-state";

const listingSchema = z.object({
  title: z.string().trim().min(5, "Der Titel ist zu kurz.").max(100),
  description: z.string().trim().min(20, "Bitte beschreibe dein Angebot etwas genauer.").max(4000),
  categoryId: z.string().min(1, "Bitte wähle eine Kategorie."),
  type: z.enum(["SERVICE", "GREETING_VIDEO"]),
  priceCredits: z.coerce.number().int().min(1, "Der Preis muss mindestens 1 Credit sein.").max(100000),
  city: z.string().trim().min(2, "Bitte gib deinen Ort an.").max(80),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Bitte gib eine 5-stellige PLZ an."),
});

async function parseListing(formData: FormData) {
  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    priceCredits: formData.get("priceCredits"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const data = parsed.data;
  if (findBlockedTerm(data.title, data.description)) {
    return {
      error: "Deine Anzeige enthält unzulässige Begriffe. Erotische oder sexuelle Angebote sind verboten.",
    } as const;
  }
  if (!(await db.category.findUnique({ where: { id: data.categoryId } }))) return { error: "Unbekannte Kategorie." } as const;
  return { data } as const;
}

/** Speichert neue Fotos hinter die vorhandenen. */
async function addPhotos(listingId: string, files: File[]): Promise<string | null> {
  const existing = await db.listingImage.count({ where: { listingId } });
  if (existing + files.length > MAX_PHOTOS_PER_LISTING) {
    return `Maximal ${MAX_PHOTOS_PER_LISTING} Fotos pro Anzeige (vorhanden: ${existing}).`;
  }
  try {
    for (const [i, file] of files.entries()) {
      const url = await saveImage(file);
      await db.listingImage.create({ data: { listingId, url, position: existing + i } });
    }
  } catch (e) {
    if (e instanceof UploadError) return e.message;
    throw e;
  }
  return null;
}

async function ownListing(id: string) {
  const user = await requireUser();
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || (listing.providerId !== user.id && user.role !== "ADMIN")) return null;
  return listing;
}

function revalidateListing(id: string) {
  revalidatePath("/");
  revalidatePath("/konto");
  revalidatePath(`/anzeige/${id}`);
  revalidatePath(`/konto/anzeige/${id}`);
}

export async function createListing(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role === "USER") return { error: "Nur Anbieterinnen können Anzeigen erstellen." };
  const res = await parseListing(formData);
  if ("error" in res) return { error: res.error };
  const photos = filesFrom(formData, "photos");
  if (photos.length > MAX_PHOTOS_PER_LISTING) return { error: `Maximal ${MAX_PHOTOS_PER_LISTING} Fotos pro Anzeige.` };

  const listing = await db.listing.create({ data: { ...res.data, providerId: user.id } });
  const photoError = await addPhotos(listing.id, photos);
  if (photoError) redirect(`/konto/anzeige/${listing.id}?fehler=${encodeURIComponent(photoError)}`);
  redirect(`/konto/anzeige/${listing.id}?neu=1`);
}

export async function updateListing(_: ActionState, formData: FormData): Promise<ActionState> {
  const listing = await ownListing(String(formData.get("id")));
  if (!listing) return { error: "Anzeige nicht gefunden." };
  const res = await parseListing(formData);
  if ("error" in res) return { error: res.error };
  await db.listing.update({ where: { id: listing.id }, data: res.data });
  const photoError = await addPhotos(listing.id, filesFrom(formData, "photos"));
  revalidateListing(listing.id);
  if (photoError) return { error: `Gespeichert, aber: ${photoError}` };
  return { ok: "Anzeige gespeichert." };
}

export async function uploadListingPhotos(_: ActionState, formData: FormData): Promise<ActionState> {
  const listing = await ownListing(String(formData.get("id")));
  if (!listing) return { error: "Anzeige nicht gefunden." };
  const files = filesFrom(formData, "photos");
  if (!files.length) return { error: "Bitte wähle mindestens ein Foto aus." };
  const photoError = await addPhotos(listing.id, files);
  revalidateListing(listing.id);
  if (photoError) return { error: photoError };
  return { ok: files.length === 1 ? "Foto hochgeladen." : `${files.length} Fotos hochgeladen.` };
}

export async function deleteListingPhoto(formData: FormData) {
  const image = await db.listingImage.findUnique({ where: { id: String(formData.get("imageId")) } });
  if (!image || !(await ownListing(image.listingId))) return;
  await db.listingImage.delete({ where: { id: image.id } });
  await deleteImage(image.url);
  // Positionen lückenlos neu vergeben
  const rest = await db.listingImage.findMany({ where: { listingId: image.listingId }, orderBy: { position: "asc" } });
  await db.$transaction(rest.map((img, i) => db.listingImage.update({ where: { id: img.id }, data: { position: i } })));
  revalidateListing(image.listingId);
}

/** Verschiebt ein Foto: direction "cover" (an Position 0), "left" oder "right". */
export async function moveListingPhoto(formData: FormData) {
  const image = await db.listingImage.findUnique({ where: { id: String(formData.get("imageId")) } });
  if (!image || !(await ownListing(image.listingId))) return;
  const images = await db.listingImage.findMany({ where: { listingId: image.listingId }, orderBy: { position: "asc" } });
  const from = images.findIndex((i) => i.id === image.id);
  const direction = String(formData.get("direction"));
  const to = direction === "cover" ? 0 : direction === "left" ? from - 1 : from + 1;
  if (to < 0 || to >= images.length || to === from) return;
  const [moved] = images.splice(from, 1);
  images.splice(to, 0, moved);
  await db.$transaction(images.map((img, i) => db.listingImage.update({ where: { id: img.id }, data: { position: i } })));
  revalidateListing(image.listingId);
}

export async function toggleListing(formData: FormData) {
  const listing = await ownListing(String(formData.get("id")));
  if (!listing) return;
  await db.listing.update({ where: { id: listing.id }, data: { active: !listing.active } });
  revalidateListing(listing.id);
  revalidatePath("/admin");
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

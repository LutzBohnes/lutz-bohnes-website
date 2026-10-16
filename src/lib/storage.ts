import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS_PER_LISTING = 8;

export class UploadError extends Error {}

/** Dateien aus einem <input type="file" multiple>, leere Felder herausgefiltert. */
export function filesFrom(formData: FormData, name: string): File[] {
  return formData.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);
}

/**
 * Speichert ein hochgeladenes Foto. Das Bild wird neu kodiert (WebP, max. 1600 px):
 * Das prüft, dass es wirklich ein Bild ist, und entfernt alle Metadaten – insbesondere
 * GPS-Koordinaten, die sonst die Wohnadresse der Anbieterin verraten könnten.
 */
export async function saveImage(file: File, maxSize = 1600): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`„${file.name}“ ist größer als 8 MB.`);
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UploadError(`„${file.name}“ ist kein gültiges Bild (erlaubt: JPG, PNG, WebP, HEIC).`);
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.webp`;
  await writeFile(path.join(UPLOAD_DIR, name), output);
  return `/uploads/${name}`;
}

export async function deleteImage(url: string) {
  const name = path.basename(url);
  if (!/^[a-f0-9]{32}\.webp$/.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

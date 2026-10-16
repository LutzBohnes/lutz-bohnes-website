/** Wert eines Credits in Cent bei der Auszahlung an Anbieterinnen. */
export const PAYOUT_CENTS_PER_CREDIT = 10;

export const MIN_PAYOUT_CREDITS = 200;

export const MIN_CHAT_PRICE = 2;
export const MAX_CHAT_PRICE = 50;

export type CreditPackage = { id: string; credits: number; priceCents: number; label: string };

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "small", credits: 100, priceCents: 1000, label: "Starter" },
  { id: "medium", credits: 550, priceCents: 5000, label: "Beliebt" },
  { id: "large", credits: 1200, priceCents: 10000, label: "Vorteil" },
];

/** Schriften, die im Admin-Bereich auswählbar sind (Google Fonts). */
export const FONT_CHOICES = [
  "Inter",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Nunito",
  "Raleway",
  "Playfair Display",
  "Merriweather",
  "DM Sans",
  "Quicksand",
  "Work Sans",
  "Lora",
] as const;

export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export const LISTING_TYPE_LABEL = {
  SERVICE: "Dienstleistung",
  GREETING_VIDEO: "Grußvideo",
} as const;

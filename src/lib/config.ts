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

/** Sprachen, die Anbieterinnen im Profil angeben und nach denen gefiltert werden kann. */
export const LANGUAGE_CHOICES = [
  "Deutsch",
  "Englisch",
  "Türkisch",
  "Arabisch",
  "Russisch",
  "Polnisch",
  "Ukrainisch",
  "Italienisch",
  "Spanisch",
  "Französisch",
  "Rumänisch",
  "Griechisch",
] as const;

/** Symbole, die im Admin-Bereich für Kategorien auswählbar sind (Namen aus components/icon.tsx). */
export const CATEGORY_ICONS = [
  "tag", "bag", "broom", "baby", "heart", "book", "paw", "leaf", "scissors", "needle", "pot", "video",
  "car", "wrench", "box", "laptop", "music", "camera", "sparkle", "home", "users", "star",
] as const;

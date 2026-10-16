/**
 * Einfacher Wortfilter als erste Moderationsstufe. Erotische oder sexuelle
 * Angebote sind laut Nutzungsbedingungen verboten; Treffer werden abgelehnt.
 * Ersetzt keine menschliche Moderation (Meldungen + Admin-Bereich).
 */
const BLOCKED_TERMS = [
  "escort",
  "erotik",
  "erotisch",
  "sex",
  "nackt",
  "nude",
  "massage mit happy end",
  "happy end",
  "taschengeld",
  "sugar daddy",
  "sugardaddy",
  "intim",
  "fetisch",
  "domina",
  "bdsm",
  "dessous",
  "onlyfans",
  "hausbesuch diskret",
  "zärtlich",
  "date gegen",
  "begleitung gegen",
  "aov",
  "ficken",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[0@]/g, "o")
    .replace(/[3]/g, "e")
    .replace(/[1!]/g, "i")
    .replace(/[$5]/g, "s");
}

export function findBlockedTerm(...texts: (string | null | undefined)[]): string | null {
  const haystack = normalize(texts.filter(Boolean).join(" "));
  for (const term of BLOCKED_TERMS) {
    const pattern = new RegExp(`(^|[^a-z])${normalize(term).replace(/\s+/g, "\\s+")}`, "i");
    if (pattern.test(haystack)) return term;
  }
  return null;
}

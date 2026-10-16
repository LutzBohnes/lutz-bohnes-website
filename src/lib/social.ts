/**
 * Domains von Plattformen für Erotik- oder Erwachseneninhalte. Sie können weder als
 * Plattform angelegt noch verlinkt werden – unabhängig von den Admin-Einstellungen.
 */
const BLOCKED_DOMAINS = [
  "onlyfans.com",
  "fansly.com",
  "mym.fans",
  "fanvue.com",
  "justfor.fans",
  "manyvids.com",
  "loyalfans.com",
  "fancentro.com",
  "pornhub.com",
  "xvideos.com",
  "xhamster.com",
  "chaturbate.com",
  "stripchat.com",
  "myfreecams.com",
  "camsoda.com",
  "bongacams.com",
  "livejasmin.com",
  "4based.com",
  "maloum.com",
  "fundorado.de",
  "kaufmich.com",
  "ladies.de",
  "erotik.markt.de",
  "linktr.ee",
  "allmylinks.com",
  "beacons.ai",
];

export function normalizeDomain(d: string) {
  return d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

export function isBlockedDomain(host: string) {
  const h = normalizeDomain(host);
  return BLOCKED_DOMAINS.some((b) => h === b || h.endsWith("." + b));
}

export function parseDomains(input: string) {
  return [...new Set(input.split(/[,\s]+/).map(normalizeDomain).filter((d) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)))];
}

/** Prüft einen Profil-Link gegen die Domains der Plattform. Gibt die bereinigte URL oder einen Fehler zurück. */
export function validateSocialUrl(raw: string, platform: { name: string; domains: string }): { url: string } | { error: string } {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { error: `Der ${platform.name}-Link ist ungültig.` };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { error: `Der ${platform.name}-Link ist ungültig.` };
  const host = normalizeDomain(url.hostname);
  if (isBlockedDomain(host)) return { error: "Links zu Erotik-Plattformen sind nicht erlaubt." };
  const allowed = parseDomains(platform.domains);
  if (!allowed.some((d) => host === d || host.endsWith("." + d))) {
    return { error: `Der ${platform.name}-Link muss auf ${allowed.join(" oder ")} zeigen.` };
  }
  url.protocol = "https:";
  return { url: url.toString() };
}

import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/icon";
import { ListingCard } from "@/components/listing-card";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

type SearchParams = Promise<{ q?: string; ort?: string; kategorie?: string; typ?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", ort = "", kategorie = "", typ = "" } = await searchParams;
  const settings = await getSettings();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  const where: Prisma.ListingWhereInput = {
    active: true,
    provider: { verification: "VERIFIED", banned: false },
  };
  const and: Prisma.ListingWhereInput[] = [];
  if (q.trim()) {
    and.push({
      OR: [
        { title: { contains: q.trim(), mode: "insensitive" } },
        { description: { contains: q.trim(), mode: "insensitive" } },
      ],
    });
  }
  const place = ort.trim();
  if (place) {
    // Ziffern = PLZ-Präfix (z. B. "50" für die Region Köln), sonst Ortsname.
    and.push(
      /^\d+$/.test(place)
        ? { postalCode: { startsWith: place } }
        : { city: { contains: place, mode: "insensitive" } },
    );
  }
  if (kategorie) and.push({ category: { slug: kategorie } });
  if (typ === "SERVICE" || typ === "GREETING_VIDEO") and.push({ type: typ });
  if (and.length) where.AND = and;

  const listings = await db.listing.findMany({
    where,
    include: {
      category: true,
      provider: { select: { name: true, avatarUrl: true } },
      images: { orderBy: { position: "asc" }, select: { url: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden px-6 py-14 text-white sm:px-12 sm:py-20" style={{ borderRadius: "calc(var(--brand-radius) * 2)", background: "var(--brand-primary)" }}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
            <Icon name="shield" size={16} /> Alle Anbieterinnen persönlich verifiziert
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">{settings.heroTitle}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">{settings.heroText}</p>
          <form className="mt-8 grid gap-2 bg-white p-2 text-slate-900 shadow-2xl sm:grid-cols-[2fr_1.3fr_1.3fr_1fr_auto]" style={{ borderRadius: "var(--brand-radius)" }}>
            <input name="q" defaultValue={q} placeholder="Was suchst du? z. B. Einkaufshilfe" className="input border-0 bg-slate-50" aria-label="Suchbegriff" />
            <input name="ort" defaultValue={ort} placeholder="Ort oder PLZ" className="input border-0 bg-slate-50" aria-label="Ort oder PLZ" />
            <select name="kategorie" defaultValue={kategorie} className="input border-0 bg-slate-50" aria-label="Dienstleistung">
              <option value="">Alle Dienstleistungen</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <select name="typ" defaultValue={typ} className="input border-0 bg-slate-50" aria-label="Art">
              <option value="">Alle Arten</option>
              <option value="SERVICE">Dienstleistung</option>
              <option value="GREETING_VIDEO">Grußvideo</option>
            </select>
            <button className="btn btn-accent px-6">Suchen</button>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.slice(0, 8).map((c) => (
              <a key={c.id} href={`/?kategorie=${c.slug}`} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${kategorie === c.slug ? "border-white bg-white text-slate-900" : "border-white/30 hover:bg-white/10"}`}>
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {listings.length} {listings.length === 1 ? "Angebot" : "Angebote"}
            {place && <span className="text-slate-400"> in „{place}“</span>}
          </h2>
          {(q || place || kategorie || typ) && <a href="/" className="text-sm text-primary hover:underline">Filter zurücksetzen</a>}
        </div>
        {listings.length === 0 ? (
          <p className="card text-slate-500">Keine Angebote gefunden. Versuche einen anderen Ort oder eine andere Kategorie.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </div>
  );
}

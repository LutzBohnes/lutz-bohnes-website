import type { Prisma } from "@prisma/client";
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
    include: { category: true, provider: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--brand-radius)] bg-primary px-6 py-10 text-white sm:px-10">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">{settings.heroTitle}</h1>
        <p className="mt-3 max-w-2xl text-white/85">{settings.heroText}</p>
        <form className="mt-6 grid gap-2 rounded-[var(--brand-radius)] bg-white p-3 text-slate-900 sm:grid-cols-[2fr_1.3fr_1.3fr_1fr_auto]">
          <input name="q" defaultValue={q} placeholder="Was suchst du? z. B. Einkaufshilfe" className="input" />
          <input name="ort" defaultValue={ort} placeholder="Ort oder PLZ" className="input" />
          <select name="kategorie" defaultValue={kategorie} className="input">
            <option value="">Alle Dienstleistungen</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select name="typ" defaultValue={typ} className="input">
            <option value="">Alle Arten</option>
            <option value="SERVICE">Dienstleistung</option>
            <option value="GREETING_VIDEO">Grußvideo</option>
          </select>
          <button className="btn btn-accent">Suchen</button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          {listings.length} {listings.length === 1 ? "Angebot" : "Angebote"}
          {place && <> in „{place}“</>}
        </h2>
        {listings.length === 0 ? (
          <p className="card text-slate-500">Keine Angebote gefunden. Versuche einen anderen Ort oder eine andere Kategorie.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

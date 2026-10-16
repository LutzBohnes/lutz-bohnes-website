import type { Category, Listing } from "@prisma/client";

/** Gemeinsame Felder für „Neue Anzeige“ und „Anzeige bearbeiten“. */
export function ListingFields({ categories, listing, defaults }: {
  categories: Category[];
  listing?: Listing;
  defaults?: { city?: string | null; postalCode?: string | null };
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="title">Titel</label>
        <input id="title" name="title" required maxLength={100} defaultValue={listing?.title} className="input" placeholder="z. B. Wocheneinkauf für Senior:innen" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">Art</label>
          <select id="type" name="type" defaultValue={listing?.type ?? "SERVICE"} className="input">
            <option value="SERVICE">Dienstleistung</option>
            <option value="GREETING_VIDEO">Grußvideo</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="categoryId">Kategorie</label>
          <select id="categoryId" name="categoryId" defaultValue={listing?.categoryId} className="input" required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Beschreibung</label>
        <textarea id="description" name="description" rows={6} required defaultValue={listing?.description} className="input" placeholder="Was bietest du an? Wann hast du Zeit? Was bringst du mit?" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        <div>
          <label className="label" htmlFor="priceCredits">Preis (Credits)</label>
          <input id="priceCredits" name="priceCredits" type="number" min={1} required defaultValue={listing?.priceCredits} className="input" />
          <p className="mt-1 text-xs text-slate-500">100 Credits = 10 €</p>
        </div>
        <div>
          <label className="label" htmlFor="postalCode">PLZ</label>
          <input id="postalCode" name="postalCode" required defaultValue={listing?.postalCode ?? defaults?.postalCode ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="city">Ort</label>
          <input id="city" name="city" required defaultValue={listing?.city ?? defaults?.city ?? ""} className="input" />
        </div>
      </div>
    </div>
  );
}

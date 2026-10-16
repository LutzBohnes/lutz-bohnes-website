import { redirect } from "next/navigation";
import { createListing } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Neue Anzeige" };

export default async function NewListingPage() {
  const user = await requireUser();
  if (user.role === "USER") redirect("/konto");
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-2xl card">
      <h1 className="mb-4 text-2xl font-bold">Neue Anzeige</h1>
      <ActionForm action={createListing} className="space-y-4">
        <div>
          <label className="label" htmlFor="title">Titel</label>
          <input id="title" name="title" required maxLength={100} className="input" placeholder="z. B. Einkaufshilfe für Senior:innen" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Art</label>
            <select id="type" name="type" className="input">
              <option value="SERVICE">Dienstleistung</option>
              <option value="GREETING_VIDEO">Grußvideo</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="categoryId">Kategorie</label>
            <select id="categoryId" name="categoryId" className="input" required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Beschreibung</label>
          <textarea id="description" name="description" rows={6} required className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr]">
          <div>
            <label className="label" htmlFor="priceCredits">Preis (Credits)</label>
            <input id="priceCredits" name="priceCredits" type="number" min={1} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="postalCode">PLZ</label>
            <input id="postalCode" name="postalCode" defaultValue={user.postalCode ?? ""} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="city">Ort</label>
            <input id="city" name="city" defaultValue={user.city ?? ""} required className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="imageUrl">Bild-URL (optional)</label>
          <input id="imageUrl" name="imageUrl" type="url" className="input" placeholder="https://…" />
        </div>
        <p className="text-xs text-slate-500">
          Erotische oder sexuelle Angebote sind verboten und führen zur Sperrung.
          {user.verification !== "VERIFIED" && " Deine Anzeige wird sichtbar, sobald dein Konto verifiziert ist."}
        </p>
        <SubmitButton>Anzeige veröffentlichen</SubmitButton>
      </ActionForm>
    </div>
  );
}

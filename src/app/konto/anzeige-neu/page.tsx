import { redirect } from "next/navigation";
import { createListing } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader, Panel } from "@/components/dashboard";
import { ListingFields } from "@/components/listing-fields";
import { PhotoPicker } from "@/components/photo-picker";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PHOTOS_PER_LISTING } from "@/lib/storage";

export const metadata = { title: "Neue Anzeige" };

export default async function NewListingPage() {
  const user = await requireUser();
  if (user.role === "USER") redirect("/konto/profil");
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Neue Anzeige" subtitle="Gute Fotos und eine klare Beschreibung bringen deutlich mehr Buchungen." />
      <ActionForm action={createListing} className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Panel title="Angebot">
          <ListingFields categories={categories} defaults={user} />
        </Panel>
        <div className="space-y-6">
          <Panel title="Fotos">
            <PhotoPicker max={MAX_PHOTOS_PER_LISTING} />
            <p className="mt-3 text-xs text-slate-500">
              Das erste Foto wird zum Titelbild. Zeig deine Arbeit, zum Beispiel einen frisch geschnittenen Haarschnitt,
              deinen Garten-Einsatz oder deine Backwaren. Standortdaten werden automatisch aus den Fotos entfernt.
            </p>
          </Panel>
          <Panel>
            <p className="mb-3 text-xs text-slate-500">
              Erotische oder sexuelle Angebote sind verboten und führen zur Sperrung.
              {user.verification !== "VERIFIED" && " Deine Anzeige wird sichtbar, sobald dein Konto verifiziert ist."}
            </p>
            <SubmitButton className="btn w-full">Anzeige veröffentlichen</SubmitButton>
          </Panel>
        </div>
      </ActionForm>
    </>
  );
}

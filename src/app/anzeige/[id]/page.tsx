import Link from "next/link";
import { notFound } from "next/navigation";
import { startConversation } from "@/app/actions/chat";
import { reportListing } from "@/app/actions/listings";
import { orderListing } from "@/app/actions/orders";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { getCurrentUser } from "@/lib/auth";
import { LISTING_TYPE_LABEL } from "@/lib/config";
import { db } from "@/lib/db";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, listing] = await Promise.all([
    getCurrentUser(),
    db.listing.findUnique({ where: { id }, include: { category: true, provider: true } }),
  ]);
  if (!listing) notFound();
  const isOwner = user?.id === listing.providerId;
  const publiclyVisible = listing.active && listing.provider.verification === "VERIFIED" && !listing.provider.banned;
  if (!publiclyVisible && !isOwner && user?.role !== "ADMIN") notFound();
  const { provider } = listing;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <article className="card space-y-4">
        {!publiclyVisible && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Diese Anzeige ist noch nicht öffentlich sichtbar
            {provider.verification !== "VERIFIED" ? " – dein Konto muss erst verifiziert werden." : " (deaktiviert)."}
          </p>
        )}
        {listing.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" className="max-h-96 w-full rounded-[var(--brand-radius)] object-cover" />
        )}
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-primary/10 text-primary">{listing.category.name}</span>
          <span className="badge bg-accent/15 text-accent">{LISTING_TYPE_LABEL[listing.type]}</span>
        </div>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="text-slate-500">📍 {listing.postalCode} {listing.city}</p>
        <p className="whitespace-pre-line leading-relaxed">{listing.description}</p>
      </article>

      <aside className="space-y-4">
        <div className="card space-y-3">
          <p className="font-heading text-3xl font-bold text-primary">{listing.priceCredits} Credits</p>
          {isOwner ? (
            <Link href="/konto" className="btn btn-ghost w-full">Anzeige im Konto verwalten</Link>
          ) : user ? (
            <ActionForm action={orderListing} className="space-y-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <label className="label" htmlFor="note">
                {listing.type === "GREETING_VIDEO" ? "Für wen ist das Video? Was soll gesagt werden?" : "Nachricht zur Buchung"}
              </label>
              <textarea id="note" name="note" rows={3} className="input" maxLength={1000} />
              <SubmitButton className="btn w-full">
                {listing.type === "GREETING_VIDEO" ? "Grußvideo bestellen" : "Jetzt buchen"}
              </SubmitButton>
              <p className="text-xs text-slate-500">
                Deine Credits werden sicher verwahrt und erst nach Erledigung an die Anbieterin ausgezahlt.
              </p>
            </ActionForm>
          ) : (
            <Link href="/login" className="btn w-full">Anmelden zum Buchen</Link>
          )}
        </div>

        <div className="card space-y-3">
          <Link href={`/anbieterin/${provider.id}`} className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-heading text-xl font-bold text-primary">
              {provider.name.charAt(0)}
            </span>
            <span>
              <span className="block font-semibold">{provider.name}</span>
              {provider.verification === "VERIFIED" && <span className="text-xs text-emerald-700">✔ Verifiziert</span>}
            </span>
          </Link>
          {user && !isOwner && (
            <form action={startConversation}>
              <input type="hidden" name="providerId" value={provider.id} />
              <button className="btn btn-ghost w-full">Chatten ({provider.chatPrice} Credits / Nachricht)</button>
            </form>
          )}
        </div>

        {user && !isOwner && (
          <details className="card text-sm">
            <summary className="cursor-pointer text-slate-500">Anzeige melden</summary>
            <ActionForm action={reportListing} className="mt-3 space-y-2" resetOnSuccess>
              <input type="hidden" name="listingId" value={listing.id} />
              <textarea name="reason" rows={3} className="input" placeholder="Was ist das Problem?" />
              <SubmitButton className="btn btn-danger">Melden</SubmitButton>
            </ActionForm>
          </details>
        )}
      </aside>
    </div>
  );
}

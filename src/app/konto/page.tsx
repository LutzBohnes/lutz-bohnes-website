import Link from "next/link";
import { becomeProvider, requestVerification, updateProfile } from "@/app/actions/profile";
import { toggleListing } from "@/app/actions/listings";
import { cancelOrder, deliverOrder } from "@/app/actions/orders";
import { requestPayout } from "@/app/actions/credits";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { requireUser } from "@/lib/auth";
import { formatEuro, LISTING_TYPE_LABEL, MAX_CHAT_PRICE, MIN_CHAT_PRICE, MIN_PAYOUT_CREDITS, PAYOUT_CENTS_PER_CREDIT } from "@/lib/config";
import { db } from "@/lib/db";

export const metadata = { title: "Mein Konto" };

const STATUS_LABEL = { OPEN: "Offen", DELIVERED: "Erledigt", CANCELLED: "Storniert" } as const;
const VERIFICATION_LABEL = {
  NONE: "Nicht verifiziert",
  PENDING: "Prüfung läuft",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
} as const;

export default async function AccountPage() {
  const user = await requireUser();
  const isProvider = user.role !== "USER";
  const [listings, incoming, outgoing, transactions] = await Promise.all([
    isProvider ? db.listing.findMany({ where: { providerId: user.id }, orderBy: { createdAt: "desc" } }) : [],
    isProvider
      ? db.order.findMany({
          where: { providerId: user.id },
          include: { listing: true, buyer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [],
    db.order.findMany({
      where: { buyerId: user.id },
      include: { listing: true, provider: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.creditTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hallo {user.name}!</h1>
          <p className="text-slate-500">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/credits" className="card py-3 text-center hover:shadow-md">
            <p className="text-xs text-slate-500">Guthaben</p>
            <p className="font-heading text-xl font-bold text-primary">{user.credits} Credits</p>
          </Link>
          {isProvider && (
            <div className="card py-3 text-center">
              <p className="text-xs text-slate-500">Verdient (auszahlbar)</p>
              <p className="font-heading text-xl font-bold text-accent">{user.earnings} Credits</p>
              <p className="text-xs text-slate-500">≈ {formatEuro(user.earnings * PAYOUT_CENTS_PER_CREDIT)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold">Profil</h2>
          <ActionForm action={updateProfile} className="space-y-3">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" defaultValue={user.name} className="input" required />
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <div>
                <label className="label" htmlFor="postalCode">PLZ</label>
                <input id="postalCode" name="postalCode" defaultValue={user.postalCode ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="city">Ort</label>
                <input id="city" name="city" defaultValue={user.city ?? ""} className="input" />
              </div>
            </div>
            {isProvider && (
              <>
                <div>
                  <label className="label" htmlFor="bio">Über mich</label>
                  <textarea id="bio" name="bio" rows={4} defaultValue={user.bio ?? ""} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="chatPrice">Chat-Preis (Credits pro Nachricht)</label>
                  <input
                    id="chatPrice"
                    name="chatPrice"
                    type="number"
                    min={MIN_CHAT_PRICE}
                    max={MAX_CHAT_PRICE}
                    defaultValue={user.chatPrice}
                    className="input"
                  />
                </div>
              </>
            )}
            <SubmitButton>Speichern</SubmitButton>
          </ActionForm>
        </section>

        {isProvider ? (
          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Verifizierung</h2>
              <span className={`badge ${user.verification === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {VERIFICATION_LABEL[user.verification]}
              </span>
            </div>
            {user.verification === "VERIFIED" ? (
              <p className="text-sm text-slate-600">Deine Anzeigen sind öffentlich sichtbar.</p>
            ) : user.verification === "PENDING" ? (
              <p className="text-sm text-slate-600">Wir prüfen deine Angaben und melden uns bei dir.</p>
            ) : (
              <ActionForm action={requestVerification} className="space-y-3">
                <p className="text-sm text-slate-600">
                  Damit deine Anzeigen sichtbar werden, prüfen wir einmalig deine Identität.
                </p>
                <textarea name="note" rows={2} className="input" placeholder="Telefonnummer oder Hinweis für unser Team" />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="adult" className="mt-1" />
                  <span>Ich bin mindestens 18 Jahre alt und biete ausschließlich meine eigenen Leistungen an.</span>
                </label>
                <SubmitButton>Verifizierung beantragen</SubmitButton>
              </ActionForm>
            )}

            <hr className="border-slate-200" />
            <h2 className="text-lg font-semibold">Auszahlung</h2>
            <ActionForm action={requestPayout} className="space-y-3">
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <input name="credits" type="number" min={MIN_PAYOUT_CREDITS} max={user.earnings} placeholder="Credits" className="input" />
                <input name="iban" placeholder="IBAN" className="input" />
              </div>
              <p className="text-xs text-slate-500">
                Mindestens {MIN_PAYOUT_CREDITS} Credits · 1 Credit = {formatEuro(PAYOUT_CENTS_PER_CREDIT)}
              </p>
              <SubmitButton className="btn btn-accent">Auszahlung beantragen</SubmitButton>
            </ActionForm>
          </section>
        ) : (
          <section className="card space-y-3">
            <h2 className="text-lg font-semibold">Selbst Hilfe anbieten?</h2>
            <p className="text-sm text-slate-600">
              Biete deine Dienstleistungen in deiner Nachbarschaft an und verdiene Credits, die du dir auszahlen lassen kannst.
            </p>
            <form action={becomeProvider}>
              <button className="btn">Anbieterin werden</button>
            </form>
          </section>
        )}
      </div>

      {isProvider && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Meine Anzeigen</h2>
            <Link href="/konto/anzeige-neu" className="btn">+ Neue Anzeige</Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-slate-500">Du hast noch keine Anzeigen.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={`/anzeige/${l.id}`} className="hover:underline">
                    <span className="font-medium">{l.title}</span>{" "}
                    <span className="text-sm text-slate-500">· {LISTING_TYPE_LABEL[l.type]} · {l.priceCredits} Credits</span>
                  </Link>
                  <form action={toggleListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className={`badge ${l.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {l.active ? "Aktiv – pausieren" : "Pausiert – aktivieren"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isProvider && (
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold">Eingegangene Buchungen</h2>
          {incoming.length === 0 ? (
            <p className="text-slate-500">Noch keine Buchungen.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {incoming.map((o) => (
                <li key={o.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>
                      <strong>{o.listing.title}</strong> von {o.buyer.name} · {o.priceCredits} Credits
                      <span className="text-sm text-slate-500"> (du erhältst {o.priceCredits - o.platformFee})</span>
                    </span>
                    <span className="badge bg-slate-100 text-slate-700">{STATUS_LABEL[o.status]}</span>
                  </div>
                  {o.note && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm">„{o.note}“</p>}
                  {o.status === "OPEN" && (
                    <div className="flex flex-wrap items-start gap-2">
                      <ActionForm action={deliverOrder} className="flex flex-1 flex-wrap gap-2">
                        <input type="hidden" name="orderId" value={o.id} />
                        {o.listing.type === "GREETING_VIDEO" && (
                          <input name="deliveryUrl" placeholder="Link zum Video (https://…)" className="input max-w-sm" />
                        )}
                        <SubmitButton>Als erledigt markieren</SubmitButton>
                      </ActionForm>
                      <form action={cancelOrder}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button className="btn btn-ghost">Ablehnen</button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Meine Buchungen</h2>
        {outgoing.length === 0 ? (
          <p className="text-slate-500">
            Noch nichts gebucht. <Link href="/" className="text-primary underline">Angebote entdecken</Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {outgoing.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <Link href={`/anzeige/${o.listingId}`} className="font-medium hover:underline">{o.listing.title}</Link>{" "}
                  <span className="text-sm text-slate-500">bei {o.provider.name} · {o.priceCredits} Credits</span>
                  {o.deliveryUrl && (
                    <a href={o.deliveryUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-primary underline">
                      Video ansehen
                    </a>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <span className="badge bg-slate-100 text-slate-700">{STATUS_LABEL[o.status]}</span>
                  {o.status === "OPEN" && (
                    <form action={cancelOrder}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <button className="text-sm text-red-600 hover:underline">Stornieren</button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Letzte Credit-Bewegungen</h2>
        {transactions.length === 0 ? (
          <p className="text-slate-500">Noch keine Bewegungen.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 text-slate-500">{t.createdAt.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="py-2">{TX_LABEL[t.type]}</td>
                  <td className={`py-2 text-right font-medium ${t.amount >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const TX_LABEL = {
  PURCHASE: "Credits gekauft",
  SPEND: "Ausgabe",
  EARN: "Verdienst",
  REFUND: "Rückbuchung",
  PAYOUT: "Auszahlung",
} as const;

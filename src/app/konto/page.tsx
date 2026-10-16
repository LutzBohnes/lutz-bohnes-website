import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BarChart } from "@/components/bar-chart";
import { EmptyState, PageHeader, Panel, StatTile, StatusBadge, weeklySeries } from "@/components/dashboard";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { formatEuro, PAYOUT_CENTS_PER_CREDIT } from "@/lib/config";
import { db } from "@/lib/db";

export const metadata = { title: "Mein Konto" };

const TX_LABEL = { PURCHASE: "Credits gekauft", SPEND: "Ausgabe", EARN: "Verdienst", REFUND: "Rückbuchung", PAYOUT: "Auszahlung" } as const;

export default async function AccountOverview() {
  const user = await requireUser();
  const isProvider = user.role !== "USER";
  const since = new Date(Date.now() - 56 * 864e5);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [earnRows, monthEarn, openOrders, activeListings, listingCount, upcoming, transactions, myOrders] = await Promise.all([
    isProvider ? db.creditTransaction.findMany({ where: { userId: user.id, type: "EARN", createdAt: { gte: since } }, select: { createdAt: true, amount: true } }) : [],
    isProvider ? db.creditTransaction.aggregate({ where: { userId: user.id, type: "EARN", createdAt: { gte: monthStart } }, _sum: { amount: true } }) : null,
    db.order.count({ where: isProvider ? { providerId: user.id, status: "OPEN" } : { buyerId: user.id, status: "OPEN" } }),
    isProvider ? db.listing.count({ where: { providerId: user.id, active: true } }) : 0,
    isProvider ? db.listing.count({ where: { providerId: user.id } }) : 0,
    db.order.findMany({
      where: isProvider ? { providerId: user.id, status: "OPEN" } : { buyerId: user.id, status: "OPEN" },
      include: { listing: { include: { images: { orderBy: { position: "asc" }, take: 1 } } }, buyer: true, provider: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.creditTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    isProvider ? 0 : db.order.count({ where: { buyerId: user.id } }),
  ]);

  return (
    <>
      <PageHeader
        title={`Hallo ${user.name}!`}
        subtitle={isProvider ? "Hier siehst du, wie dein Angebot läuft." : "Schön, dass du da bist."}
        action={isProvider ? <Link href="/konto/anzeige-neu" className="btn"><Icon name="plus" size={18} /> Neue Anzeige</Link> : <Link href="/" className="btn">Angebote entdecken</Link>}
      />

      {isProvider && user.verification !== "VERIFIED" && (
        <div className="flex flex-wrap items-center gap-4 rounded-[var(--brand-radius)] border border-amber-200 bg-amber-50 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-700"><Icon name="shield" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900">{user.verification === "PENDING" ? "Deine Verifizierung wird geprüft" : "Lass dich verifizieren, damit deine Anzeigen sichtbar werden"}</p>
            <p className="text-sm text-amber-800">Wir prüfen einmalig Alter und Identität. Das schützt dich und deine Kund:innen.</p>
          </div>
          {user.verification !== "PENDING" && <Link href="/konto/profil" className="btn">Jetzt verifizieren</Link>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isProvider ? (
          <>
            <StatTile icon="wallet" label="Auszahlbar" value={`${user.earnings.toLocaleString("de-DE")} Cr.`} hint={`≈ ${formatEuro(user.earnings * PAYOUT_CENTS_PER_CREDIT)}`} />
            <StatTile icon="chart" tone="accent" label="Verdient diesen Monat" value={`${(monthEarn?._sum.amount ?? 0).toLocaleString("de-DE")} Cr.`} hint={`≈ ${formatEuro((monthEarn?._sum.amount ?? 0) * PAYOUT_CENTS_PER_CREDIT)}`} />
            <StatTile icon="calendar" label="Offene Buchungen" value={openOrders} />
            <StatTile icon="grid" label="Aktive Anzeigen" value={`${activeListings} / ${listingCount}`} />
          </>
        ) : (
          <>
            <StatTile icon="wallet" label="Guthaben" value={`${user.credits.toLocaleString("de-DE")} Cr.`} hint={<Link href="/credits" className="text-primary underline">Aufladen</Link>} />
            <StatTile icon="calendar" tone="accent" label="Offene Buchungen" value={openOrders} />
            <StatTile icon="receipt" label="Buchungen gesamt" value={myOrders} />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        {isProvider ? (
          <Panel title="Verdienst der letzten 8 Wochen">
            <BarChart data={weeklySeries(earnRows)} unit="Credits" />
          </Panel>
        ) : (
          <Panel title="So funktioniert's">
            <ol className="space-y-3 text-sm">
              {["Credits aufladen, zum Beispiel 100 für 10 €.", "Angebot in deiner Nähe buchen oder ein Grußvideo bestellen.", "Die Credits werden erst gutgeschrieben, wenn die Leistung erledigt ist."].map((t, i) => (
                <li key={t} className="flex gap-3"><span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>{t}</li>
              ))}
            </ol>
          </Panel>
        )}
        <Panel title={isProvider ? "Offene Buchungen" : "Laufende Buchungen"} action={<Link href="/konto/buchungen" className="text-sm text-primary hover:underline">Alle ansehen</Link>}>
          {upcoming.length === 0 ? (
            <EmptyState icon="calendar" title="Keine offenen Buchungen" text={isProvider ? "Neue Buchungen erscheinen hier." : undefined} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((o) => {
                const other = isProvider ? o.buyer : o.provider;
                return (
                  <li key={o.id} className="flex items-center gap-3 py-3">
                    {o.listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.listing.images[0].url} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" />
                    ) : (
                      <Avatar name={other.name} url={other.avatarUrl} size={48} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{o.listing.title}</p>
                      <p className="text-sm text-slate-500">{isProvider ? "von" : "bei"} {other.name} · {o.priceCredits} Cr.</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Letzte Credit-Bewegungen">
        {transactions.length === 0 ? (
          <EmptyState icon="receipt" title="Noch keine Bewegungen" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 text-slate-500">{t.createdAt.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-2.5">{TX_LABEL[t.type]}</td>
                    <td className={`py-2.5 text-right font-semibold tabular-nums ${t.amount >= 0 ? "text-emerald-700" : "text-slate-700"}`}>
                      {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString("de-DE")} Cr.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

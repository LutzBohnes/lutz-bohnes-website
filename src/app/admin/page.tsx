import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BarChart } from "@/components/bar-chart";
import { PageHeader, Panel, StatTile, StatusBadge, weeklySeries } from "@/components/dashboard";
import { formatEuro, PAYOUT_CENTS_PER_CREDIT } from "@/lib/config";
import { db } from "@/lib/db";

export default async function AdminOverview() {
  const since = new Date(Date.now() - 12 * 7 * 864e5);
  const [users, providers, activeListings, purchased, delivered, messages, msgEarn, recentOrders, topCategories, topCities, openOrders] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "PROVIDER", verification: "VERIFIED" } }),
    db.listing.count({ where: { active: true } }),
    db.creditTransaction.aggregate({ where: { type: "PURCHASE" }, _sum: { amount: true } }),
    db.order.findMany({ where: { status: "DELIVERED" }, select: { updatedAt: true, platformFee: true } }),
    db.message.findMany({ where: { cost: { gt: 0 } }, select: { createdAt: true, cost: true } }),
    db.creditTransaction.findMany({ where: { type: "EARN", reference: { startsWith: "msg:" } }, select: { createdAt: true, amount: true } }),
    db.order.findMany({ include: { listing: true, buyer: true, provider: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.category.findMany({ include: { _count: { select: { listings: { where: { active: true } } } } } }),
    db.listing.groupBy({ by: ["city"], where: { active: true }, _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 5 }),
    db.order.aggregate({ where: { status: "OPEN" }, _sum: { priceCredits: true } }),
  ]);

  // Plattform-Einnahmen = Gebühren erledigter Buchungen + (Chat-Kosten − Anteil der Anbieterinnen)
  const revenueRows = [
    ...delivered.map((o) => ({ createdAt: o.updatedAt, amount: o.platformFee })),
    ...messages.map((m) => ({ createdAt: m.createdAt, amount: m.cost })),
    ...msgEarn.map((e) => ({ createdAt: e.createdAt, amount: -e.amount })),
  ];
  const revenue = revenueRows.reduce((s, r) => s + r.amount, 0);
  const chart = weeklySeries(revenueRows.filter((r) => r.createdAt >= since), 12);
  const cats = topCategories.sort((a, b) => b._count.listings - a._count.listings).slice(0, 5);
  const maxCat = Math.max(1, ...cats.map((c) => c._count.listings));

  return (
    <>
      <PageHeader title="Übersicht" subtitle="So läuft deine Plattform." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon="wallet" label="Plattform-Einnahmen" value={formatEuro(revenue * PAYOUT_CENTS_PER_CREDIT)} hint={`${revenue.toLocaleString("de-DE")} Credits`} />
        <StatTile icon="receipt" tone="accent" label="Verkaufte Credits" value={(purchased._sum.amount ?? 0).toLocaleString("de-DE")} hint={`≈ ${formatEuro((purchased._sum.amount ?? 0) * PAYOUT_CENTS_PER_CREDIT)} Umsatz`} />
        <StatTile icon="users" label="Nutzer:innen" value={users.toLocaleString("de-DE")} hint={`${providers} verifizierte Anbieterinnen`} />
        <StatTile icon="grid" label="Aktive Anzeigen" value={activeListings} hint={`${(openOrders._sum.priceCredits ?? 0).toLocaleString("de-DE")} Credits in Treuhand`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Panel title="Plattform-Einnahmen pro Woche (Credits)">
          <BarChart data={chart} unit="Credits" />
        </Panel>
        <Panel title="Beliebteste Kategorien">
          <ul className="space-y-3">
            {cats.map((c) => (
              <li key={c.id}>
                <div className="mb-1 flex justify-between text-sm"><span>{c.name}</span><span className="tabular-nums text-slate-500">{c._count.listings}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${(c._count.listings / maxCat) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-500">Top-Orte</h3>
          <div className="flex flex-wrap gap-2">
            {topCities.map((c) => <span key={c.city} className="badge bg-slate-100 text-slate-700">{c.city} · {c._count._all}</span>)}
          </div>
        </Panel>
      </div>
      <Panel title="Neueste Buchungen" action={<Link href="/admin/buchungen" className="text-sm text-primary hover:underline">Alle ansehen</Link>}>
        <ul className="divide-y divide-slate-100">
          {recentOrders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar name={o.buyer.name} url={o.buyer.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{o.listing.title}</p>
                <p className="text-sm text-slate-500">{o.buyer.name} → {o.provider.name} · {o.createdAt.toLocaleDateString("de-DE")}</p>
              </div>
              <span className="tabular-nums text-sm font-semibold">{o.priceCredits} Cr.</span>
              <StatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

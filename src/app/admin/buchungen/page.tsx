import Link from "next/link";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { db } from "@/lib/db";

export default async function AdminOrders() {
  const orders = await db.order.findMany({ include: { listing: true, buyer: true, provider: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Buchungen" subtitle="Die letzten 200 Buchungen und Grußvideo-Bestellungen" />
      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr><th className="p-4 font-medium">Datum</th><th className="p-4 font-medium">Anzeige</th><th className="p-4 font-medium">Kund:in → Anbieterin</th><th className="p-4 text-right font-medium">Preis</th><th className="p-4 text-right font-medium">Gebühr</th><th className="p-4 font-medium">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="p-4 text-slate-500">{o.createdAt.toLocaleDateString("de-DE")}</td>
                <td className="p-4"><Link href={`/anzeige/${o.listingId}`} className="font-medium hover:underline">{o.listing.title}</Link></td>
                <td className="p-4">{o.buyer.name} → {o.provider.name}</td>
                <td className="p-4 text-right tabular-nums">{o.priceCredits}</td>
                <td className="p-4 text-right tabular-nums text-primary">{o.status === "DELIVERED" ? o.platformFee : "–"}</td>
                <td className="p-4"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

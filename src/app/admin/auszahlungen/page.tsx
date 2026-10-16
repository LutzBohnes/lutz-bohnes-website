import { setPayoutStatus } from "@/app/actions/admin";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { formatEuro, PAYOUT_CENTS_PER_CREDIT } from "@/lib/config";
import { db } from "@/lib/db";

export default async function AdminPayouts() {
  const payouts = await db.payoutRequest.findMany({ include: { user: true }, orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 200 });
  const open = payouts.filter((p) => p.status === "REQUESTED").reduce((s, p) => s + p.credits, 0);
  return (
    <>
      <PageHeader title="Auszahlungen" subtitle={`Offen: ${formatEuro(open * PAYOUT_CENTS_PER_CREDIT)}`} />
      <Panel className="overflow-x-auto p-0">
        {payouts.length === 0 ? (
          <EmptyState icon="wallet" title="Noch keine Auszahlungen beantragt" />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr><th className="p-4 font-medium">Datum</th><th className="p-4 font-medium">Anbieterin</th><th className="p-4 font-medium">IBAN</th><th className="p-4 text-right font-medium">Betrag</th><th className="p-4 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="p-4 text-slate-500">{p.createdAt.toLocaleDateString("de-DE")}</td>
                  <td className="p-4"><span className="flex items-center gap-2"><Avatar name={p.user.name} url={p.user.avatarUrl} size={28} />{p.user.name}</span></td>
                  <td className="p-4 font-mono">{p.iban}</td>
                  <td className="p-4 text-right font-semibold tabular-nums">{formatEuro(p.credits * PAYOUT_CENTS_PER_CREDIT)}</td>
                  <td className="p-4">
                    {p.status === "REQUESTED" ? (
                      <div className="flex gap-2">
                        <PayoutButton id={p.id} status="PAID" label="Überwiesen" className="btn px-3 py-1.5 text-xs" />
                        <PayoutButton id={p.id} status="REJECTED" label="Ablehnen" className="btn btn-ghost px-3 py-1.5 text-xs" />
                      </div>
                    ) : <StatusBadge status={p.status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}

function PayoutButton({ id, status, label, className }: { id: string; status: string; label: string; className: string }) {
  return (
    <form action={setPayoutStatus}>
      <input type="hidden" name="payoutId" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={className}>{label}</button>
    </form>
  );
}

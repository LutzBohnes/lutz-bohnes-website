import { redirect } from "next/navigation";
import { requestPayout } from "@/app/actions/credits";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { EmptyState, PageHeader, Panel, StatTile, StatusBadge } from "@/components/dashboard";
import { requireUser } from "@/lib/auth";
import { formatEuro, MIN_PAYOUT_CREDITS, PAYOUT_CENTS_PER_CREDIT } from "@/lib/config";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Verdienst & Auszahlung" };

export default async function PayoutPage() {
  const user = await requireUser();
  if (user.role === "USER") redirect("/konto");
  const [payouts, earned, settings] = await Promise.all([
    db.payoutRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.creditTransaction.aggregate({ where: { userId: user.id, type: "EARN" }, _sum: { amount: true } }),
    getSettings(),
  ]);
  const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.credits, 0);
  return (
    <>
      <PageHeader title="Verdienst & Auszahlung" subtitle={`1 Credit = ${formatEuro(PAYOUT_CENTS_PER_CREDIT)} · Servicegebühr ${settings.platformFeePercent} % ist bereits abgezogen`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon="wallet" label="Auszahlbar" value={formatEuro(user.earnings * PAYOUT_CENTS_PER_CREDIT)} hint={`${user.earnings.toLocaleString("de-DE")} Credits`} />
        <StatTile icon="chart" tone="accent" label="Insgesamt verdient" value={formatEuro((earned._sum.amount ?? 0) * PAYOUT_CENTS_PER_CREDIT)} />
        <StatTile icon="check" label="Bereits überwiesen" value={formatEuro(paid * PAYOUT_CENTS_PER_CREDIT)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
        <Panel title="Auszahlung beantragen">
          <ActionForm action={requestPayout} className="space-y-3">
            <div>
              <label className="label" htmlFor="credits">Credits</label>
              <input id="credits" name="credits" type="number" min={MIN_PAYOUT_CREDITS} max={user.earnings} defaultValue={user.earnings >= MIN_PAYOUT_CREDITS ? user.earnings : undefined} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="iban">IBAN</label>
              <input id="iban" name="iban" placeholder="DE00 0000 0000 0000 0000 00" className="input font-mono" />
            </div>
            <p className="text-xs text-slate-500">Mindestens {MIN_PAYOUT_CREDITS} Credits. Überweisung meist innerhalb von 5 Werktagen.</p>
            <SubmitButton className="btn btn-accent w-full">Auszahlung beantragen</SubmitButton>
          </ActionForm>
        </Panel>
        <Panel title="Verlauf">
          {payouts.length === 0 ? (
            <EmptyState icon="wallet" title="Noch keine Auszahlungen" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500"><tr><th className="pb-2 font-medium">Datum</th><th className="pb-2 font-medium">Betrag</th><th className="pb-2 font-medium">IBAN</th><th className="pb-2 font-medium">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5">{p.createdAt.toLocaleDateString("de-DE")}</td>
                      <td className="py-2.5 font-semibold tabular-nums">{formatEuro(p.credits * PAYOUT_CENTS_PER_CREDIT)}</td>
                      <td className="py-2.5 font-mono text-slate-500">…{p.iban.slice(-4)}</td>
                      <td className="py-2.5"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

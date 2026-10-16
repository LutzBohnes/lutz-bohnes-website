import Link from "next/link";
import { resolveReport, setBanned } from "@/app/actions/admin";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard";
import { db } from "@/lib/db";

export default async function AdminReports() {
  const reports = await db.report.findMany({
    where: { status: "OPEN" },
    include: { listing: { include: { provider: true, images: { orderBy: { position: "asc" }, take: 1 } } }, reporter: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <>
      <PageHeader title="Meldungen" subtitle="Von Nutzer:innen gemeldete Anzeigen" />
      <Panel>
        {reports.length === 0 ? (
          <EmptyState icon="flag" title="Keine offenen Meldungen" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row">
                {r.listing.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.listing.images[0].url} alt="" className="h-20 w-28 flex-none rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <p>
                    <Link href={`/anzeige/${r.listingId}`} className="font-semibold hover:underline">{r.listing.title}</Link>{" "}
                    <span className="text-sm text-slate-500">von {r.listing.provider.name} · gemeldet von {r.reporter.name} am {r.createdAt.toLocaleDateString("de-DE")}</span>
                  </p>
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{r.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    <ReportButton id={r.id} action="deactivate" label="Anzeige deaktivieren" className="btn btn-danger" />
                    <ReportButton id={r.id} action="dismiss" label="Verwerfen" className="btn btn-ghost" />
                    <form action={setBanned}>
                      <input type="hidden" name="userId" value={r.listing.providerId} />
                      <input type="hidden" name="banned" value="true" />
                      <button className="btn btn-ghost text-red-600">Anbieterin sperren</button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function ReportButton({ id, action, label, className }: { id: string; action: string; label: string; className: string }) {
  return (
    <form action={resolveReport}>
      <input type="hidden" name="reportId" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className={className}>{label}</button>
    </form>
  );
}

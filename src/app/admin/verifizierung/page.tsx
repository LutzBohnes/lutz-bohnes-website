import { setVerification } from "@/app/actions/admin";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard";
import { db } from "@/lib/db";

export default async function AdminVerification() {
  const pending = await db.user.findMany({ where: { verification: "PENDING" }, include: { _count: { select: { listings: true } } }, orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageHeader title="Verifizierung" subtitle="Prüfe Alter (mind. 18) und Identität jeder Anbieterin, zum Beispiel per Videocall mit Ausweis." />
      <Panel>
        {pending.length === 0 ? (
          <EmptyState icon="shield" title="Keine offenen Anfragen" text="Neue Verifizierungsanfragen erscheinen hier." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 py-4">
                <Avatar name={u.name} url={u.avatarUrl} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{u.name} <span className="font-normal text-slate-500">· {u.email}</span></p>
                  <p className="text-sm text-slate-500">{[u.postalCode, u.city].filter(Boolean).join(" ") || "Kein Ort angegeben"} · {u._count.listings} Anzeigen · seit {u.createdAt.toLocaleDateString("de-DE")}</p>
                  {u.verificationNote && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">Hinweis: {u.verificationNote}</p>}
                </div>
                <div className="flex gap-2">
                  <VerifyButton id={u.id} status="VERIFIED" label="Freischalten" className="btn" />
                  <VerifyButton id={u.id} status="REJECTED" label="Ablehnen" className="btn btn-ghost" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function VerifyButton({ id, status, label, className }: { id: string; status: string; label: string; className: string }) {
  return (
    <form action={setVerification}>
      <input type="hidden" name="userId" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={className}>{label}</button>
    </form>
  );
}

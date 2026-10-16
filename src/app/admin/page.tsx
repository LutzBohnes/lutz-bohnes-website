import Link from "next/link";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  resetSettings,
  resolveReport,
  setBanned,
  setPayoutStatus,
  setVerification,
} from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { requireAdmin } from "@/lib/auth";
import { formatEuro, PAYOUT_CENTS_PER_CREDIT } from "@/lib/config";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Admin" };

const TABS = [
  ["design", "Design & Texte"],
  ["kategorien", "Kategorien"],
  ["verifizierung", "Verifizierung"],
  ["meldungen", "Meldungen"],
  ["auszahlungen", "Auszahlungen"],
  ["nutzer", "Nutzer:innen"],
] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab = "design" } = await searchParams;

  const [users, activeListings, purchased, deliveredFees, msgSpend, msgEarn, openReports, pendingVerifications, openPayouts] =
    await Promise.all([
      db.user.count(),
      db.listing.count({ where: { active: true } }),
      db.creditTransaction.aggregate({ where: { type: "PURCHASE" }, _sum: { amount: true } }),
      db.order.aggregate({ where: { status: "DELIVERED" }, _sum: { platformFee: true } }),
      db.message.aggregate({ _sum: { cost: true } }),
      db.creditTransaction.aggregate({ where: { type: "EARN", reference: { startsWith: "msg:" } }, _sum: { amount: true } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.user.count({ where: { verification: "PENDING" } }),
      db.payoutRequest.count({ where: { status: "REQUESTED" } }),
    ]);
  const platformRevenue =
    (deliveredFees._sum.platformFee ?? 0) + (msgSpend._sum.cost ?? 0) - (msgEarn._sum.amount ?? 0);

  const badges: Record<string, number> = {
    verifizierung: pendingVerifications,
    meldungen: openReports,
    auszahlungen: openPayouts,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin-Bereich</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Nutzer:innen" value={users} />
        <Stat label="Aktive Anzeigen" value={activeListings} />
        <Stat label="Verkaufte Credits" value={purchased._sum.amount ?? 0} />
        <Stat
          label="Plattform-Einnahmen"
          value={`${platformRevenue} Credits`}
          hint={`≈ ${formatEuro(platformRevenue * PAYOUT_CENTS_PER_CREDIT)}`}
        />
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/admin?tab=${key}`}
            className={`rounded-md px-3 py-2 text-sm ${tab === key ? "bg-primary text-white" : "hover:bg-slate-100"}`}
          >
            {label}
            {badges[key] ? <span className="ml-1.5 badge bg-accent text-white">{badges[key]}</span> : null}
          </Link>
        ))}
      </nav>

      {tab === "design" && <DesignTab />}
      {tab === "kategorien" && <CategoriesTab />}
      {tab === "verifizierung" && <VerificationTab />}
      {tab === "meldungen" && <ReportsTab />}
      {tab === "auszahlungen" && <PayoutsTab />}
      {tab === "nutzer" && <UsersTab />}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-heading text-2xl font-bold text-primary">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

async function DesignTab() {
  const settings = await getSettings();
  return (
    <section className="card space-y-4">
      <SettingsForm settings={settings} />
      <form action={resetSettings} className="border-t border-slate-200 pt-4">
        <button className="text-sm text-red-600 hover:underline">Alle Design-Einstellungen auf Standard zurücksetzen</button>
      </form>
    </section>
  );
}

async function CategoriesTab() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true } } } });
  return (
    <section className="card space-y-4">
      <ActionForm action={createCategory} className="flex gap-2" resetOnSuccess>
        <input name="name" placeholder="Neue Kategorie, z. B. Gartenarbeit" className="input max-w-sm" />
        <SubmitButton>Hinzufügen</SubmitButton>
      </ActionForm>
      <ul className="divide-y divide-slate-100">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
            <form action={renameCategory} className="flex flex-1 gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="input max-w-xs" />
              <button className="btn btn-ghost">Umbenennen</button>
            </form>
            <span className="text-sm text-slate-500">{c._count.listings} Anzeigen</span>
            {c._count.listings === 0 && (
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-sm text-red-600 hover:underline">Löschen</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function VerificationTab() {
  const pending = await db.user.findMany({
    where: { verification: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  return (
    <section className="card">
      <p className="mb-4 text-sm text-slate-500">
        Prüfe Identität und Alter (mind. 18) jeder Anbieterin, z. B. per Video-Call mit Ausweis, bevor du sie freischaltest.
      </p>
      {pending.length === 0 ? (
        <p className="text-slate-500">Keine offenen Anfragen.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pending.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <strong>{u.name}</strong> · {u.email}
                {u.verificationNote && <span className="block text-sm text-slate-500">Hinweis: {u.verificationNote}</span>}
              </span>
              <span className="flex gap-2">
                <VerifyButton userId={u.id} status="VERIFIED" label="Freischalten" className="btn" />
                <VerifyButton userId={u.id} status="REJECTED" label="Ablehnen" className="btn btn-danger" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VerifyButton({ userId, status, label, className }: { userId: string; status: string; label: string; className: string }) {
  return (
    <form action={setVerification}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button className={className}>{label}</button>
    </form>
  );
}

async function ReportsTab() {
  const reports = await db.report.findMany({
    where: { status: "OPEN" },
    include: { listing: { include: { provider: true } }, reporter: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <section className="card">
      {reports.length === 0 ? (
        <p className="text-slate-500">Keine offenen Meldungen.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {reports.map((r) => (
            <li key={r.id} className="space-y-2 py-3">
              <p>
                <Link href={`/anzeige/${r.listingId}`} className="font-semibold hover:underline">{r.listing.title}</Link>{" "}
                <span className="text-sm text-slate-500">von {r.listing.provider.name} · gemeldet von {r.reporter.name}</span>
              </p>
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm">{r.reason}</p>
              <div className="flex flex-wrap gap-2">
                <ReportButton id={r.id} action="deactivate" label="Anzeige deaktivieren" className="btn btn-danger" />
                <ReportButton id={r.id} action="dismiss" label="Verwerfen" className="btn btn-ghost" />
                <form action={setBanned}>
                  <input type="hidden" name="userId" value={r.listing.providerId} />
                  <input type="hidden" name="banned" value="true" />
                  <button className="btn btn-ghost text-red-600">Anbieterin sperren</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
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

async function PayoutsTab() {
  const payouts = await db.payoutRequest.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <section className="card">
      {payouts.length === 0 ? (
        <p className="text-slate-500">Noch keine Auszahlungen beantragt.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Datum</th><th>Anbieterin</th><th>IBAN</th><th>Betrag</th><th>Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <tr key={p.id}>
                <td className="py-2">{p.createdAt.toLocaleDateString("de-DE")}</td>
                <td>{p.user.name}</td>
                <td className="font-mono">{p.iban}</td>
                <td>{p.credits} Credits = {formatEuro(p.credits * PAYOUT_CENTS_PER_CREDIT)}</td>
                <td>
                  {p.status === "REQUESTED" ? (
                    <span className="flex gap-2">
                      <PayoutButton id={p.id} status="PAID" label="Überwiesen" className="btn" />
                      <PayoutButton id={p.id} status="REJECTED" label="Ablehnen" className="btn btn-ghost" />
                    </span>
                  ) : p.status === "PAID" ? "Überwiesen" : "Abgelehnt"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
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

const ROLE_LABEL = { USER: "Kund:in", PROVIDER: "Anbieterin", ADMIN: "Admin" } as const;

async function UsersTab() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <section className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr><th className="py-2">Name</th><th>E-Mail</th><th>Rolle</th><th>Verifizierung</th><th>Credits</th><th>Verdienst</th><th /></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id} className={u.banned ? "opacity-50" : ""}>
              <td className="py-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{ROLE_LABEL[u.role]}</td>
              <td>{u.role === "USER" ? "–" : u.verification}</td>
              <td>{u.credits}</td>
              <td>{u.earnings}</td>
              <td>
                {u.role !== "ADMIN" && (
                  <form action={setBanned}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="banned" value={String(!u.banned)} />
                    <button className="text-red-600 hover:underline">{u.banned ? "Entsperren" : "Sperren"}</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

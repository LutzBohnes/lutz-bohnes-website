import Link from "next/link";
import { Icon } from "./icon";
import { SidebarNav, type NavItem } from "./sidebar-nav";

export function DashboardShell({ nav, title, children }: { nav: NavItem[]; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <SidebarNav items={nav} title={title} />
      </aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({ label, value, hint, icon, tone = "primary" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon: string; tone?: "primary" | "accent" }) {
  return (
    <div className="card flex items-start gap-4">
      <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-heading text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, text, href, cta }: { icon: string; title: string; text?: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon name={icon} size={26} /></span>
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
      {href && cta && <Link href={href} className="btn mt-2">{cta}</Link>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  REQUESTED: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  NONE: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  DELIVERED: "Erledigt",
  CANCELLED: "Storniert",
  REQUESTED: "Beantragt",
  PAID: "Überwiesen",
  REJECTED: "Abgelehnt",
  VERIFIED: "Verifiziert",
  PENDING: "In Prüfung",
  NONE: "Nicht verifiziert",
  ACTIVE: "Aktiv",
  PAUSED: "Pausiert",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>{STATUS_LABELS[status] ?? status}</span>;
}

/** Summen pro Kalenderwoche der letzten `weeks` Wochen, für Diagramme. */
export function weeklySeries(rows: { createdAt: Date; amount: number }[], weeks = 8) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    return { start: d, label: `${d.getDate()}.${d.getMonth() + 1}.`, value: 0 };
  });
  for (const r of rows) {
    const idx = Math.floor((r.createdAt.getTime() - start.getTime()) / (7 * 864e5));
    if (idx >= 0 && idx < weeks) buckets[idx].value += r.amount;
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

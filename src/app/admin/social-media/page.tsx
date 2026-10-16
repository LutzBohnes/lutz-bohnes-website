import { createPlatform, deletePlatform, movePlatform, togglePlatform, updatePlatform } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export default async function AdminSocial() {
  const [platforms, settings] = await Promise.all([
    db.socialPlatform.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { links: true } } } }),
    getSettings(),
  ]);
  return (
    <>
      <PageHeader
        title="Social Media"
        subtitle="Plattformen, die Anbieterinnen in ihrem Profil verlinken können. Danach lässt sich auf der Startseite filtern."
      />
      {!settings.filterSocial && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Der Social-Media-Filter ist auf der Startseite ausgeblendet. Du kannst ihn unter „Design & Texte“ → „Suche & Filter“ einschalten.
        </p>
      )}
      <Panel title="Neue Plattform">
        <ActionForm action={createPlatform} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input name="name" placeholder="Name, z. B. Pinterest" className="input" />
          <input name="domains" placeholder="Domain(s), z. B. pinterest.com, pin.it" className="input" />
          <SubmitButton>Hinzufügen</SubmitButton>
        </ActionForm>
        <p className="mt-3 text-xs text-slate-500">
          Links von Anbieterinnen müssen auf eine dieser Domains zeigen. Erotik-Plattformen (z. B. OnlyFans, Fansly, MYM) und
          Link-Sammeldienste (z. B. Linktree) sind gesperrt und können nicht angelegt werden.
        </p>
      </Panel>
      <Panel title={`Plattformen (${platforms.length})`}>
        {platforms.length === 0 ? (
          <EmptyState icon="users" title="Noch keine Plattformen" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {platforms.map((p, i) => (
              <li key={p.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="flex flex-col">
                  <SmallButton action={movePlatform} id={p.id} extra={{ direction: "up" }} disabled={i === 0} label="Nach oben">▲</SmallButton>
                  <SmallButton action={movePlatform} id={p.id} extra={{ direction: "down" }} disabled={i === platforms.length - 1} label="Nach unten">▼</SmallButton>
                </div>
                <ActionForm action={updatePlatform} className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.name} className="input" aria-label="Name" />
                  <input name="domains" defaultValue={p.domains} className="input" aria-label="Domains" />
                  <SubmitButton className="btn btn-ghost">Speichern</SubmitButton>
                </ActionForm>
                <div className="flex items-center gap-3 pt-2">
                  <StatusBadge status={p.active ? "ACTIVE" : "PAUSED"} />
                  <span className="text-sm tabular-nums text-slate-500">{p._count.links} Profile</span>
                  <SmallButton action={togglePlatform} id={p.id} label={p.active ? "Ausblenden" : "Einblenden"} text />
                  <SmallButton action={deletePlatform} id={p.id} label="Löschen" text danger />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function SmallButton({ action, id, extra = {}, label, children, disabled, text, danger }: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  extra?: Record<string, string>;
  label: string;
  children?: React.ReactNode;
  disabled?: boolean;
  text?: boolean;
  danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button
        disabled={disabled}
        aria-label={label}
        className={text ? `text-sm font-medium hover:underline ${danger ? "text-red-600" : "text-primary"}` : "h-5 w-7 text-[10px] text-slate-400 hover:text-slate-900 disabled:opacity-20"}
      >
        {children ?? label}
      </button>
    </form>
  );
}

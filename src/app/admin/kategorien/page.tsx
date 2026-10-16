import { createCategory, deleteCategory, renameCategory } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader, Panel } from "@/components/dashboard";
import { db } from "@/lib/db";

export default async function AdminCategories() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true } } } });
  return (
    <>
      <PageHeader title="Kategorien" subtitle="Nach diesen Dienstleistungen kann auf der Startseite gefiltert werden." />
      <Panel>
        <ActionForm action={createCategory} className="mb-4 flex flex-wrap gap-2" resetOnSuccess>
          <input name="name" placeholder="Neue Kategorie, z. B. Umzugshilfe" className="input max-w-sm" />
          <SubmitButton>Hinzufügen</SubmitButton>
        </ActionForm>
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <form action={renameCategory} className="flex flex-1 gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className="input max-w-xs" />
                <button className="btn btn-ghost">Umbenennen</button>
              </form>
              <span className="text-sm tabular-nums text-slate-500">{c._count.listings} Anzeigen</span>
              {c._count.listings === 0 && (
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-sm text-red-600 hover:underline">Löschen</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

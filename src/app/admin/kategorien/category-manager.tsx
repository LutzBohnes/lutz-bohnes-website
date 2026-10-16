"use client";

import { useState } from "react";
import { createCategory, deleteCategory, updateCategory } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/icon";
import { CATEGORY_ICONS } from "@/lib/config";

type Category = { id: string; name: string; icon: string; count: number };

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Symbol">
      {CATEGORY_ICONS.map((ic) => (
        <label
          key={ic}
          className={`grid h-10 w-10 cursor-pointer place-items-center rounded-lg border transition ${
            value === ic ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
          }`}
          title={ic}
        >
          <input type="radio" name="icon" value={ic} checked={value === ic} onChange={() => onChange(ic)} className="sr-only" />
          <Icon name={ic} size={20} />
        </label>
      ))}
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newIcon, setNewIcon] = useState("tag");
  const [editIcon, setEditIcon] = useState("tag");

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Neue Kategorie</h2>
        <ActionForm action={createCategory} resetOnSuccess className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input name="name" placeholder="z. B. Umzugshilfe" className="input max-w-sm" />
            <SubmitButton><Icon name="plus" size={18} /> Hinzufügen</SubmitButton>
          </div>
          <IconPicker value={newIcon} onChange={setNewIcon} />
        </ActionForm>
      </section>

      <section className="card p-0">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary/10 text-primary"><Icon name={c.icon} size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs tabular-nums text-slate-500">{c.count} {c.count === 1 ? "Anzeige" : "Anzeigen"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDeleting(null); setEditing(editing === c.id ? null : c.id); setEditIcon(c.icon); }}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition ${editing === c.id ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                  aria-label={`${c.name} bearbeiten`}
                  title="Bearbeiten"
                >
                  <Icon name="pencil" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(null); setDeleting(deleting === c.id ? null : c.id); }}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition ${deleting === c.id ? "bg-red-600 text-white" : "text-slate-500 hover:bg-red-50 hover:text-red-600"}`}
                  aria-label={`${c.name} löschen`}
                  title="Löschen"
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>

              {editing === c.id && (
                <ActionForm action={updateCategory} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
                  <input type="hidden" name="id" value={c.id} />
                  <div>
                    <label className="label" htmlFor={`name-${c.id}`}>Name</label>
                    <input id={`name-${c.id}`} name="name" defaultValue={c.name} className="input max-w-sm" />
                  </div>
                  <div>
                    <span className="label">Symbol</span>
                    <IconPicker value={editIcon} onChange={setEditIcon} />
                  </div>
                  <div className="flex gap-2">
                    <SubmitButton>Speichern</SubmitButton>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Abbrechen</button>
                  </div>
                </ActionForm>
              )}

              {deleting === c.id && (
                <ActionForm action={deleteCategory} className="mt-3 space-y-3 rounded-xl bg-red-50 p-4">
                  <input type="hidden" name="id" value={c.id} />
                  <p className="text-sm text-red-800">
                    „{c.name}“ wirklich löschen?
                    {c.count > 0 && ` Die ${c.count} ${c.count === 1 ? "Anzeige wird" : "Anzeigen werden"} vorher verschoben nach:`}
                  </p>
                  {c.count > 0 && (
                    <select name="moveTo" className="input max-w-sm" defaultValue="">
                      <option value="" disabled>Kategorie wählen …</option>
                      {categories.filter((o) => o.id !== c.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <SubmitButton className="btn btn-danger">Endgültig löschen</SubmitButton>
                    <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>Abbrechen</button>
                  </div>
                </ActionForm>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

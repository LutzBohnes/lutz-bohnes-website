"use client";

import { useState } from "react";
import type { SiteSettings } from "@prisma/client";
import { updateSettings } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FONT_CHOICES } from "@/lib/config";

const COLORS = [
  ["primaryColor", "Hauptfarbe"],
  ["accentColor", "Akzentfarbe"],
  ["backgroundColor", "Hintergrund"],
  ["textColor", "Textfarbe"],
] as const;

const FILTERS = [
  ["filterSocial", "Social Media (Plattformen unter „Social Media“ verwalten)"],
  ["filterPrice", "Preis bis"],
  ["filterExperience", "Erfahrung ab"],
  ["filterLanguage", "Sprache"],
  ["filterPhotos", "Nur mit Fotos"],
] as const;

/** Branding-Editor mit Live-Vorschau. Gespeicherte Werte gelten sofort für die ganze Seite. */
export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [s, setS] = useState(settings);
  const set = (key: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setS({ ...s, [key]: e.target.value });

  const previewFonts = [...new Set([s.headingFont, s.bodyFont])]
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`)
    .join("&");

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <ActionForm action={updateSettings} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="font-semibold">Name & Texte</legend>
          <Field label="Name der Plattform">
            <input name="siteName" value={s.siteName} onChange={set("siteName")} className="input" required />
          </Field>
          <Field label="Slogan">
            <input name="tagline" value={s.tagline} onChange={set("tagline")} className="input" />
          </Field>
          <Field label="Logo-URL (optional, sonst Anfangsbuchstabe)">
            <input name="logoUrl" value={s.logoUrl ?? ""} onChange={set("logoUrl")} className="input" placeholder="https://…" />
          </Field>
          <Field label="Überschrift Startseite">
            <input name="heroTitle" value={s.heroTitle} onChange={set("heroTitle")} className="input" />
          </Field>
          <Field label="Text Startseite">
            <textarea name="heroText" value={s.heroText} onChange={set("heroText")} rows={3} className="input" />
          </Field>
          <Field label="Footer-Text">
            <input name="footerText" value={s.footerText} onChange={set("footerText")} className="input" />
          </Field>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Schriften</legend>
          <Field label="Überschriften">
            <select name="headingFont" value={s.headingFont} onChange={set("headingFont")} className="input">
              {FONT_CHOICES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Fließtext">
            <select name="bodyFont" value={s.bodyFont} onChange={set("bodyFont")} className="input">
              {FONT_CHOICES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Farben & Form</legend>
          {COLORS.map(([key, label]) => (
            <Field key={key} label={label}>
              <div className="flex gap-2">
                <input type="color" value={s[key]} onChange={set(key)} className="h-10 w-12 cursor-pointer rounded border border-slate-300" />
                <input name={key} value={s[key]} onChange={set(key)} className="input font-mono" />
              </div>
            </Field>
          ))}
          <Field label={`Eckenradius: ${s.borderRadius}px`}>
            <input name="borderRadius" type="range" min={0} max={32} value={s.borderRadius} onChange={set("borderRadius")} className="w-full" />
          </Field>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold">Suche & Filter</legend>
          <p className="text-sm text-slate-500">Welche Zusatzfilter sollen auf der Startseite unter „Weitere Filter“ erscheinen?</p>
          {FILTERS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={key} checked={Boolean(s[key])} onChange={(e) => setS({ ...s, [key]: e.target.checked })} />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-semibold">Geschäftsmodell</legend>
          <Field label="Plattformgebühr in % (von jeder Buchung, jedem Grußvideo und jeder Chat-Nachricht)">
            <input name="platformFeePercent" type="number" min={0} max={50} value={s.platformFeePercent} onChange={set("platformFeePercent")} className="input max-w-32" />
          </Field>
        </fieldset>

        <SubmitButton>Einstellungen speichern</SubmitButton>
      </ActionForm>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${previewFonts}&display=swap`} />
        <p className="mb-2 text-sm font-medium text-slate-500">Live-Vorschau</p>
        <div
          className="overflow-hidden border border-slate-200 shadow-sm"
          style={{ background: s.backgroundColor, color: s.textColor, fontFamily: `"${s.bodyFont}"`, borderRadius: `${s.borderRadius}px` }}
        >
          <div className="flex items-center gap-2 bg-white px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full font-bold text-white" style={{ background: s.primaryColor }}>
              {s.siteName.charAt(0)}
            </span>
            <span>
              <span className="block font-bold" style={{ color: s.primaryColor, fontFamily: `"${s.headingFont}"` }}>{s.siteName}</span>
              <span className="block text-xs text-slate-500">{s.tagline}</span>
            </span>
          </div>
          <div className="m-4 p-5 text-white" style={{ background: s.primaryColor, borderRadius: `${s.borderRadius}px` }}>
            <p className="text-xl font-bold" style={{ fontFamily: `"${s.headingFont}"` }}>{s.heroTitle}</p>
            <p className="mt-2 text-sm opacity-85">{s.heroText}</p>
            <span className="mt-3 inline-block px-4 py-2 text-sm font-medium" style={{ background: s.accentColor, borderRadius: `${s.borderRadius}px` }}>
              Suchen
            </span>
          </div>
          <div className="m-4 bg-white p-4 text-sm" style={{ borderRadius: `${s.borderRadius}px`, color: s.textColor }}>
            <p className="font-semibold" style={{ fontFamily: `"${s.headingFont}"` }}>Einkaufshilfe am Wochenende</p>
            <p className="text-slate-500">Anna · 50667 Köln</p>
            <p className="mt-2 font-bold" style={{ color: s.primaryColor }}>30 Credits</p>
          </div>
          <p className="px-4 pb-4 text-xs opacity-70">{s.footerText}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

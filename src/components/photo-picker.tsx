"use client";

import { useEffect, useRef, useState } from "react";

type Props = { name?: string; max: number; existing?: number };

/** Datei-Auswahl mit Drag & Drop und Vorschau, bevor die Fotos hochgeladen werden. */
export function PhotoPicker({ name = "photos", max, existing = 0 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const free = Math.max(0, max - existing);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  // Gewählte Dateien zurück ins echte <input> schreiben, damit das Formular sie mitschickt.
  function sync(next: File[]) {
    const list = next.slice(0, free);
    const dt = new DataTransfer();
    list.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
    setFiles(list);
  }

  function add(list: FileList | null) {
    if (!list) return;
    sync([...files, ...Array.from(list).filter((f) => f.type.startsWith("image/"))]);
  }

  // Nach erfolgreichem Absenden setzt das Formular das Input zurück → Vorschau leeren.
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const onReset = () => setFiles([]);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  if (free === 0) {
    return <p className="text-sm text-slate-500">Maximal {max} Fotos erreicht. Lösche ein Foto, um ein neues hinzuzufügen.</p>;
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-8 text-center transition ${
          drag ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary hover:bg-slate-50"
        }`}
        style={{ borderRadius: "var(--brand-radius)" }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="m21 16-5-5-8 8" />
        </svg>
        <span className="font-medium">Fotos hierher ziehen oder <span className="text-primary underline">auswählen</span></span>
        <span className="text-xs text-slate-500">JPG, PNG, WebP oder HEIC · max. 8 MB pro Foto · noch {free - files.length} von {max} frei</span>
        <input
          ref={input}
          type="file"
          name={name}
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => add(e.target.files)}
        />
      </label>
      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((src, i) => (
            <li key={src} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && existing === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">Titelbild</span>
              )}
              <button
                type="button"
                onClick={() => sync(files.filter((_, j) => j !== i))}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-90 hover:bg-black/80"
                aria-label="Foto entfernen"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

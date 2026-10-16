"use client";

import { useState } from "react";

export function Gallery({ images, fallback }: { images: { id: string; url: string }[]; fallback: React.ReactNode }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <>{fallback}</>;
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100" style={{ borderRadius: "var(--brand-radius)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt="" className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((active - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow hover:bg-white"
              aria-label="Vorheriges Foto"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((active + 1) % images.length)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow hover:bg-white"
              aria-label="Nächstes Foto"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-20 flex-none overflow-hidden rounded-lg ring-2 transition ${i === active ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100"}`}
              aria-label={`Foto ${i + 1} anzeigen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

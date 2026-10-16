/** Einfaches Säulendiagramm (eine Reihe) mit Tooltip beim Überfahren. Server-renderbar, ohne Bibliothek. */
export function BarChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = niceCeil(max);
  const ticks = [0, nice / 2, nice];
  return (
    <div className="relative">
      <div className="flex h-44 gap-1.5 pl-10">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-44">
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 flex translate-y-1/2 items-center gap-2" style={{ bottom: `${(t / nice) * 100}%` }}>
              <span className="w-8 text-right text-[11px] tabular-nums text-slate-400">{fmt(t)}</span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
          ))}
        </div>
        {data.map((d) => (
          <div key={d.label} className="group relative flex flex-1 flex-col justify-end">
            <div
              className="mx-auto w-full max-w-7 rounded-t bg-primary transition group-hover:opacity-80"
              style={{ height: `${(d.value / nice) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100">
              {d.label}: <strong className="tabular-nums">{fmt(d.value)}</strong> {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 pl-10">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-slate-400">
            {i % 2 === 0 || data.length <= 8 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

function niceCeil(n: number) {
  const pow = 10 ** Math.floor(Math.log10(n));
  const steps = [1, 2, 2.5, 5, 10];
  return (steps.find((s) => s * pow >= n) ?? 10) * pow;
}

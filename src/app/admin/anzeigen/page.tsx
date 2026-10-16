import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { toggleListing } from "@/app/actions/listings";
import { Avatar } from "@/components/avatar";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { Icon } from "@/components/icon";
import { db } from "@/lib/db";

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const where: Prisma.ListingWhereInput = {};
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { provider: { name: { contains: q, mode: "insensitive" } } }, { city: { contains: q, mode: "insensitive" } }];
  if (status === "aktiv") where.active = true;
  if (status === "pausiert") where.active = false;
  if (status === "ohne-fotos") where.images = { none: {} };
  const listings = await db.listing.findMany({
    where,
    include: { provider: true, category: true, images: { orderBy: { position: "asc" } }, _count: { select: { reports: { where: { status: "OPEN" } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader title="Anzeigen" subtitle={`${listings.length} Treffer`} />
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Titel, Anbieterin oder Ort" className="input max-w-xs" />
        <select name="status" defaultValue={status} className="input w-auto">
          <option value="">Alle</option>
          <option value="aktiv">Aktiv</option>
          <option value="pausiert">Pausiert</option>
          <option value="ohne-fotos">Ohne Fotos</option>
        </select>
        <button className="btn">Filtern</button>
      </form>
      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr><th className="p-4 font-medium">Anzeige</th><th className="p-4 font-medium">Anbieterin</th><th className="p-4 font-medium">Fotos</th><th className="p-4 font-medium">Preis</th><th className="p-4 font-medium">Status</th><th className="p-4" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((l) => (
              <tr key={l.id} className="align-middle">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {l.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.images[0].url} alt="" className="h-12 w-16 flex-none rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-12 w-16 flex-none place-items-center rounded-lg bg-slate-100 text-slate-400"><Icon name="image" /></span>
                    )}
                    <div className="min-w-0">
                      <Link href={`/anzeige/${l.id}`} className="font-medium hover:underline">{l.title}</Link>
                      <p className="text-xs text-slate-500">{l.category.name} · {l.postalCode} {l.city}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4"><span className="flex items-center gap-2"><Avatar name={l.provider.name} url={l.provider.avatarUrl} size={28} />{l.provider.name}</span></td>
                <td className="p-4">
                  <div className="flex -space-x-2">
                    {l.images.slice(0, 4).map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={img.id} src={img.url} alt="" className="h-8 w-8 rounded-md object-cover ring-2 ring-white" />
                    ))}
                    {l.images.length === 0 && <span className="text-slate-400">–</span>}
                  </div>
                </td>
                <td className="p-4 tabular-nums">{l.priceCredits} Cr.</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={l.active ? "ACTIVE" : "PAUSED"} />
                    {l._count.reports > 0 && <span className="badge bg-red-100 text-red-700">{l._count.reports} Meldung</span>}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Link href={`/konto/anzeige/${l.id}`} className="btn btn-ghost px-3 py-1.5 text-xs">Bearbeiten</Link>
                    <form action={toggleListing}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className={`btn px-3 py-1.5 text-xs ${l.active ? "btn-danger" : ""}`}>{l.active ? "Deaktivieren" : "Aktivieren"}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

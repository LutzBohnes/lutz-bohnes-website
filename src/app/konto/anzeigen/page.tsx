import Link from "next/link";
import { redirect } from "next/navigation";
import { toggleListing } from "@/app/actions/listings";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { LISTING_TYPE_LABEL } from "@/lib/config";
import { db } from "@/lib/db";

export const metadata = { title: "Meine Anzeigen" };

export default async function MyListingsPage() {
  const user = await requireUser();
  if (user.role === "USER") redirect("/konto");
  const listings = await db.listing.findMany({
    where: { providerId: user.id },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      _count: { select: { orders: { where: { status: "DELIVERED" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader
        title="Meine Anzeigen"
        subtitle={`${listings.length} ${listings.length === 1 ? "Anzeige" : "Anzeigen"}`}
        action={<Link href="/konto/anzeige-neu" className="btn"><Icon name="plus" size={18} /> Neue Anzeige</Link>}
      />
      {listings.length === 0 ? (
        <div className="card"><EmptyState icon="grid" title="Noch keine Anzeigen" text="Leg deine erste Anzeige mit Fotos an. Das dauert nur zwei Minuten." href="/konto/anzeige-neu" cta="Erste Anzeige erstellen" /></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => (
            <article key={l.id} className="card flex flex-col overflow-hidden p-0">
              <Link href={`/konto/anzeige/${l.id}`} className="relative block aspect-[4/3] bg-primary/10">
                {l.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-2 text-primary">
                    <Icon name="image" size={34} />
                    <span className="text-sm font-medium">Fotos hinzufügen</span>
                  </span>
                )}
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                  <Icon name="image" size={14} /> {l.images.length}
                </span>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={l.active ? "ACTIVE" : "PAUSED"} />
                  <span className="text-xs text-slate-500">{l.category.name} · {LISTING_TYPE_LABEL[l.type]}</span>
                </div>
                <h2 className="font-semibold leading-snug">{l.title}</h2>
                <p className="text-sm text-slate-500">{l.priceCredits} Credits · {l._count.orders}× erledigt</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Link href={`/konto/anzeige/${l.id}`} className="btn flex-1">Bearbeiten</Link>
                  <form action={toggleListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-ghost">{l.active ? "Pausieren" : "Aktivieren"}</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

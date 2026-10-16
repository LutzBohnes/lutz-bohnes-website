import Link from "next/link";
import { notFound } from "next/navigation";
import { startConversation } from "@/app/actions/chat";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { getCurrentUser } from "@/lib/auth";
import { LISTING_TYPE_LABEL } from "@/lib/config";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: p?.name ?? "Profil" };
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, provider] = await Promise.all([
    getCurrentUser(),
    db.user.findUnique({
      where: { id },
      include: {
        listings: {
          where: { active: true },
          include: { category: true, images: { orderBy: { position: "asc" } }, _count: { select: { orders: { where: { status: "DELIVERED" } } } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { ordersAsProvider: { where: { status: "DELIVERED" } } } },
      },
    }),
  ]);
  if (!provider || provider.role === "USER" || provider.banned) notFound();
  if (provider.verification !== "VERIFIED" && user?.id !== provider.id && user?.role !== "ADMIN") notFound();

  const photos = provider.listings.flatMap((l) => l.images.map((img) => ({ ...img, listingId: l.id, title: l.title })));
  const categories = [...new Set(provider.listings.map((l) => l.category.name))];
  const prices = provider.listings.map((l) => l.priceCredits);
  const facts = [
    provider.verification === "VERIFIED" && { icon: "shield", text: "Identität verifiziert" },
    provider.city && { icon: "pin", text: [provider.postalCode, provider.city].filter(Boolean).join(" ") },
    provider.experienceYears != null && { icon: "star", text: `${provider.experienceYears} Jahre Erfahrung` },
    provider.languages.length > 0 && { icon: "chat", text: provider.languages.join(", ") },
    { icon: "check", text: `${provider._count.ordersAsProvider} erledigte Aufträge` },
    { icon: "calendar", text: `Dabei seit ${provider.createdAt.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}` },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-0">
        <div className="h-28 bg-primary sm:h-36" />
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6">
          <Avatar name={provider.name} url={provider.avatarUrl} size={120} className="-mt-14 ring-4 ring-white" />
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="text-3xl font-bold tracking-tight">{provider.name}</h1>
            <p className="text-slate-500">{categories.join(" · ") || "Noch keine aktiven Angebote"}</p>
          </div>
          {user && user.id !== provider.id ? (
            <form action={startConversation}>
              <input type="hidden" name="providerId" value={provider.id} />
              <button className="btn"><Icon name="chat" size={18} /> Chatten · {provider.chatPrice} Credits / Nachricht</button>
            </form>
          ) : !user ? (
            <Link href="/login" className="btn">Anmelden zum Chatten</Link>
          ) : (
            <Link href="/konto/profil" className="btn btn-ghost">Profil bearbeiten</Link>
          )}
        </div>
        <div className="grid gap-6 border-t border-slate-100 px-6 py-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Über mich</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{provider.bio || "Diese Anbieterin hat noch keine Beschreibung hinterlegt."}</p>
          </div>
          <ul className="space-y-2.5 text-sm">
            {facts.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5"><span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-primary/10 text-primary"><Icon name={f.icon} size={16} /></span>{f.text}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Alle Dienstleistungen <span className="text-slate-400">({provider.listings.length})</span></h2>
          {prices.length > 0 && <p className="text-sm text-slate-500">ab {Math.min(...prices)} Credits</p>}
        </div>
        <div className="space-y-4">
          {provider.listings.map((l) => (
            <Link key={l.id} href={`/anzeige/${l.id}`} className="card group flex flex-col gap-4 p-4 transition hover:shadow-md sm:flex-row">
              <div className="relative aspect-[4/3] w-full flex-none overflow-hidden rounded-xl bg-primary/10 sm:w-56">
                {l.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.images[0].url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <span className="grid h-full place-items-center font-heading text-4xl font-bold text-primary/60">{l.category.name.charAt(0)}</span>
                )}
                {l.images.length > 1 && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white"><Icon name="image" size={13} />{l.images.length}</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">{l.category.name}</span>
                  {l.type === "GREETING_VIDEO" && <span className="badge bg-accent/15 text-accent">{LISTING_TYPE_LABEL.GREETING_VIDEO}</span>}
                </div>
                <h3 className="text-lg font-semibold leading-snug">{l.title}</h3>
                <p className="line-clamp-2 text-sm text-slate-600">{l.description}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-sm text-slate-500">
                  <span className="font-heading text-lg font-bold text-slate-900">{l.priceCredits} Credits</span>
                  <span>{l._count.orders}× gebucht</span>
                  <span className="ml-auto font-medium text-primary group-hover:underline">Ansehen & buchen →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {photos.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Fotos <span className="text-slate-400">({photos.length})</span></h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((ph) => (
              <Link key={ph.id} href={`/anzeige/${ph.listingId}`} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100" title={ph.title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt={ph.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">{ph.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

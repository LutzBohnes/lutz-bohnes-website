import Link from "next/link";
import { cancelOrder, deliverOrder } from "@/app/actions/orders";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Buchungen" };

const include = {
  listing: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } },
  buyer: true,
  provider: true,
};

export default async function BookingsPage() {
  const user = await requireUser();
  const isProvider = user.role !== "USER";
  const [incoming, outgoing] = await Promise.all([
    isProvider ? db.order.findMany({ where: { providerId: user.id }, include, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 }) : [],
    db.order.findMany({ where: { buyerId: user.id }, include, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <>
      <PageHeader title="Buchungen" subtitle="Credits werden treuhänderisch gehalten, bis eine Buchung erledigt ist." />
      {isProvider && (
        <Panel title="Bei mir gebucht">
          {incoming.length === 0 ? (
            <EmptyState icon="calendar" title="Noch keine Buchungen" text="Sobald jemand dein Angebot bucht, erscheint es hier." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {incoming.map((o) => (
                <li key={o.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                  <Thumb url={o.listing.images[0]?.url} name={o.buyer.name} avatar={o.buyer.avatarUrl} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{o.listing.title}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-slate-500">
                      von {o.buyer.name} · {o.createdAt.toLocaleDateString("de-DE")} · {o.priceCredits} Cr., du erhältst{" "}
                      <strong className="text-slate-700">{o.priceCredits - o.platformFee} Cr.</strong>
                    </p>
                    {o.note && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">„{o.note}“</p>}
                    {o.status === "OPEN" && (
                      <div className="flex flex-wrap items-start gap-2">
                        <ActionForm action={deliverOrder} className="flex flex-1 flex-wrap gap-2">
                          <input type="hidden" name="orderId" value={o.id} />
                          {o.listing.type === "GREETING_VIDEO" && (
                            <input name="deliveryUrl" placeholder="Link zum Video (https://…)" className="input max-w-sm" />
                          )}
                          <SubmitButton>Als erledigt markieren</SubmitButton>
                        </ActionForm>
                        <form action={cancelOrder}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button className="btn btn-ghost">Ablehnen</button>
                        </form>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
      <Panel title={isProvider ? "Von mir gebucht" : "Meine Buchungen"}>
        {outgoing.length === 0 ? (
          <EmptyState icon="calendar" title="Noch nichts gebucht" href="/" cta="Angebote entdecken" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {outgoing.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <Thumb url={o.listing.images[0]?.url} name={o.provider.name} avatar={o.provider.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <Link href={`/anzeige/${o.listingId}`} className="font-medium hover:underline">{o.listing.title}</Link>
                  <p className="text-sm text-slate-500">
                    bei {o.provider.name} · {o.priceCredits} Cr.
                    {o.deliveryUrl && (
                      <a href={o.deliveryUrl} target="_blank" rel="noopener noreferrer" className="ml-2 font-medium text-primary underline">Video ansehen</a>
                    )}
                  </p>
                </div>
                <StatusBadge status={o.status} />
                {o.status === "OPEN" && (
                  <form action={cancelOrder}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <button className="text-sm text-red-600 hover:underline">Stornieren</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function Thumb({ url, name, avatar }: { url?: string; name: string; avatar: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />;
  }
  return <Avatar name={name} url={avatar} size={64} />;
}

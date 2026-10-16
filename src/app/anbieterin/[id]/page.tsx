import { notFound } from "next/navigation";
import { startConversation } from "@/app/actions/chat";
import { ListingCard } from "@/components/listing-card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, provider] = await Promise.all([
    getCurrentUser(),
    db.user.findUnique({
      where: { id },
      include: { listings: { where: { active: true }, include: { category: true }, orderBy: { createdAt: "desc" } } },
    }),
  ]);
  if (!provider || provider.role === "USER" || provider.banned) notFound();
  if (provider.verification !== "VERIFIED" && user?.id !== provider.id && user?.role !== "ADMIN") notFound();

  return (
    <div className="space-y-6">
      <section className="card flex flex-wrap items-center gap-5">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 font-heading text-3xl font-bold text-primary">
          {provider.name.charAt(0)}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{provider.name}</h1>
          <p className="text-slate-500">
            {[provider.postalCode, provider.city].filter(Boolean).join(" ")}
            {provider.verification === "VERIFIED" && <span className="ml-2 text-emerald-700">✔ Verifiziert</span>}
          </p>
          {provider.bio && <p className="mt-2 whitespace-pre-line">{provider.bio}</p>}
        </div>
        {user && user.id !== provider.id && (
          <form action={startConversation}>
            <input type="hidden" name="providerId" value={provider.id} />
            <button className="btn">Chatten ({provider.chatPrice} Credits / Nachricht)</button>
          </form>
        )}
      </section>
      <h2 className="text-xl font-semibold">Angebote</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {provider.listings.map((l) => (
          <ListingCard key={l.id} listing={{ ...l, provider: { name: provider.name } }} />
        ))}
      </div>
    </div>
  );
}

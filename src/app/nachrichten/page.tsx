import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Nachrichten" };

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await db.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { providerId: user.id }] },
    include: {
      buyer: { select: { name: true } },
      provider: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Nachrichten</h1>
      {conversations.length === 0 && <p className="card text-slate-500">Noch keine Unterhaltungen.</p>}
      {conversations.map((c) => {
        const other = c.buyerId === user.id ? c.provider.name : c.buyer.name;
        const last = c.messages[0];
        return (
          <Link key={c.id} href={`/nachrichten/${c.id}`} className="card block hover:shadow-md">
            <p className="font-semibold">{other}</p>
            <p className="truncate text-sm text-slate-500">{last ? last.body : "Noch keine Nachrichten"}</p>
          </Link>
        );
      })}
    </div>
  );
}

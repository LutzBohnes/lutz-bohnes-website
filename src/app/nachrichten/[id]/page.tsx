import Link from "next/link";
import { notFound } from "next/navigation";
import { sendMessage } from "@/app/actions/chat";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const conv = await db.conversation.findUnique({
    where: { id },
    include: { buyer: true, provider: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conv || (conv.buyerId !== user.id && conv.providerId !== user.id)) notFound();
  const isBuyer = conv.buyerId === user.id;
  const other = isBuyer ? conv.provider : conv.buyer;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat mit {other.name}</h1>
        <Link href="/nachrichten" className="text-sm text-primary underline">Alle Chats</Link>
      </div>
      <div className="card flex min-h-80 flex-col gap-3">
        {conv.messages.length === 0 && <p className="m-auto text-slate-400">Schreib die erste Nachricht!</p>}
        {conv.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? "self-end bg-primary text-white" : "self-start bg-slate-100"}`}
            >
              <p className="whitespace-pre-line">{m.body}</p>
              <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                {m.createdAt.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                {m.cost > 0 && isBuyer && ` · ${m.cost} Credits`}
              </p>
            </div>
          );
        })}
      </div>
      <ActionForm action={sendMessage} className="card space-y-2" resetOnSuccess hideOk>
        <input type="hidden" name="conversationId" value={conv.id} />
        <textarea name="body" rows={3} className="input" placeholder="Deine Nachricht…" maxLength={2000} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {isBuyer
              ? `Jede Nachricht kostet ${conv.provider.chatPrice} Credits · Guthaben: ${user.credits}`
              : "Antworten sind für dich kostenlos."}
          </p>
          <SubmitButton>Senden</SubmitButton>
        </div>
      </ActionForm>
      <p className="text-xs text-slate-400">
        Zu deiner Sicherheit: Teile keine Bank- oder Ausweisdaten im Chat und bezahle nur über die Plattform.
      </p>
    </div>
  );
}

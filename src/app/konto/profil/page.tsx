import Link from "next/link";
import { becomeProvider, requestVerification, updateProfile, uploadAvatar } from "@/app/actions/profile";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { requireUser } from "@/lib/auth";
import { MAX_CHAT_PRICE, MIN_CHAT_PRICE } from "@/lib/config";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const isProvider = user.role !== "USER";
  const { platformFeePercent } = await getSettings();
  return (
    <>
      <PageHeader
        title={isProvider ? "Profil & Verifizierung" : "Profil"}
        subtitle={user.email}
        action={isProvider && user.verification === "VERIFIED" ? <Link href={`/anbieterin/${user.id}`} className="btn btn-ghost">Öffentliches Profil ansehen</Link> : undefined}
      />
      <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
        <div className="space-y-6">
          <Panel title="Profilfoto">
            <div className="flex items-center gap-5">
              <Avatar name={user.name} url={user.avatarUrl} size={88} />
              <ActionForm action={uploadAvatar} className="flex-1 space-y-2" resetOnSuccess>
                <input type="file" name="avatar" accept="image/*" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary" />
                <SubmitButton className="btn btn-ghost">Foto hochladen</SubmitButton>
              </ActionForm>
            </div>
            <p className="mt-3 text-xs text-slate-500">Ein freundliches Porträtfoto schafft Vertrauen. Standortdaten werden automatisch entfernt.</p>
          </Panel>

          {isProvider ? (
            <Panel title="Verifizierung" action={<StatusBadge status={user.verification} />}>
              {user.verification === "VERIFIED" ? (
                <p className="text-sm text-slate-600">Du bist verifiziert. Deine Anzeigen sind öffentlich sichtbar und tragen das Verifiziert-Abzeichen.</p>
              ) : user.verification === "PENDING" ? (
                <p className="text-sm text-slate-600">Wir prüfen deine Angaben und melden uns zur Identitätsprüfung bei dir.</p>
              ) : (
                <ActionForm action={requestVerification} className="space-y-3">
                  <p className="text-sm text-slate-600">Damit deine Anzeigen sichtbar werden, prüfen wir einmalig deine Identität per kurzem Videocall mit Ausweis.</p>
                  <textarea name="note" rows={2} className="input" placeholder="Telefonnummer oder gewünschte Uhrzeit" />
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="adult" className="mt-1" />
                    <span>Ich bin mindestens 18 Jahre alt und biete ausschließlich meine eigenen Leistungen an.</span>
                  </label>
                  <SubmitButton>Verifizierung beantragen</SubmitButton>
                </ActionForm>
              )}
            </Panel>
          ) : (
            <Panel title="Selbst Hilfe anbieten?">
              <p className="mb-3 text-sm text-slate-600">Biete deine Dienstleistungen in der Nachbarschaft an und lass dir deinen Verdienst auszahlen.</p>
              <form action={becomeProvider}><button className="btn">Anbieterin werden</button></form>
            </Panel>
          )}
        </div>

        <Panel title="Angaben">
          <ActionForm action={updateProfile} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" defaultValue={user.name} className="input" required />
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <div>
                <label className="label" htmlFor="postalCode">PLZ</label>
                <input id="postalCode" name="postalCode" defaultValue={user.postalCode ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="city">Ort</label>
                <input id="city" name="city" defaultValue={user.city ?? ""} className="input" />
              </div>
            </div>
            {isProvider && (
              <>
                <div>
                  <label className="label" htmlFor="bio">Über mich</label>
                  <textarea id="bio" name="bio" rows={5} defaultValue={user.bio ?? ""} className="input" placeholder="Wer bist du, was kannst du besonders gut?" />
                </div>
                <div>
                  <label className="label" htmlFor="chatPrice">Chat-Preis (Credits pro Nachricht)</label>
                  <input id="chatPrice" name="chatPrice" type="number" min={MIN_CHAT_PRICE} max={MAX_CHAT_PRICE} defaultValue={user.chatPrice} className="input max-w-40" />
                  <p className="mt-1 text-xs text-slate-500">Kund:innen zahlen diesen Preis pro Nachricht, du erhältst {100 - platformFeePercent} % davon.</p>
                </div>
              </>
            )}
            <SubmitButton>Speichern</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}

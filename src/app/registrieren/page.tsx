import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Registrieren" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/konto");
  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-4 text-2xl font-bold">Konto erstellen</h1>
      <ActionForm action={register} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Passwort (mind. 8 Zeichen)</label>
          <input id="password" name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
        </div>
        <fieldset className="space-y-2">
          <legend className="label">Ich möchte …</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="USER" defaultChecked /> Dienstleistungen finden und buchen
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="PROVIDER" /> Meine Dienstleistungen anbieten
          </label>
        </fieldset>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-1" />
          <span>
            Ich akzeptiere die <Link href="/nutzungsbedingungen" className="text-primary underline">Nutzungsbedingungen</Link>.
          </span>
        </label>
        <SubmitButton className="btn w-full">Registrieren</SubmitButton>
      </ActionForm>
    </div>
  );
}

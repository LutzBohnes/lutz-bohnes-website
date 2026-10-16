import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Anmelden" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/konto");
  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-4 text-2xl font-bold">Anmelden</h1>
      <ActionForm action={login} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Passwort</label>
          <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
        </div>
        <SubmitButton className="btn w-full">Anmelden</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-sm text-slate-500">
        Noch kein Konto? <Link href="/registrieren" className="text-primary underline">Jetzt registrieren</Link>
      </p>
    </div>
  );
}

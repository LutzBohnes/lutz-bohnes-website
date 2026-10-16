import { buyCredits } from "@/app/actions/credits";
import { requireUser } from "@/lib/auth";
import { CREDIT_PACKAGES, formatEuro } from "@/lib/config";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "Credits kaufen" };

export default async function CreditsPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const user = await requireUser();
  const { success } = await searchParams;
  const demo = !getStripe();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-slate-500">
          Dein Guthaben: <strong className="text-primary">{user.credits} Credits</strong>. Mit Credits buchst du
          Dienstleistungen, bestellst Grußvideos und chattest mit Anbieterinnen.
        </p>
      </div>
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
          Danke für deinen Kauf! Die Credits wurden deinem Konto gutgeschrieben.
        </p>
      )}
      {demo && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Demo-Modus: Es ist kein Stripe-Schlüssel hinterlegt – Credits werden ohne Zahlung gutgeschrieben.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((p) => (
          <form key={p.id} action={buyCredits} className="card flex flex-col items-center gap-2 text-center">
            <input type="hidden" name="packageId" value={p.id} />
            <span className="badge bg-accent/15 text-accent">{p.label}</span>
            <p className="font-heading text-4xl font-bold text-primary">{p.credits}</p>
            <p className="text-slate-500">Credits</p>
            <p className="text-xl font-semibold">{formatEuro(p.priceCents)}</p>
            <button className="btn mt-2 w-full">Kaufen</button>
          </form>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function Header() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="" className="h-9 w-auto" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-heading text-lg font-bold text-white">
              {settings.siteName.charAt(0)}
            </span>
          )}
          <span className="leading-tight">
            <span className="block font-heading text-xl font-bold text-primary">{settings.siteName}</span>
            {settings.tagline && <span className="block text-xs text-slate-500">{settings.tagline}</span>}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-slate-100">Suchen</Link>
          {user ? (
            <>
              <Link href="/credits" className="rounded-md px-3 py-2 hover:bg-slate-100">
                <span className="badge bg-accent text-white">{user.credits} Credits</span>
              </Link>
              <Link href="/nachrichten" className="rounded-md px-3 py-2 hover:bg-slate-100">Nachrichten</Link>
              <Link href="/konto" className="rounded-md px-3 py-2 hover:bg-slate-100">Mein Konto</Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="rounded-md px-3 py-2 font-semibold text-primary hover:bg-slate-100">
                  Admin
                </Link>
              )}
              <form action={logout}>
                <button className="rounded-md px-3 py-2 text-slate-500 hover:bg-slate-100">Abmelden</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 hover:bg-slate-100">Anmelden</Link>
              <Link href="/registrieren" className="btn">Registrieren</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

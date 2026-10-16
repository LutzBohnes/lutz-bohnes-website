import { DashboardShell } from "@/components/dashboard";
import type { NavItem } from "@/components/sidebar-nav";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isProvider = user.role !== "USER";
  const openIncoming = isProvider ? await db.order.count({ where: { providerId: user.id, status: "OPEN" } }) : 0;
  const nav: NavItem[] = isProvider
    ? [
        { href: "/konto", label: "Übersicht", icon: "home", exact: true },
        { href: "/konto/anzeigen", label: "Meine Anzeigen", icon: "grid" },
        { href: "/konto/buchungen", label: "Buchungen", icon: "calendar", badge: openIncoming },
        { href: "/nachrichten", label: "Nachrichten", icon: "chat" },
        { href: "/konto/auszahlungen", label: "Verdienst & Auszahlung", icon: "wallet" },
        { href: "/konto/profil", label: "Profil & Verifizierung", icon: "user" },
      ]
    : [
        { href: "/konto", label: "Übersicht", icon: "home", exact: true },
        { href: "/konto/buchungen", label: "Meine Buchungen", icon: "calendar" },
        { href: "/nachrichten", label: "Nachrichten", icon: "chat" },
        { href: "/credits", label: "Credits kaufen", icon: "wallet" },
        { href: "/konto/profil", label: "Profil", icon: "user" },
      ];
  return <DashboardShell nav={nav} title={isProvider ? "Anbieterin" : "Mein Konto"}>{children}</DashboardShell>;
}

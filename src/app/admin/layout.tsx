import { DashboardShell } from "@/components/dashboard";
import type { NavItem } from "@/components/sidebar-nav";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [verifications, reports, payouts] = await Promise.all([
    db.user.count({ where: { verification: "PENDING" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.payoutRequest.count({ where: { status: "REQUESTED" } }),
  ]);
  const nav: NavItem[] = [
    { href: "/admin", label: "Übersicht", icon: "chart", exact: true },
    { href: "/admin/anzeigen", label: "Anzeigen", icon: "grid" },
    { href: "/admin/buchungen", label: "Buchungen", icon: "receipt" },
    { href: "/admin/nutzer", label: "Nutzer:innen", icon: "users" },
    { href: "/admin/verifizierung", label: "Verifizierung", icon: "shield", badge: verifications },
    { href: "/admin/meldungen", label: "Meldungen", icon: "flag", badge: reports },
    { href: "/admin/auszahlungen", label: "Auszahlungen", icon: "wallet", badge: payouts },
    { href: "/admin/kategorien", label: "Kategorien", icon: "tag" },
    { href: "/admin/social-media", label: "Social Media", icon: "share" },
    { href: "/admin/design", label: "Design & Texte", icon: "palette" },
  ];
  return <DashboardShell nav={nav} title="Admin">{children}</DashboardShell>;
}

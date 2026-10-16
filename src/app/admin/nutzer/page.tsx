import type { Prisma } from "@prisma/client";
import { setBanned } from "@/app/actions/admin";
import { Avatar } from "@/components/avatar";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { db } from "@/lib/db";

const ROLE_LABEL = { USER: "Kund:in", PROVIDER: "Anbieterin", ADMIN: "Admin" } as const;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; rolle?: string }> }) {
  const { q = "", rolle = "" } = await searchParams;
  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }];
  if (rolle === "USER" || rolle === "PROVIDER" || rolle === "ADMIN") where.role = rolle;
  const users = await db.user.findMany({ where, include: { _count: { select: { listings: true, ordersAsBuyer: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Nutzer:innen" subtitle={`${users.length} Treffer`} />
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Name, E-Mail oder Ort" className="input max-w-xs" />
        <select name="rolle" defaultValue={rolle} className="input w-auto">
          <option value="">Alle Rollen</option>
          <option value="USER">Kund:innen</option>
          <option value="PROVIDER">Anbieterinnen</option>
          <option value="ADMIN">Admins</option>
        </select>
        <button className="btn">Filtern</button>
      </form>
      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr><th className="p-4 font-medium">Person</th><th className="p-4 font-medium">Rolle</th><th className="p-4 font-medium">Ort</th><th className="p-4 text-right font-medium">Guthaben</th><th className="p-4 text-right font-medium">Verdienst</th><th className="p-4 font-medium">Status</th><th className="p-4" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={u.banned ? "opacity-50" : ""}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} url={u.avatarUrl} size={36} />
                    <div><p className="font-medium">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                  </div>
                </td>
                <td className="p-4">{ROLE_LABEL[u.role]}<p className="text-xs text-slate-500">{u.role === "USER" ? `${u._count.ordersAsBuyer} Buchungen` : `${u._count.listings} Anzeigen`}</p></td>
                <td className="p-4">{u.city ?? "–"}</td>
                <td className="p-4 text-right tabular-nums">{u.credits}</td>
                <td className="p-4 text-right tabular-nums">{u.role === "USER" ? "–" : u.earnings}</td>
                <td className="p-4">{u.banned ? <span className="badge bg-red-100 text-red-700">Gesperrt</span> : u.role === "USER" ? <span className="badge bg-slate-100 text-slate-600">Aktiv</span> : <StatusBadge status={u.verification} />}</td>
                <td className="p-4 text-right">
                  {u.role !== "ADMIN" && (
                    <form action={setBanned}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="banned" value={String(!u.banned)} />
                      <button className="text-sm font-medium text-red-600 hover:underline">{u.banned ? "Entsperren" : "Sperren"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

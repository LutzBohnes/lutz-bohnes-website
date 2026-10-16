import { PageHeader } from "@/components/dashboard";
import { db } from "@/lib/db";
import { CategoryManager } from "./category-manager";

export default async function AdminCategories() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true } } } });
  return (
    <>
      <PageHeader title="Kategorien" subtitle="Nach diesen Dienstleistungen kann auf der Startseite gefiltert werden." />
      <CategoryManager categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, count: c._count.listings }))} />
    </>
  );
}

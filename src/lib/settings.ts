import "server-only";
import { cache } from "react";
import { db } from "./db";

export const getSettings = cache(async () => {
  return (
    (await db.siteSettings.findUnique({ where: { id: "site" } })) ??
    (await db.siteSettings.create({ data: { id: "site" } }))
  );
});

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Bitte gib deinen Namen an.").max(60),
  email: z.email("Bitte gib eine gültige E-Mail-Adresse an.").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
  role: z.enum(["USER", "PROVIDER"]),
  terms: z.literal("on", { error: "Bitte akzeptiere die Nutzungsbedingungen." }),
});

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, role } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Mit dieser E-Mail-Adresse gibt es bereits ein Konto." };
  }
  // Das erste Konto wird automatisch Admin.
  const isFirst = (await db.user.count()) === 0;
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: isFirst ? "ADMIN" : role },
  });
  await createSession(user.id);
  redirect("/konto");
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-Mail oder Passwort ist falsch." };
  }
  if (user.banned) return { error: "Dieses Konto wurde gesperrt." };
  await createSession(user.id);
  redirect("/konto");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

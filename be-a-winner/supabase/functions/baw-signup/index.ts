// Be a Winner – Registrierung nur mit Team-Code. Legt Konto (ohne Bestätigungs-Mail) und Profil an.
// Secret: BAW_TEAM_CODE
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { email, password, name, code } = await req.json().catch(() => ({}));
  const teamCode = Deno.env.get("BAW_TEAM_CODE");
  if (!teamCode || String(code ?? "").trim().toUpperCase() !== teamCode.toUpperCase()) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: "Der Team-Code stimmt nicht." }, 403);
  }
  const cleanName = String(name ?? "").trim().slice(0, 40);
  const cleanMail = String(email ?? "").trim().toLowerCase();
  if (!cleanName) return json({ error: "Bitte gib deinen Namen ein." }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanMail)) return json({ error: "Bitte gib eine gültige E-Mail ein." }, 400);
  if (String(password ?? "").length < 6) return json({ error: "Das Passwort muss mindestens 6 Zeichen haben." }, 400);

  const { data, error } = await db.auth.admin.createUser({
    email: cleanMail, password, email_confirm: true, user_metadata: { name: cleanName },
  });
  if (error) {
    if (!/already|registered|exists/i.test(error.message)) return json({ error: error.message }, 400);
    // Konto gibt es schon (z. B. aus einer anderen App im Projekt): mit richtigem Passwort Profil ergänzen
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const si = await anon.auth.signInWithPassword({ email: cleanMail, password });
    if (si.error || !si.data.user) return json({ error: "Diese E-Mail ist schon registriert. Melde dich an." }, 409);
    await db.from("baw_profiles").upsert({ id: si.data.user.id, name: cleanName }, { onConflict: "id", ignoreDuplicates: true });
    return json({ ok: true });
  }
  const p = await db.from("baw_profiles").insert({ id: data.user.id, name: cleanName });
  if (p.error) {
    await db.auth.admin.deleteUser(data.user.id);
    return json({ error: "Profil konnte nicht angelegt werden." }, 500);
  }
  return json({ ok: true });
});

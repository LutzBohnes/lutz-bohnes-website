// Be a Winner – Push-Nachrichten
//  { type: "win", proof_id }  → vom Handy nach einem Foto-Beweis: Push an alle anderen im Team
//  { type: "remind" }         → per Cron alle 5 Min (Header x-cron-secret): Erinnerung an fällige Wins
//  { type: "test" }           → Test-Push an sich selbst
// Secrets (Function-Secrets oder Tabelle baw_config): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
// Schlüssel aus Function-Secrets oder (Fallback) aus der nur serverseitig lesbaren Tabelle baw_config
let cfg: Record<string, string> | null = null;
async function config() {
  if (cfg) return cfg;
  const { data } = await db.from("baw_config").select("key,value");
  cfg = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  for (const k of ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT", "CRON_SECRET"]) {
    const v = Deno.env.get(k); if (v) cfg[k] = v;
  }
  webpush.setVapidDetails(cfg.VAPID_SUBJECT ?? "mailto:team@example.com", cfg.VAPID_PUBLIC_KEY, cfg.VAPID_PRIVATE_KEY);
  return cfg;
}

type Sub = { endpoint: string; p256dh: string; auth: string };

async function send(subs: Sub[], payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 3600 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("baw_push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }));
  return sent;
}

function berlinNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = await req.json().catch(() => ({}));
  const c = await config();

  if (body.type === "remind") {
    if (!c.CRON_SECRET || req.headers.get("x-cron-secret") !== c.CRON_SECRET) {
      return json({ error: "forbidden" }, 403);
    }
    const now = berlinNow();
    const { data: open } = await db.from("baw_planned_wins")
      .select("id,user_id,title,due_time,slot,proofs:baw_proofs(id)")
      .eq("day", now.day).is("reminded_at", null);
    const due = (open ?? []).filter((w) => {
      const m = toMin(w.due_time);
      return (!w.proofs || (Array.isArray(w.proofs) ? w.proofs.length === 0 : false)) && now.minutes >= m - 15 && now.minutes <= m + 15;
    });
    let sent = 0;
    for (const w of due) {
      const { data: subs } = await db.from("baw_push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", w.user_id);
      sent += await send(subs ?? [], {
        title: "⏰ Zeit für deinen Win",
        body: `${w.title} – fällig um ${w.due_time.slice(0, 5)} Uhr. Beweis per Foto!`,
        tag: `remind-${w.id}`, url: "./",
      });
      await db.from("baw_planned_wins").update({ reminded_at: new Date().toISOString() }).eq("id", w.id);
    }
    return json({ reminded: due.length, sent });
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return json({ error: "unauthorized" }, 401);

  if (body.type === "test") {
    const { data: subs } = await db.from("baw_push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", user.id);
    return json({ sent: await send(subs ?? [], { title: "🏆 Be a Winner", body: "Push-Nachrichten sind aktiv.", url: "./" }) });
  }

  if (body.type === "win" && typeof body.proof_id === "string") {
    const { data: proof } = await db.from("baw_proofs")
      .select("id,user_id,on_time,planned_wins:baw_planned_wins(title,slot),profiles:baw_profiles(name)")
      .eq("id", body.proof_id).single();
    if (!proof || proof.user_id !== user.id) return json({ error: "not found" }, 404);
    // deno-lint-ignore no-explicit-any
    const p = proof as any;
    const { data: subs } = await db.from("baw_push_subscriptions").select("endpoint,p256dh,auth").neq("user_id", user.id);
    const sent = await send(subs ?? [], {
      title: `🏆 ${p.profiles?.name ?? "Jemand"} hat einen Win geholt`,
      body: p.planned_wins?.title ?? "",
      tag: `win-${proof.id}`, url: "./",
    });
    return json({ sent });
  }

  return json({ error: "bad request" }, 400);
});

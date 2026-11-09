-- Be a Winner – Datenbank-Schema für Supabase (alle Objekte mit Präfix baw_, verträgt sich mit anderen Apps im Projekt)
-- Alle Zeiten gelten in Europe/Berlin.

create extension if not exists pgcrypto;

-- Profile (eins pro Konto) ------------------------------------------------
create table if not exists public.baw_profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- Profile legt die Edge Function baw-signup an (mit Team-Code), kein Trigger auf auth.users,
-- damit andere Apps im selben Projekt unberührt bleiben.

-- Wochenziel --------------------------------------------------------------
create table if not exists public.baw_week_goals (
  user_id uuid not null default auth.uid() references public.baw_profiles on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  goal text not null default '' check (char_length(goal) <= 200),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- Geplante Wins: pro Tag 2 morgens (vor der Arbeit) + 1 abends (1/5 vom Wochenziel)
create table if not exists public.baw_planned_wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.baw_profiles on delete cascade,
  day date not null,
  slot text not null check (slot in ('morning1', 'morning2', 'evening')),
  title text not null check (char_length(title) between 1 and 120),
  due_time time not null,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, day, slot)
);
create index if not exists baw_planned_wins_day_idx on public.baw_planned_wins (day);

-- Foto-Beweise: ein Win zählt nur mit Foto -----------------------------------
create table if not exists public.baw_proofs (
  id uuid primary key default gen_random_uuid(),
  planned_win_id uuid not null unique references public.baw_planned_wins on delete cascade,
  user_id uuid not null default auth.uid() references public.baw_profiles on delete cascade,
  photo_path text not null,
  caption text check (char_length(caption) <= 140),
  on_time boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists baw_proofs_user_idx on public.baw_proofs (user_id);

-- Regeln serverseitig: nur eigener Win, nur am geplanten Tag, pünktlich bis 15 Min nach Fälligkeit
create or replace function public.baw_check_proof() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pw public.baw_planned_wins;
  now_berlin timestamp := (now() at time zone 'Europe/Berlin');
begin
  select * into pw from public.baw_planned_wins where id = new.planned_win_id;
  if pw.id is null or pw.user_id <> new.user_id then
    raise exception 'Dieser Win gehört nicht dir.';
  end if;
  if pw.day <> now_berlin::date then
    raise exception 'Ein Win kann nur am geplanten Tag bewiesen werden.';
  end if;
  if new.photo_path not like new.user_id::text || '/%' then
    raise exception 'Ungültiges Foto.';
  end if;
  new.on_time := now_berlin <= (pw.day + pw.due_time + interval '15 minutes');
  new.created_at := now();
  return new;
end $$;

drop trigger if exists baw_proofs_check on public.baw_proofs;
create trigger baw_proofs_check before insert on public.baw_proofs
  for each row execute function public.baw_check_proof();

-- Reaktionen ----------------------------------------------------------------
create table if not exists public.baw_reactions (
  proof_id uuid not null references public.baw_proofs on delete cascade,
  user_id uuid not null default auth.uid() references public.baw_profiles on delete cascade,
  emoji text not null check (emoji in ('🔥', '💪', '👏', '🏆')),
  created_at timestamptz not null default now(),
  primary key (proof_id, user_id, emoji)
);

-- Push-Abos -----------------------------------------------------------------
create table if not exists public.baw_push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references public.baw_profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Rangliste gesamt ------------------------------------------------------------
create or replace view public.baw_leaderboard_all with (security_invoker = true) as
  select p.id as user_id,
         count(pr.id)::int as wins,
         count(pr.id) filter (where pr.on_time)::int as on_time
  from public.baw_profiles p
  left join public.baw_proofs pr on pr.user_id = p.id
  group by p.id;

-- Nur Team-Mitglieder (mit Be-a-Winner-Profil) sehen etwas
create or replace function public.baw_is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.baw_profiles where id = (select auth.uid()));
$$;

-- Row Level Security: alle im Team sehen alles, ändern nur Eigenes -------------
alter table public.baw_profiles enable row level security;
alter table public.baw_week_goals enable row level security;
alter table public.baw_planned_wins enable row level security;
alter table public.baw_proofs enable row level security;
alter table public.baw_reactions enable row level security;
alter table public.baw_push_subscriptions enable row level security;

create policy "Team sieht Profile" on public.baw_profiles for select to authenticated using ((select public.baw_is_member()));
create policy "Eigenes Profil ändern" on public.baw_profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Team sieht Ziele" on public.baw_week_goals for select to authenticated using ((select public.baw_is_member()));
create policy "Eigenes Ziel anlegen" on public.baw_week_goals for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Eigenes Ziel ändern" on public.baw_week_goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Team sieht Pläne" on public.baw_planned_wins for select to authenticated using ((select public.baw_is_member()));
create policy "Eigene Wins planen" on public.baw_planned_wins for insert to authenticated
  with check (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date);
create policy "Offene eigene Wins ändern" on public.baw_planned_wins for update to authenticated
  using (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date
         and not exists (select 1 from public.baw_proofs pr where pr.planned_win_id = baw_planned_wins.id))
  with check (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date);
create policy "Offene eigene Wins löschen" on public.baw_planned_wins for delete to authenticated
  using (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date
         and not exists (select 1 from public.baw_proofs pr where pr.planned_win_id = baw_planned_wins.id));

create policy "Team sieht Beweise" on public.baw_proofs for select to authenticated using ((select public.baw_is_member()));
create policy "Eigenen Beweis posten" on public.baw_proofs for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Team sieht Reaktionen" on public.baw_reactions for select to authenticated using ((select public.baw_is_member()));
create policy "Reagieren" on public.baw_reactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Reaktion zurücknehmen" on public.baw_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Eigene Push-Abos lesen" on public.baw_push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Push abonnieren" on public.baw_push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Push-Abo aktualisieren" on public.baw_push_subscriptions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Push abbestellen" on public.baw_push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

-- Foto-Speicher (privat, nur für angemeldete Team-Mitglieder) --------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('baw-proofs', 'baw-proofs', false, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "BAW Team sieht Fotos" on storage.objects for select to authenticated
  using (bucket_id = 'baw-proofs' and (select public.baw_is_member()));
create policy "BAW eigene Fotos hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'baw-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "BAW eigene Fotos löschen" on storage.objects for delete to authenticated
  using (bucket_id = 'baw-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Server-Konfiguration (VAPID-Schlüssel, CRON_SECRET, BAW_TEAM_CODE): nur für die Edge Functions lesbar
create table if not exists public.baw_config (key text primary key, value text not null);
alter table public.baw_config enable row level security;
revoke all on public.baw_config from anon, authenticated;

-- Live-Updates im Feed --------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.baw_proofs, public.baw_reactions;
exception when others then null; end $$;

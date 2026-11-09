-- Be a Winner – Datenbank-Schema für Supabase
-- Alle Zeiten gelten in Europe/Berlin.

create extension if not exists pgcrypto;

-- Profile (eins pro Konto) ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Wochenziel --------------------------------------------------------------
create table if not exists public.week_goals (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  goal text not null default '' check (char_length(goal) <= 200),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- Geplante Wins: pro Tag 2 morgens (vor der Arbeit) + 1 abends (1/5 vom Wochenziel)
create table if not exists public.planned_wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day date not null,
  slot text not null check (slot in ('morning1', 'morning2', 'evening')),
  title text not null check (char_length(title) between 1 and 120),
  due_time time not null,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, day, slot)
);
create index if not exists planned_wins_day_idx on public.planned_wins (day);

-- Foto-Beweise: ein Win zählt nur mit Foto -----------------------------------
create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  planned_win_id uuid not null unique references public.planned_wins on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  photo_path text not null,
  caption text check (char_length(caption) <= 140),
  on_time boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists proofs_user_idx on public.proofs (user_id);

-- Regeln serverseitig: nur eigener Win, nur am geplanten Tag, pünktlich bis 15 Min nach Fälligkeit
create or replace function public.check_proof() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pw public.planned_wins;
  now_berlin timestamp := (now() at time zone 'Europe/Berlin');
begin
  select * into pw from public.planned_wins where id = new.planned_win_id;
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

drop trigger if exists proofs_check on public.proofs;
create trigger proofs_check before insert on public.proofs
  for each row execute function public.check_proof();

-- Reaktionen ----------------------------------------------------------------
create table if not exists public.reactions (
  proof_id uuid not null references public.proofs on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  emoji text not null check (emoji in ('🔥', '💪', '👏', '🏆')),
  created_at timestamptz not null default now(),
  primary key (proof_id, user_id, emoji)
);

-- Push-Abos -----------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Rangliste gesamt ------------------------------------------------------------
create or replace view public.leaderboard_all with (security_invoker = true) as
  select p.id as user_id,
         count(pr.id)::int as wins,
         count(pr.id) filter (where pr.on_time)::int as on_time
  from public.profiles p
  left join public.proofs pr on pr.user_id = p.id
  group by p.id;

-- Row Level Security: alle im Team sehen alles, ändern nur Eigenes -------------
alter table public.profiles enable row level security;
alter table public.week_goals enable row level security;
alter table public.planned_wins enable row level security;
alter table public.proofs enable row level security;
alter table public.reactions enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Team sieht Profile" on public.profiles for select to authenticated using (true);
create policy "Eigenes Profil ändern" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Team sieht Ziele" on public.week_goals for select to authenticated using (true);
create policy "Eigenes Ziel anlegen" on public.week_goals for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Eigenes Ziel ändern" on public.week_goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Team sieht Pläne" on public.planned_wins for select to authenticated using (true);
create policy "Eigene Wins planen" on public.planned_wins for insert to authenticated
  with check (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date);
create policy "Offene eigene Wins ändern" on public.planned_wins for update to authenticated
  using (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date
         and not exists (select 1 from public.proofs pr where pr.planned_win_id = planned_wins.id))
  with check (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date);
create policy "Offene eigene Wins löschen" on public.planned_wins for delete to authenticated
  using (user_id = (select auth.uid()) and day >= (now() at time zone 'Europe/Berlin')::date
         and not exists (select 1 from public.proofs pr where pr.planned_win_id = planned_wins.id));

create policy "Team sieht Beweise" on public.proofs for select to authenticated using (true);
create policy "Eigenen Beweis posten" on public.proofs for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Team sieht Reaktionen" on public.reactions for select to authenticated using (true);
create policy "Reagieren" on public.reactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Reaktion zurücknehmen" on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Eigene Push-Abos lesen" on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Push abonnieren" on public.push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Push-Abo aktualisieren" on public.push_subscriptions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Push abbestellen" on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

-- Foto-Speicher (privat, nur für angemeldete Team-Mitglieder) --------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "Team sieht Fotos" on storage.objects for select to authenticated
  using (bucket_id = 'proofs');
create policy "Eigene Fotos hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Live-Updates im Feed --------------------------------------------------------
alter publication supabase_realtime add table public.proofs, public.reactions;

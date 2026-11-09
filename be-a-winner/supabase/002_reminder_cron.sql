-- Erinnerungs-Push 15 Min vor jedem geplanten Win (alle 5 Min geprüft).
-- CRON_SECRET liegt in der Tabelle baw_config (nur serverseitig lesbar). <PROJECT_REF> ersetzen.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('baw-remind', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/baw-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.baw_config where key = 'CRON_SECRET')),
    body := '{"type":"remind"}'::jsonb
  );
$$);

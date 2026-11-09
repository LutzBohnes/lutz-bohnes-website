-- Optional: Erinnerungs-Push 15 Min vor jedem geplanten Win.
-- Vorher <PROJECT_REF> und <CRON_SECRET> ersetzen (CRON_SECRET = gleicher Wert wie das Function-Secret).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'be-a-winner-remind',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{"type":"remind"}'::jsonb
  );
  $$
);

-- Schedule the protected due-work route from Supabase Cron. Runtime secrets are
-- read from Vault so neither the application URL nor the cron secret is stored
-- in migration text, source control, or cron query parameters.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'called-it-sports-sync';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'called-it-sports-sync',
    '* * * * *',
    $job$
      select net.http_post(
        url := (
          select decrypted_secret || '/api/cron/sports-sync'
          from vault.decrypted_secrets
          where name = 'called_it_app_url'
          limit 1
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sports-cron-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'called_it_sports_cron_secret'
            limit 1
          )
        ),
        body := '{"dryRun": false}'::jsonb,
        timeout_milliseconds := 120000
      )
      where exists (
        select 1 from vault.decrypted_secrets where name = 'called_it_app_url'
      )
      and exists (
        select 1 from vault.decrypted_secrets where name = 'called_it_sports_cron_secret'
      );
    $job$
  );
end;
$$;

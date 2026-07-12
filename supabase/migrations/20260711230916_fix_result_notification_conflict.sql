drop index if exists public.notifications_dedupe_key_idx;
create unique index notifications_dedupe_key_idx on public.notifications(dedupe_key);

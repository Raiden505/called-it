alter table public.ai_summaries
  add column if not exists input_hash text,
  add column if not exists expires_at timestamptz;

update public.ai_summaries
set input_hash = md5(source_snapshot::text)
where input_hash is null;

alter table public.ai_summaries
  alter column input_hash set not null;

create unique index if not exists ai_summaries_user_type_hash_key
  on public.ai_summaries(user_id, summary_type, input_hash);

create index if not exists ai_summaries_user_type_created_idx
  on public.ai_summaries(user_id, summary_type, created_at desc);

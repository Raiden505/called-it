alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles drop constraint if exists profile_username_format;
alter table public.profiles add constraint profile_username_format check (username is null or (username::text = lower(username::text) and username::text ~ '^[a-z0-9_]+$'));
alter table public.profiles drop constraint if exists profile_display_name_length;
alter table public.profiles add constraint profile_display_name_length check (char_length(btrim(display_name)) between 1 and 60);
alter table public.profiles add constraint profile_username_reserved check (username is null or username::text not in ('admin','api','auth','callback','cards','dashboard','friends','leaderboard','login','matches','onboarding','profile','settings','signup'));
create index if not exists profiles_favorite_team_idx on public.profiles(favorite_team_id);

create or replace function public.set_profile_onboarding_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.username is not null and new.favorite_team_id is not null and char_length(btrim(new.display_name)) between 1 and 60 then
    new.onboarding_completed_at := coalesce(new.onboarding_completed_at, now());
  else
    new.onboarding_completed_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_onboarding_completed_at on public.profiles;
create trigger profiles_set_onboarding_completed_at before insert or update on public.profiles for each row execute function public.set_profile_onboarding_completed_at();

alter table public.called_it_cards
  add column if not exists match_id uuid references public.matches(id) on delete cascade,
  add column if not exists rarity_percentage numeric(5, 1) not null default 0,
  add column if not exists result_version integer not null default 0,
  add column if not exists issued_at timestamptz not null default now(),
  add column if not exists revoked_at timestamptz;

update public.called_it_cards card
set
  match_id = prediction.match_id,
  issued_at = card.created_at
from public.predictions prediction
where prediction.id = card.prediction_id
  and card.match_id is null;

alter table public.called_it_cards
  alter column match_id set not null;

alter table public.called_it_cards
  drop constraint if exists called_it_cards_prediction_id_key;

create unique index if not exists called_it_cards_active_prediction_key
  on public.called_it_cards(prediction_id)
  where revoked_at is null;

create index if not exists called_it_cards_match_active_idx
  on public.called_it_cards(match_id, issued_at desc)
  where revoked_at is null;

create index if not exists called_it_cards_user_issued_idx
  on public.called_it_cards(user_id, issued_at desc);

drop policy if exists "Anyone can read public Called It cards" on public.called_it_cards;

create policy "Anyone can read active public Called It cards"
  on public.called_it_cards for select to anon, authenticated
  using (is_public = true and revoked_at is null);

create policy "Users can read their own Called It cards"
  on public.called_it_cards for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.set_called_it_card_visibility(p_card_id uuid, p_is_public boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.called_it_cards
  set is_public = p_is_public
  where id = p_card_id
    and user_id = current_user_id
    and revoked_at is null;

  if not found then
    raise exception 'Called It card not found';
  end if;
end;
$$;

revoke execute on function public.set_called_it_card_visibility(uuid, boolean) from public, anon, service_role;
grant execute on function public.set_called_it_card_visibility(uuid, boolean) to authenticated;

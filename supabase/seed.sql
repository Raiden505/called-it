insert into public.tournaments (id, external_id, name, season, starts_at, ends_at, status, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo-world-cup-2026',
  'Called It Demo Cup',
  '2026',
  '2026-06-11T00:00:00Z',
  '2026-07-19T23:59:59Z',
  'active',
  true
)
on conflict (id) do update set is_active = excluded.is_active;

insert into public.teams (id, external_id, name, short_name, code, country_code)
values
  ('00000000-0000-0000-0000-000000000011', 'demo-england', 'England', 'England', 'ENG', 'GB'),
  ('00000000-0000-0000-0000-000000000012', 'demo-brazil', 'Brazil', 'Brazil', 'BRA', 'BR'),
  ('00000000-0000-0000-0000-000000000013', 'demo-france', 'France', 'France', 'FRA', 'FR'),
  ('00000000-0000-0000-0000-000000000014', 'demo-germany', 'Germany', 'Germany', 'GER', 'DE')
on conflict (id) do update set name = excluded.name, short_name = excluded.short_name, code = excluded.code, country_code = excluded.country_code;

insert into public.players (id, external_id, team_id, name, position, is_active)
values
  ('00000000-0000-0000-0000-000000000101', 'demo-england-1', '00000000-0000-0000-0000-000000000011', 'Demo Striker', 'Forward', true),
  ('00000000-0000-0000-0000-000000000102', 'demo-brazil-1', '00000000-0000-0000-0000-000000000012', 'Demo Finisher', 'Forward', true),
  ('00000000-0000-0000-0000-000000000103', 'demo-france-1', '00000000-0000-0000-0000-000000000013', 'Demo Captain', 'Forward', true),
  ('00000000-0000-0000-0000-000000000104', 'demo-germany-1', '00000000-0000-0000-0000-000000000014', 'Demo Forward', 'Forward', true)
on conflict (id) do update set name = excluded.name, position = excluded.position, is_active = excluded.is_active;

insert into public.matches (id, external_id, tournament_id, home_team_id, away_team_id, stage, kickoff_at, status, home_score_90, away_score_90, home_score_final, away_score_final, first_goalscorer_id, result_version, result_confirmed_at)
values
  (
    '00000000-0000-0000-0000-000000000201',
    'demo-match-finished',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    'Group stage',
    '2026-06-20T16:00:00Z',
    'finished',
    2,
    1,
    2,
    1,
    '00000000-0000-0000-0000-000000000101',
    1,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'demo-match-upcoming',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014',
    'Group stage',
    '2026-07-15T19:00:00Z',
    'scheduled',
    null,
    null,
    null,
    null,
    null,
    0,
    null
  )
on conflict (id) do update set status = excluded.status, home_score_90 = excluded.home_score_90, away_score_90 = excluded.away_score_90;

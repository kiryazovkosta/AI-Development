-- Each user's €2 commemorative coins: one row per user with the ids from
-- public/assets/commemoratives/catalog.json (e.g. '2025-mc-marquisat-des-baux').
-- Users can read and change only their own row.

create table if not exists public.owned_commemoratives (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  coin_ids     text[] not null default '{}',
  last_updated timestamptz not null default now()
);

alter table public.owned_commemoratives enable row level security;

drop policy if exists "owned_commemoratives select own" on public.owned_commemoratives;
create policy "owned_commemoratives select own" on public.owned_commemoratives
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "owned_commemoratives insert own" on public.owned_commemoratives;
create policy "owned_commemoratives insert own" on public.owned_commemoratives
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "owned_commemoratives update own" on public.owned_commemoratives;
create policy "owned_commemoratives update own" on public.owned_commemoratives
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

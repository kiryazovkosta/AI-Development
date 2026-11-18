-- Coin catalog: design descriptions and every national-side series per country and denomination.
-- Generated from the ECB export (README.md per coin). Images are served from public/assets/coins.
-- Read-only reference data: any signed-in user may read it, only the service role may change it.

create table if not exists public.coin_issuers (
  country_code text primary key,
  description  text
);

create table if not exists public.coin_designs (
  country_code text not null,
  denomination text not null check (denomination in ('1c','2c','5c','10c','20c','50c','1e','2e')),
  description  text,
  details      jsonb not null default '[]'::jsonb,
  primary key (country_code, denomination)
);

create table if not exists public.coin_series (
  country_code text not null,
  denomination text not null,
  series_no    smallint not null check (series_no > 0),
  years        text not null,
  start_year   smallint not null,
  design       text not null,
  image_path   text not null,
  thumb_path   text not null,
  primary key (country_code, denomination, series_no),
  foreign key (country_code, denomination) references public.coin_designs (country_code, denomination) on delete cascade
);

alter table public.coin_issuers enable row level security;
alter table public.coin_designs enable row level security;
alter table public.coin_series  enable row level security;

drop policy if exists "coin_issuers readable by signed-in users" on public.coin_issuers;
create policy "coin_issuers readable by signed-in users" on public.coin_issuers
  for select to authenticated using (true);

drop policy if exists "coin_designs readable by signed-in users" on public.coin_designs;
create policy "coin_designs readable by signed-in users" on public.coin_designs
  for select to authenticated using (true);

drop policy if exists "coin_series readable by signed-in users" on public.coin_series;
create policy "coin_series readable by signed-in users" on public.coin_series
  for select to authenticated using (true);

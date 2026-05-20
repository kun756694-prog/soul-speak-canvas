
create type public.ad_type as enum ('buy','sell');

create table public.p2p_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type public.ad_type not null,
  crypto text not null default 'POINT',
  currency text not null,
  country_code text,
  price numeric not null check (price > 0),
  available numeric not null check (available > 0),
  min_limit numeric not null check (min_limit > 0),
  max_limit numeric not null check (max_limit > 0),
  payment_methods text[] not null default '{}',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index p2p_ads_currency_active_idx on public.p2p_ads (currency, is_active, type);

alter table public.p2p_ads enable row level security;

create policy "ads readable by authenticated" on public.p2p_ads
  for select to authenticated using (is_active = true or auth.uid() = user_id);

create policy "users insert own ads" on public.p2p_ads
  for insert to authenticated with check (auth.uid() = user_id);

create policy "users update own ads" on public.p2p_ads
  for update to authenticated using (auth.uid() = user_id);

create policy "users delete own ads" on public.p2p_ads
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.touch_p2p_ads_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger p2p_ads_touch before update on public.p2p_ads
  for each row execute function public.touch_p2p_ads_updated_at();

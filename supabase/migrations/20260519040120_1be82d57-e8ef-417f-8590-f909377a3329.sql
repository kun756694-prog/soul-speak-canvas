
-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  kyc_level int not null default 1,
  total_trades int not null default 0,
  completion_rate numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Wallets table (one per user)
create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- Transactions
create type public.tx_type as enum ('deposit','withdraw','p2p_buy','p2p_sell','transfer_in','transfer_out');
create type public.tx_status as enum ('completed','pending','failed','cancelled');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.tx_type not null,
  amount numeric not null,
  currency text not null default 'POINT',
  status public.tx_status not null default 'completed',
  fee numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index transactions_user_created_idx on public.transactions(user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own wallet read" on public.wallets for select using (auth.uid() = user_id);

create policy "own transactions read" on public.transactions for select using (auth.uid() = user_id);

-- New user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  insert into public.wallets (user_id, balance) values (new.id, 10000);
  insert into public.transactions (user_id, type, amount, currency, status, notes)
  values (new.id, 'deposit', 10000, 'POINT', 'completed', 'Welcome bonus');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Atomic wallet operations as SECURITY DEFINER (RLS-safe; check auth.uid())
create or replace function public.deposit_points(_amount numeric)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if _amount <= 0 then raise exception 'invalid amount'; end if;
  update public.wallets set balance = balance + _amount, updated_at = now() where user_id = uid;
  insert into public.transactions (user_id, type, amount, currency, status)
  values (uid, 'deposit', _amount, 'POINT', 'completed');
end; $$;

create or replace function public.withdraw_points(_amount numeric, _address text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); cur numeric;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if _amount <= 0 then raise exception 'invalid amount'; end if;
  select balance into cur from public.wallets where user_id = uid for update;
  if cur < _amount then raise exception 'insufficient balance'; end if;
  update public.wallets set balance = balance - _amount, updated_at = now() where user_id = uid;
  insert into public.transactions (user_id, type, amount, currency, status, notes)
  values (uid, 'withdraw', _amount, 'POINT', 'completed', 'To ' || _address);
end; $$;

create or replace function public.transfer_points(_username text, _amount numeric, _notes text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); cur numeric;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if _amount <= 0 then raise exception 'invalid amount'; end if;
  select balance into cur from public.wallets where user_id = uid for update;
  if cur < _amount then raise exception 'insufficient balance'; end if;
  update public.wallets set balance = balance - _amount, updated_at = now() where user_id = uid;
  insert into public.transactions (user_id, type, amount, currency, status, notes)
  values (uid, 'transfer_out', _amount, 'POINT', 'completed', coalesce(_notes, 'To ' || _username));
end; $$;


-- Roles
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- KYC status enum + profile column
create type public.kyc_status as enum ('unverified','pending','verified','rejected');
alter table public.profiles add column kyc_status public.kyc_status not null default 'unverified';

-- KYC submissions
create table public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text not null,
  id_type text not null,
  document_path text not null,
  status public.kyc_status not null default 'pending',
  notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index kyc_submissions_user_idx on public.kyc_submissions (user_id, submitted_at desc);
alter table public.kyc_submissions enable row level security;

create policy "users read own kyc" on public.kyc_submissions
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "users insert own kyc" on public.kyc_submissions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "admins update kyc" on public.kyc_submissions
  for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Keep profiles.kyc_status in sync with latest submission
create or replace function public.sync_profile_kyc_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set kyc_status = new.status where id = new.user_id;
  return new;
end; $$;

create trigger kyc_submissions_sync_after_insert
  after insert on public.kyc_submissions
  for each row execute function public.sync_profile_kyc_status();
create trigger kyc_submissions_sync_after_update
  after update of status on public.kyc_submissions
  for each row execute function public.sync_profile_kyc_status();

-- Storage bucket (private)
insert into storage.buckets (id, name, public) values ('kyc_documents','kyc_documents', false)
  on conflict (id) do nothing;

create policy "kyc upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc_documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "kyc read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc_documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(),'admin')));
create policy "kyc admin manage" on storage.objects
  for all to authenticated
  using (bucket_id = 'kyc_documents' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'kyc_documents' and public.has_role(auth.uid(),'admin'));

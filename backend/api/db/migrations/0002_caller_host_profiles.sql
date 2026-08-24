-- RNDM Phase 3 — Caller/Host profile foundation and legal acceptance records.
--
-- Builds on 0001_profiles_foundation.sql. The application `profiles` table is
-- NOT duplicated or replaced; role becomes nullable so that a freshly created
-- account has NO role until the user completes role selection during
-- onboarding (the role is then immutable — enforced server-side and by the
-- profiles_lock_role trigger below).
--
-- Scope: Phase 3 only. Calls, wallets, ledger, payments, reports and other
-- specification tables are intentionally NOT created here.

-- ---------------------------------------------------------------------------
-- profiles.role becomes nullable: no role until onboarding role selection.
-- ---------------------------------------------------------------------------
alter table public.profiles alter column role drop not null;
alter table public.profiles alter column role drop default;

-- Once a role is set it cannot change (role switching is not a product
-- capability). Server-side checks enforce this first; the trigger is the
-- database-level backstop. Admin workflows that must correct a role run with
-- the service role and can disable this trigger explicitly.
create or replace function public.profiles_lock_role()
returns trigger
language plpgsql
as $$
begin
  if old.role is not null and new.role is distinct from old.role then
    raise exception 'profiles.role is immutable once set';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
create trigger profiles_lock_role
  before update on public.profiles
  for each row
  execute function public.profiles_lock_role();

-- ---------------------------------------------------------------------------
-- caller_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.caller_profiles (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               uuid not null unique references public.profiles(id) on delete cascade,
  date_of_birth            date,
  gender                   text,
  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

drop trigger if exists caller_profiles_set_updated_at on public.caller_profiles;
create trigger caller_profiles_set_updated_at
  before update on public.caller_profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- host_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.host_profiles (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid not null unique references public.profiles(id) on delete cascade,
  bio                    text,
  languages              text[] not null default '{}',
  -- Host's own calling rate in coins per minute. Nullable until the Host sets
  -- it; platform min/max bounds are enforced server-side from configuration.
  rate_per_minute        integer check (rate_per_minute is null or rate_per_minute > 0),
  profile_completed_at   timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

drop trigger if exists host_profiles_set_updated_at on public.host_profiles;
create trigger host_profiles_set_updated_at
  before update on public.host_profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- legal_acceptances — durable record of Terms/Privacy/Community-Safety
-- acceptance during onboarding.
-- ---------------------------------------------------------------------------
create table if not exists public.legal_acceptances (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('terms', 'privacy', 'community_safety')),
  version       text not null,
  accepted_at   timestamptz not null default now(),
  unique (profile_id, document_type, version)
);

create index if not exists legal_acceptances_profile_idx
  on public.legal_acceptances(profile_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.caller_profiles enable row level security;
alter table public.host_profiles enable row level security;
alter table public.legal_acceptances enable row level security;

-- Users may read their own rows. Writes are performed by the trusted backend
-- (service role), which bypasses RLS. Host profiles are readable by anyone
-- authenticated so future discovery/matching surfaces can display them.
drop policy if exists "caller_profiles_select_own" on public.caller_profiles;
create policy "caller_profiles_select_own"
  on public.caller_profiles for select
  using (profile_id in (select id from public.profiles where supabase_user_id = auth.uid()));

drop policy if exists "host_profiles_select_authenticated" on public.host_profiles;
create policy "host_profiles_select_authenticated"
  on public.host_profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "legal_acceptances_select_own" on public.legal_acceptances;
create policy "legal_acceptances_select_own"
  on public.legal_acceptances for select
  using (profile_id in (select id from public.profiles where supabase_user_id = auth.uid()));

-- No public insert/update/delete policies on these tables: all writes go
-- through the trusted backend with the service role.

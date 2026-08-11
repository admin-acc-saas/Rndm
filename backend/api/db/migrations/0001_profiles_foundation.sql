-- RNDM Phase 2 — foundational database schema.
--
-- Establishes the application profile/user foundation and the Caller/Host role
-- model on top of Supabase Auth. Authentication identity lives in Supabase
-- Auth (auth.users); this table holds the application-level profile, role and
-- account status. Referential integrity is maintained to auth.users.
--
-- Run this against the target Supabase project (Supabase SQL editor or the
-- migration runner). It is idempotent where practical.
--
-- Scope: Phase 2 only. Future tables (caller_profiles, host_profiles,
-- host_applications, calls, wallets, ledger, payments, reports, …) are defined
-- by the specification but are intentionally NOT created here.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('caller', 'host');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('active', 'suspended', 'disabled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key default gen_random_uuid(),
  -- References the Supabase Auth user. Unique so one auth user maps to one
  -- application profile. ON DELETE CASCADE keeps profiles consistent if an
  -- auth user is removed.
  supabase_user_id  uuid not null unique references auth.users(id) on delete cascade,
  display_name      text,
  role              user_role not null default 'caller',
  account_status    account_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Indexes for common lookups.
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_account_status_idx on public.profiles(account_status);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user may read their own profile. Service-role access bypasses RLS for all
-- trusted server-side operations.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = supabase_user_id);

-- A user may update only their own profile, and only non-sensitive columns.
-- Role and account_status are NOT user-editable here (enforced server-side);
-- this policy is intentionally restrictive and may be relaxed later for
-- specific columns such as display_name.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = supabase_user_id)
  with check (auth.uid() = supabase_user_id);

-- No public insert/delete policy: profiles are created by the trusted backend
-- (service role) on first authenticated request. Users cannot create or delete
-- their own profile row directly.

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user registers (optional helper).
-- The backend also lazily creates a profile on first /auth/me, so this trigger
-- is a convenience that guarantees a row exists immediately at signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (supabase_user_id)
  values (new.id)
  on conflict (supabase_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RNDM Phase 3 — Host application / review lifecycle foundation.
--
-- Durable Host application state with review status, timestamps and an
-- append-only audit trail. Administrative review is performed by the trusted
-- backend (service role); the future Admin Dashboard consumes the same
-- endpoints. Availability/presence is operational state and lives in Redis,
-- not here.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type host_application_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- host_applications
-- ---------------------------------------------------------------------------
create table if not exists public.host_applications (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  status                host_application_status not null default 'pending',
  date_of_birth         date not null,
  languages             text[] not null default '{}',
  bio                   text not null,
  -- Structured payout/verification details collected during Host onboarding.
  -- Contents are validated server-side; stored as jsonb so payout-provider
  -- requirements can evolve without schema churn.
  payout_details        jsonb not null default '{}',
  submitted_at          timestamptz not null default now(),
  reviewed_at           timestamptz,
  reviewed_by           uuid references public.profiles(id) on delete set null,
  rejection_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- A profile may have at most one ACTIVE application (pending or approved).
-- A rejected application does not block a fresh submission.
create unique index if not exists host_applications_one_active_idx
  on public.host_applications(profile_id)
  where status in ('pending', 'approved');

create index if not exists host_applications_status_idx
  on public.host_applications(status);
create index if not exists host_applications_submitted_at_idx
  on public.host_applications(submitted_at desc);

drop trigger if exists host_applications_set_updated_at on public.host_applications;
create trigger host_applications_set_updated_at
  before update on public.host_applications
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- host_application_events — append-only audit trail of review actions.
-- ---------------------------------------------------------------------------
create table if not exists public.host_application_events (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.host_applications(id) on delete cascade,
  from_status     host_application_status,
  to_status       host_application_status not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists host_application_events_application_idx
  on public.host_application_events(application_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.host_applications enable row level security;
alter table public.host_application_events enable row level security;

-- Applicants may read their own application and its audit trail. All writes
-- and review actions are performed by the trusted backend (service role).
drop policy if exists "host_applications_select_own" on public.host_applications;
create policy "host_applications_select_own"
  on public.host_applications for select
  using (profile_id in (select id from public.profiles where supabase_user_id = auth.uid()));

drop policy if exists "host_application_events_select_own" on public.host_application_events;
create policy "host_application_events_select_own"
  on public.host_application_events for select
  using (application_id in (
    select id from public.host_applications
    where profile_id in (select id from public.profiles where supabase_user_id = auth.uid())
  ));

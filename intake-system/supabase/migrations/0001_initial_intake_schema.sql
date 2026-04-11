create extension if not exists pgcrypto;

create type intake_status as enum (
  'submitted',
  'in_progress',
  'completed',
  'declined',
  'cancelled'
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table intake_sessions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  flow_type text not null check (flow_type in ('appointment', 'dropoff', 'collection', 'enquiry')),
  status intake_status not null default 'submitted',
  version integer not null default 1,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  form_data jsonb not null,
  monday_item_id text,
  monday_sync_status text not null default 'pending'
    check (monday_sync_status in ('pending', 'synced', 'failed')),
  claimed_by text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table intake_checks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references intake_sessions(id) on delete cascade,
  check_type text not null check (
    check_type in (
      'passcode_verified',
      'parts_available',
      'turnaround_confirmed',
      'fields_complete'
    )
  ),
  passed boolean not null,
  operator_name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_sessions_status on intake_sessions(status);
create index idx_sessions_created on intake_sessions(created_at);
create index idx_sessions_email on intake_sessions(customer_email);
create index idx_checks_session on intake_checks(session_id);

create trigger trg_intake_sessions_updated_at
before update on intake_sessions
for each row
execute function set_updated_at();

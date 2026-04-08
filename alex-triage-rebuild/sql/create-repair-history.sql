create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.normalize_phone(input text)
returns text
language sql
immutable
as $$
  select case
    when input is null then null
    else regexp_replace(input, '[^0-9]', '', 'g')
  end;
$$;

create or replace function public.regex_similarity(a text, b text)
returns double precision
language sql
immutable
as $$
  select case
    when a is null or b is null then 0
    else similarity(public.normalize_phone(a), public.normalize_phone(b))
  end;
$$;

create table if not exists public.repair_history (
  id uuid primary key default gen_random_uuid(),
  monday_item_id bigint unique,
  customer_name text,
  customer_email text,
  customer_phone text,
  device_model text,
  device_type text,
  repair_type text,
  repair_category text,
  fault_tags text[],
  repair_status text,
  quote_amount numeric(10,2),
  payment_status text,
  was_warranty boolean default false,
  warranty_returns integer default 0,
  intake_date date,
  completion_date date,
  diagnostic_days integer,
  quote_silence_days integer,
  thread_summary text,
  resolution text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_rh_email on public.repair_history(customer_email) where customer_email is not null;
create index if not exists idx_rh_phone on public.repair_history(customer_phone) where customer_phone is not null;
create index if not exists idx_rh_monday_id on public.repair_history(monday_item_id);
create index if not exists idx_rh_device_type on public.repair_history(device_type);
create index if not exists idx_rh_name_search on public.repair_history using gin(to_tsvector('english', coalesce(customer_name, '')));
create index if not exists idx_rh_phone_norm on public.repair_history (public.normalize_phone(customer_phone)) where customer_phone is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_repair_history_updated_at on public.repair_history;
create trigger trg_repair_history_updated_at
before update on public.repair_history
for each row execute function public.set_updated_at();

create or replace function public.search_repair_history(
  p_email text default null,
  p_phone text default null,
  p_limit integer default 5
)
returns table (
  customer_name text,
  device_model text,
  repair_type text,
  quote_amount numeric,
  repair_status text,
  payment_status text,
  was_warranty boolean,
  warranty_returns integer,
  intake_date date,
  completion_date date,
  thread_summary text,
  resolution text
)
language plpgsql
as $$
begin
  return query
  select
    rh.customer_name,
    rh.device_model,
    rh.repair_type,
    rh.quote_amount,
    rh.repair_status,
    rh.payment_status,
    rh.was_warranty,
    rh.warranty_returns,
    rh.intake_date,
    rh.completion_date,
    rh.thread_summary,
    rh.resolution
  from public.repair_history rh
  where
    (p_email is not null and lower(rh.customer_email) = lower(p_email))
    or
    (
      p_phone is not null
      and rh.customer_phone is not null
      and public.regex_similarity(rh.customer_phone, p_phone) > 0.85
    )
  order by rh.completion_date desc nulls last, rh.updated_at desc
  limit greatest(coalesce(p_limit, 5), 1);
end;
$$;

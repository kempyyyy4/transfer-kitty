-- Fuzzy, accent-insensitive name search for the answer autocomplete.
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Records that a scheduled job ran for a UK date, so a second run on the same date is harmless.
create table public.job_runs (
  job_name text not null,
  uk_date date not null,
  ran_at timestamptz not null default now(),
  primary key (job_name, uk_date)
);

-- Server only: row-level security is on with no policies, and the browser roles get no grants.
alter table public.job_runs enable row level security;
revoke all on table public.job_runs from anon, authenticated;

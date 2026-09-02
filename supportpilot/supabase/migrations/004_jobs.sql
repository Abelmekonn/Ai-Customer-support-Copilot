-- Phase 0: background jobs + usage metering. Hosted AIaaS must not index inside the upload HTTP request.

alter type public.document_status add value if not exists 'queued';

create type public.job_status as enum ('pending', 'running', 'succeeded', 'failed');

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 8,
  error text,
  run_after timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_type_check check (type in ('index_document'))
);

create index jobs_pending_idx
  on public.jobs (run_after, created_at)
  where status = 'pending';

create index jobs_organization_id_idx on public.jobs (organization_id);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type text not null,
  quantity numeric not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint usage_events_type_check check (type in ('draft', 'embed_tokens', 'email_out', 'index_chunks'))
);

create index usage_events_organization_id_idx
  on public.usage_events (organization_id, created_at desc);

alter table public.jobs enable row level security;
alter table public.usage_events enable row level security;

create policy "org members can read jobs"
  on public.jobs
  for select
  using (organization_id = public.current_organization_id());

create policy "org members can insert jobs"
  on public.jobs
  for insert
  with check (organization_id = public.current_organization_id());

create policy "org members can read usage"
  on public.usage_events
  for select
  using (organization_id = public.current_organization_id());

create or replace function public.claim_pending_jobs(batch_size integer default 1)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select j.id
    from public.jobs j
    where j.status = 'pending'
      and j.run_after <= now()
    order by j.created_at
    for update skip locked
    limit greatest(batch_size, 1)
  )
  update public.jobs as job
  set
    status = 'running',
    attempts = job.attempts + 1,
    started_at = now(),
    error = null
  from picked
  where job.id = picked.id
  returning job.*;
end;
$$;

revoke all on function public.claim_pending_jobs(integer) from public;
grant execute on function public.claim_pending_jobs(integer) to service_role;

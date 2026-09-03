-- Org-scoped claim so a logged-in worker cannot drain another workspace.

create or replace function public.claim_pending_jobs_for_org(
  target_organization_id uuid,
  batch_size integer default 1
)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_organization_id is null then
    raise exception 'organization required';
  end if;

  return query
  with picked as (
    select j.id
    from public.jobs j
    where j.status = 'pending'
      and j.organization_id = target_organization_id
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

revoke all on function public.claim_pending_jobs_for_org(uuid, integer) from public;
grant execute on function public.claim_pending_jobs_for_org(uuid, integer) to service_role;

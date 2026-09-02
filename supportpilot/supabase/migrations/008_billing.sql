-- Phase 5: billing. Plans and Stripe IDs live on the organization so caps stay tenant-scoped.

alter table public.organizations
  add column if not exists plan_id text not null default 'starter',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text not null default 'active';

alter table public.organizations drop constraint if exists organizations_subscription_status_check;
alter table public.organizations
  add constraint organizations_subscription_status_check
  check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid'));

create unique index if not exists organizations_stripe_customer_id_idx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists usage_events_org_type_created_idx
  on public.usage_events (organization_id, type, created_at desc);

-- Workspace members can update name/tone, not plan or Stripe IDs.
create or replace function public.protect_organization_billing()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;
  NEW.plan_id := OLD.plan_id;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.stripe_price_id := OLD.stripe_price_id;
  NEW.subscription_status := OLD.subscription_status;
  return NEW;
end;
$$;

drop trigger if exists organizations_protect_billing on public.organizations;
create trigger organizations_protect_billing
  before update on public.organizations
  for each row execute function public.protect_organization_billing();

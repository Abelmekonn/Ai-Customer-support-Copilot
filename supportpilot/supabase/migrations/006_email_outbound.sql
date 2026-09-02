-- Phase 3: outbound email + send audit. Agent Send leaves via the provider; internal notes stay local.

alter table public.jobs drop constraint if exists jobs_type_check;
alter table public.jobs
  add constraint jobs_type_check check (type in ('index_document', 'ingest_email', 'send_email'));

alter table public.messages
  add column if not exists is_internal boolean not null default false,
  add column if not exists send_status text,
  add column if not exists send_error text,
  add column if not exists email_provider_id text,
  add column if not exists generation_id uuid references public.ai_generations (id) on delete set null;

alter table public.messages drop constraint if exists messages_send_status_check;
alter table public.messages
  add constraint messages_send_status_check
  check (send_status is null or send_status in ('queued', 'sent', 'failed'));

create unique index if not exists messages_org_email_provider_id_idx
  on public.messages (organization_id, email_provider_id)
  where email_provider_id is not null;

create table public.send_audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  generation_id uuid references public.ai_generations (id) on delete set null,
  sent_by uuid not null references public.users (id) on delete restrict,
  chunk_ids uuid[] not null default '{}'::uuid[],
  provider_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index send_audits_ticket_id_idx on public.send_audits (ticket_id, sent_at desc);
create unique index if not exists send_audits_message_id_idx on public.send_audits (message_id);

alter table public.send_audits enable row level security;

create policy "org members can read send audits"
  on public.send_audits
  for select
  using (organization_id = public.current_organization_id());

create or replace function public.sync_ticket_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.is_internal, false) then
    return new;
  end if;

  update public.tickets
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.content, 140),
    updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$;

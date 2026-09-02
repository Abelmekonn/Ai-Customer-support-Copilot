-- Phase 2: inbound email → tickets. Demo seed is an org flag, not the product intake.

alter table public.organizations
  add column if not exists is_demo boolean not null default true;

alter table public.jobs drop constraint if exists jobs_type_check;
alter table public.jobs
  add constraint jobs_type_check check (type in ('index_document', 'ingest_email'));

create table public.channel_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  provider text not null default 'inbound_webhook',
  inbound_address text not null unique,
  webhook_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger channel_accounts_set_updated_at
  before update on public.channel_accounts
  for each row execute function public.set_updated_at();

alter table public.messages
  add column if not exists email_message_id text,
  add column if not exists email_in_reply_to text;

create unique index if not exists messages_org_email_message_id_idx
  on public.messages (organization_id, email_message_id)
  where email_message_id is not null;

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  content_type text not null default 'application/octet-stream',
  created_at timestamptz not null default now()
);

create index message_attachments_ticket_id_idx on public.message_attachments (ticket_id);

alter table public.channel_accounts enable row level security;
alter table public.message_attachments enable row level security;

create policy "org members can read channel"
  on public.channel_accounts
  for select
  using (organization_id = public.current_organization_id());

create policy "admins can insert channel"
  on public.channel_accounts
  for insert
  with check (
    organization_id = public.current_organization_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "admins can update channel"
  on public.channel_accounts
  for update
  using (
    organization_id = public.current_organization_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "org members can read attachments"
  on public.message_attachments
  for select
  using (organization_id = public.current_organization_id());

insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false)
on conflict (id) do nothing;

create policy "org members can read ticket attachments"
  on storage.objects
  for select
  using (
    bucket_id = 'ticket-attachments'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

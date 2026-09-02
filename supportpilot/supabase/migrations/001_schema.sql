create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type public.user_role as enum ('admin', 'manager', 'agent');
create type public.ticket_status as enum ('open', 'pending', 'resolved');
create type public.ticket_priority as enum ('low', 'medium', 'high');
create type public.sender_type as enum ('customer', 'agent', 'ai');
create type public.document_status as enum (
  'uploading',
  'extracting',
  'chunking',
  'embedding',
  'indexed',
  'failed'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'agent',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_organization_id_idx on public.users (organization_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_organization_id_idx on public.customers (organization_id);
create unique index customers_org_email_idx on public.customers (organization_id, email);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  ticket_number integer not null generated always as identity (start with 1001),
  subject text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  category text,
  assigned_to uuid references public.users (id) on delete set null,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tickets_ticket_number_idx on public.tickets (ticket_number);
create index tickets_organization_id_idx on public.tickets (organization_id);
create index tickets_status_idx on public.tickets (organization_id, status);
create index tickets_customer_id_idx on public.tickets (customer_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sender_type public.sender_type not null,
  sender_user_id uuid references public.users (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_ticket_id_idx on public.messages (ticket_id, created_at);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  file_path text,
  file_type text not null,
  status public.document_status not null default 'uploading',
  error_message text,
  uploaded_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_documents_organization_id_idx
  on public.knowledge_documents (organization_id);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content text not null,
  embedding vector(1536),
  page_number integer,
  chunk_index integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index knowledge_chunks_document_id_idx on public.knowledge_chunks (document_id);
create index knowledge_chunks_organization_id_idx on public.knowledge_chunks (organization_id);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  intent text,
  category text,
  urgency public.ticket_priority,
  confidence numeric(5, 4),
  retrieval_quality numeric(5, 4),
  source_coverage numeric(5, 4),
  intent_confidence numeric(5, 4),
  rewritten_query text,
  response text not null,
  edited_response text,
  needs_human_review boolean not null default true,
  model text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.users (id) on delete set null
);

create index ai_generations_ticket_id_idx on public.ai_generations (ticket_id, created_at desc);

create table public.citations (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.ai_generations (id) on delete cascade,
  chunk_id uuid not null references public.knowledge_chunks (id) on delete cascade,
  similarity numeric(6, 5) not null,
  created_at timestamptz not null default now()
);

create index citations_generation_id_idx on public.citations (generation_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create trigger knowledge_documents_set_updated_at
  before update on public.knowledge_documents
  for each row execute function public.set_updated_at();

create or replace function public.sync_ticket_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tickets
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.content, 140),
    updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$;

create trigger messages_sync_ticket
  after insert on public.messages
  for each row execute function public.sync_ticket_last_message();

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from lower(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', '-', 'g')));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  org_name text;
  org_slug text;
  base_slug text;
begin
  org_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'My workspace');
  base_slug := public.slugify(org_name);
  if base_slug = '' then
    base_slug := 'workspace';
  end if;
  org_slug := base_slug;

  if exists (select 1 from public.organizations where slug = org_slug) then
    org_slug := base_slug || '-' || substr(new.id::text, 1, 8);
  end if;

  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into org_id;

  insert into public.users (id, organization_id, email, full_name, role)
  values (
    new.id,
    org_id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'agent'), '@', 1)),
    'admin'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('knowledge', 'knowledge', false)
on conflict (id) do nothing;

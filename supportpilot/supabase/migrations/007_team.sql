-- Phase 4: team invites, role-gated knowledge, workspace from-name / reply-to / tone.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
$$;

alter table public.organizations
  add column if not exists from_name text,
  add column if not exists reply_to text,
  add column if not exists brand_tone text;

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'agent',
  token text not null unique,
  invited_by uuid not null references public.users (id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index invites_organization_id_idx on public.invites (organization_id, created_at desc);
create unique index invites_org_email_pending_idx
  on public.invites (organization_id, email)
  where accepted_at is null;

alter table public.invites enable row level security;

create policy "org members can read invites"
  on public.invites
  for select
  using (organization_id = public.current_organization_id());

create policy "admins can insert invites"
  on public.invites
  for insert
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

create policy "admins can update invites"
  on public.invites
  for update
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

create policy "admins can delete invites"
  on public.invites
  for delete
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "org members can insert documents" on public.knowledge_documents;
create policy "admins can insert documents"
  on public.knowledge_documents
  for insert
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "org members can update documents" on public.knowledge_documents;
create policy "admins can update documents"
  on public.knowledge_documents
  for update
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "org members can delete documents" on public.knowledge_documents;
create policy "admins can delete documents"
  on public.knowledge_documents
  for delete
  using (
    organization_id = public.current_organization_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "org members can delete knowledge files" on storage.objects;
create policy "admins can delete knowledge files"
  on storage.objects
  for delete
  using (
    bucket_id = 'knowledge'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
    and public.current_user_role() = 'admin'
  );

drop policy if exists "org members can upload knowledge files" on storage.objects;
create policy "admins can upload knowledge files"
  on storage.objects
  for insert
  with check (
    bucket_id = 'knowledge'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
    and public.current_user_role() = 'admin'
  );

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
  invite_token text;
  invite_row public.invites%rowtype;
begin
  invite_token := nullif(trim(new.raw_user_meta_data ->> 'invite_token'), '');

  if invite_token is not null then
    select * into invite_row
    from public.invites
    where token = invite_token
      and accepted_at is null
      and expires_at > now()
    for update;

    if not found then
      raise exception 'This invite is invalid or has expired.';
    end if;

    if lower(invite_row.email) <> lower(coalesce(new.email, '')) then
      raise exception 'This invite was sent to a different email.';
    end if;

    insert into public.users (id, organization_id, email, full_name, role)
    values (
      new.id,
      invite_row.organization_id,
      coalesce(new.email, invite_row.email),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'agent'), '@', 1)),
      invite_row.role
    );

    update public.invites
    set accepted_at = now()
    where id = invite_row.id;

    return new;
  end if;

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

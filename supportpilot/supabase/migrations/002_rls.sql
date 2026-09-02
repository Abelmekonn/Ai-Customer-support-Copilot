alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.messages enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.ai_generations enable row level security;
alter table public.citations enable row level security;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where id = auth.uid()
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and organization_id = org_id
  )
$$;

create policy "users can read their organization"
  on public.organizations
  for select
  using (id = public.current_organization_id());

create policy "admins can update their organization"
  on public.organizations
  for update
  using (
    id = public.current_organization_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "users can read teammates"
  on public.users
  for select
  using (organization_id = public.current_organization_id());

create policy "users can update themselves"
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "org members can read customers"
  on public.customers
  for select
  using (organization_id = public.current_organization_id());

create policy "org members can insert customers"
  on public.customers
  for insert
  with check (organization_id = public.current_organization_id());

create policy "org members can update customers"
  on public.customers
  for update
  using (organization_id = public.current_organization_id());

create policy "org members can read tickets"
  on public.tickets
  for select
  using (organization_id = public.current_organization_id());

create policy "org members can insert tickets"
  on public.tickets
  for insert
  with check (organization_id = public.current_organization_id());

create policy "org members can update tickets"
  on public.tickets
  for update
  using (organization_id = public.current_organization_id());

create policy "org members can read messages"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.organization_id = public.current_organization_id()
    )
  );

create policy "org members can insert messages"
  on public.messages
  for insert
  with check (
    organization_id = public.current_organization_id()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.organization_id = public.current_organization_id()
    )
  );

create policy "org members can read documents"
  on public.knowledge_documents
  for select
  using (organization_id = public.current_organization_id());

create policy "org members can insert documents"
  on public.knowledge_documents
  for insert
  with check (organization_id = public.current_organization_id());

create policy "org members can update documents"
  on public.knowledge_documents
  for update
  using (organization_id = public.current_organization_id());

create policy "org members can delete documents"
  on public.knowledge_documents
  for delete
  using (organization_id = public.current_organization_id());

create policy "org members can read chunks"
  on public.knowledge_chunks
  for select
  using (organization_id = public.current_organization_id());

create policy "org members can insert chunks"
  on public.knowledge_chunks
  for insert
  with check (organization_id = public.current_organization_id());

create policy "org members can read generations"
  on public.ai_generations
  for select
  using (organization_id = public.current_organization_id());

create policy "org members can insert generations"
  on public.ai_generations
  for insert
  with check (organization_id = public.current_organization_id());

create policy "org members can update generations"
  on public.ai_generations
  for update
  using (organization_id = public.current_organization_id());

create policy "org members can read citations"
  on public.citations
  for select
  using (
    exists (
      select 1 from public.ai_generations g
      where g.id = generation_id
        and g.organization_id = public.current_organization_id()
    )
  );

create policy "org members can insert citations"
  on public.citations
  for insert
  with check (
    exists (
      select 1 from public.ai_generations g
      where g.id = generation_id
        and g.organization_id = public.current_organization_id()
    )
  );

create policy "org members can read knowledge files"
  on storage.objects
  for select
  using (
    bucket_id = 'knowledge'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "org members can upload knowledge files"
  on storage.objects
  for insert
  with check (
    bucket_id = 'knowledge'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "org members can update knowledge files"
  on storage.objects
  for update
  using (
    bucket_id = 'knowledge'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "org members can delete knowledge files"
  on storage.objects
  for delete
  using (
    bucket_id = 'knowledge'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

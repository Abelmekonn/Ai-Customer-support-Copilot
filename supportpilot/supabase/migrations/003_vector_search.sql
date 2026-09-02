create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_organization_id uuid,
  match_count integer default 10,
  match_threshold double precision default 0.5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page_number integer,
  chunk_index integer,
  metadata jsonb,
  similarity double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if match_organization_id is distinct from public.current_organization_id() then
    raise exception 'organization mismatch';
  end if;

  return query
  select
    kc.id,
    kc.document_id,
    kc.content,
    kc.page_number,
    kc.chunk_index,
    kc.metadata,
    (1 - (kc.embedding <=> query_embedding))::double precision as similarity
  from public.knowledge_chunks kc
  where kc.organization_id = match_organization_id
    and kc.embedding is not null
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

grant execute on function public.match_knowledge_chunks(vector, uuid, integer, double precision)
  to authenticated;

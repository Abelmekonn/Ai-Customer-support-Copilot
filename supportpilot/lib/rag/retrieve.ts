import type { SupabaseClient } from "@supabase/supabase-js";
import type { CopilotSource } from "@/lib/ai/types";
import { embedQuery } from "@/lib/knowledge/embed";

export const MATCH_COUNT = 8;
export const MATCH_THRESHOLD = 0.42;

export type RetrievedChunk = CopilotSource & {
  content: string;
};

type MatchRow = {
  id: string;
  document_id: string;
  content: string;
  page_number: number | null;
  similarity: number;
};

export async function retrievePolicyChunks(
  supabase: SupabaseClient,
  organizationId: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const embedding = await embedQuery(query);
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_organization_id: organizationId,
    match_count: MATCH_COUNT,
    match_threshold: MATCH_THRESHOLD,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as MatchRow[];
  if (rows.length === 0) return [];

  const documentIds = [...new Set(rows.map((row) => row.document_id))];
  const { data: documents, error: documentsError } = await supabase
    .from("knowledge_documents")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("id", documentIds);

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  const names = new Map((documents ?? []).map((document) => [document.id, document.name]));

  return rows.map((row) => ({
    chunkId: row.id,
    documentId: row.document_id,
    documentName: names.get(row.document_id) ?? "Knowledge document",
    pageNumber: row.page_number ?? undefined,
    similarity: Number(row.similarity),
    content: row.content,
  }));
}

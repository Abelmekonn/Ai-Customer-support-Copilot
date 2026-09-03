import { createAdminClient } from "@/lib/supabase/admin";
import { chunkPages } from "@/lib/knowledge/chunk";
import { embedDocuments, EmbeddingError, friendlyEmbeddingError, isRateLimitError } from "@/lib/knowledge/embed";
import { TERMINAL_RATE_LIMIT_HINT } from "@/lib/knowledge/pipeline";
import { extractDocumentPages } from "@/lib/knowledge/extract";
import { recordUsage } from "@/lib/usage/record";
import type { DocumentStatus } from "@/lib/types";

export type ProcessResult =
  | { ok: true }
  | { ok: false; error: string; retryable?: boolean };

export async function processKnowledgeDocument(documentId: string): Promise<ProcessResult> {
  const admin = createAdminClient();
  const { data: document, error } = await admin
    .from("knowledge_documents")
    .select("id, organization_id, file_path, file_type")
    .eq("id", documentId)
    .single();

  if (error || !document) {
    return { ok: false, error: "Document not found." };
  }
  if (!document.file_path) {
    return failDocument(admin, documentId, "The file never reached storage. Upload it again.");
  }

  try {
    await setStatus(admin, documentId, "extracting");
    const downloaded = await admin.storage.from("knowledge").download(document.file_path);
    if (downloaded.error || !downloaded.data) {
      throw new Error(downloaded.error?.message ?? "Could not download the uploaded file.");
    }

    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    const pages = await extractDocumentPages(bytes, document.file_type);
    const hasText = pages.some((page) => page.text.trim());
    if (!hasText) {
      throw new Error("No text could be read from this file. Try a text-based PDF, Markdown, or TXT.");
    }

    await setStatus(admin, documentId, "chunking");
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
      throw new Error("The file had no usable text to index.");
    }

    await setStatus(admin, documentId, "embedding");
    const embeddings = await embedDocuments(chunks.map((chunk) => chunk.content));
    if (embeddings.length !== chunks.length) {
      throw new EmbeddingError("Embedding count did not match the number of chunks.");
    }

    await admin.from("knowledge_chunks").delete().eq("document_id", documentId);
    const { error: insertError } = await admin.from("knowledge_chunks").insert(
      chunks.map((chunk, index) => ({
        document_id: document.id,
        organization_id: document.organization_id,
        content: chunk.content,
        embedding: embeddings[index],
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
      })),
    );
    if (insertError) throw new Error(insertError.message);

    await recordUsage({
      organizationId: document.organization_id,
      type: "index_chunks",
      quantity: chunks.length,
      metadata: { documentId },
    });

    await admin
      .from("knowledge_documents")
      .update({ status: "indexed", error_message: null })
      .eq("id", documentId);

    return { ok: true };
  } catch (cause) {
    const message = friendlyEmbeddingError(
      cause instanceof EmbeddingError || cause instanceof Error ? cause.message : "Indexing failed.",
    );
    if (isRateLimitError(message)) {
      await admin
        .from("knowledge_documents")
        .update({ error_message: message })
        .eq("id", documentId);
      return { ok: false, error: message, retryable: true };
    }
    return failDocument(admin, documentId, message);
  }
}

export async function markDocumentFailed(documentId: string, message: string) {
  const admin = createAdminClient();
  return failDocument(admin, documentId, message);
}

async function setStatus(
  admin: ReturnType<typeof createAdminClient>,
  documentId: string,
  status: DocumentStatus,
) {
  const { error } = await admin
    .from("knowledge_documents")
    .update({ status, error_message: null })
    .eq("id", documentId);
  if (error) throw new Error(error.message);
}

async function failDocument(
  admin: ReturnType<typeof createAdminClient>,
  documentId: string,
  message: string,
) {
  const stored = isRateLimitError(message) ? TERMINAL_RATE_LIMIT_HINT : message;
  await admin
    .from("knowledge_documents")
    .update({ status: "failed", error_message: stored })
    .eq("id", documentId);
  return { ok: false as const, error: stored };
}

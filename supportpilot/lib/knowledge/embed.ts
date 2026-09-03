import { isRateLimitError } from "@/lib/knowledge/errors";

export class EmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingError";
  }
}

export { isRateLimitError };

export function friendlyEmbeddingError(message: string) {
  if (isRateLimitError(message)) {
    return "Indexing hit a per-minute embedding limit. The file is saved. We will retry automatically in about a minute.";
  }
  return message;
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return embedWithOpenAI(texts, openaiKey);
  }

  const minimaxKey = process.env.MINIMAX_API_KEY?.trim();
  if (minimaxKey) {
    return embedWithMiniMax(texts, minimaxKey, "db");
  }

  throw new EmbeddingError(
    "This file uploaded, but indexing needs embeddings. Add OPENAI_API_KEY to .env.local, restart the app, then retry.",
  );
}

async function embedWithOpenAI(texts: string[], apiKey: string) {
  const vectors: number[][] = [];
  for (const batch of batches(texts, 64)) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: batch,
        dimensions: 1536,
      }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
      data?: Array<{ embedding: number[]; index: number }>;
    };
    if (!response.ok || !payload.data) {
      throw new EmbeddingError(
        friendlyEmbeddingError(payload.error?.message ?? "OpenAI embeddings failed."),
      );
    }
    const ordered = [...payload.data].sort((a, b) => a.index - b.index);
    vectors.push(...ordered.map((item) => item.embedding));
  }
  return vectors;
}

export async function embedQuery(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new EmbeddingError("Search query is empty.");
  }
  const [vector] = await embedDocumentsForQuery([trimmed]);
  if (!vector) throw new EmbeddingError("Embedding returned no vector.");
  return vector;
}

async function embedDocumentsForQuery(texts: string[]) {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return embedWithOpenAI(texts, openaiKey);
  }
  const minimaxKey = process.env.MINIMAX_API_KEY?.trim();
  if (minimaxKey) {
    return embedWithMiniMax(texts, minimaxKey, "query");
  }
  throw new EmbeddingError(
    "Drafts need embeddings. Add OPENAI_API_KEY to .env.local, then restart the app.",
  );
}

async function embedWithMiniMax(texts: string[], apiKey: string, type: "db" | "query") {
  const baseUrl = (process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/v1").replace(
    /\/$/,
    "",
  );
  const vectors: number[][] = [];

  for (const batch of batches(texts, 32)) {
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_EMBEDDING_MODEL?.trim() || "embo-01",
        texts: batch,
        type,
      }),
    });
    const payload = (await response.json()) as {
      vectors?: number[][];
      data?: Array<{ embedding?: number[] }>;
      error?: { message?: string };
      base_resp?: { status_code?: number; status_msg?: string };
    };

    const batchVectors =
      payload.vectors ??
      payload.data?.map((item) => item.embedding).filter((item): item is number[] => Array.isArray(item));

    if (!response.ok || payload.base_resp?.status_code || !batchVectors?.length) {
      const raw =
        payload.error?.message ??
        payload.base_resp?.status_msg ??
        "MiniMax embeddings failed. Add OPENAI_API_KEY for text-embedding-3-small, then retry.";
      throw new EmbeddingError(friendlyEmbeddingError(raw));
    }

    if (batchVectors.some((vector) => vector.length !== 1536)) {
      throw new EmbeddingError(
        "Embedding vectors were not 1536 dimensions. Use OpenAI text-embedding-3-small or MiniMax embo-01.",
      );
    }

    vectors.push(...batchVectors);
  }

  return vectors;
}

function batches<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

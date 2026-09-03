import type { DocumentStatus } from "@/lib/types";
import { isRateLimitError } from "@/lib/knowledge/errors";

export const INDEX_STEPS = [
  { id: "queued", label: "Queued", hint: "Waiting for the indexer" },
  { id: "extracting", label: "Extracting", hint: "Reading text from the file" },
  { id: "chunking", label: "Chunking", hint: "Splitting into passages" },
  { id: "embedding", label: "Embedding", hint: "Creating search vectors" },
  { id: "indexed", label: "Indexed", hint: "Ready to cite in drafts" },
] as const;

export type IndexStepId = (typeof INDEX_STEPS)[number]["id"];

export const TERMINAL_RATE_LIMIT_HINT =
  "Embedding stopped after the per-minute limit. The file is saved. Retry indexing to continue.";

const IN_FLIGHT: DocumentStatus[] = [
  "queued",
  "uploading",
  "extracting",
  "chunking",
  "embedding",
];

export function isIndexing(status: DocumentStatus) {
  return IN_FLIGHT.includes(status);
}

export function isWaitingForRetry(status: DocumentStatus, error?: string | null) {
  return isIndexing(status) && isRateLimitError(error ?? "");
}

export function normalizeIndexStatus(status: DocumentStatus): IndexStepId | "failed" {
  if (status === "uploading") return "queued";
  if (status === "failed") return "failed";
  return status;
}

export function indexStepIndex(status: DocumentStatus) {
  const normalized = normalizeIndexStatus(status);
  if (normalized === "failed") return -1;
  return INDEX_STEPS.findIndex((step) => step.id === normalized);
}

export function inferFailedStepIndex(error?: string | null) {
  const text = (error ?? "").toLowerCase();
  if (/download|storage|extract|no text|could not be read/.test(text)) return 1;
  if (/chunk|usable text/.test(text)) return 2;
  return 3;
}

export function displayStepIndex(status: DocumentStatus, error?: string | null) {
  if (status === "failed") return inferFailedStepIndex(error);
  return Math.max(0, indexStepIndex(status));
}

export function indexingProgress(status: DocumentStatus, error?: string | null) {
  if (status === "failed") {
    return inferFailedStepIndex(error) / (INDEX_STEPS.length - 1);
  }
  const index = indexStepIndex(status);
  if (index < 0) return 0;
  return index / (INDEX_STEPS.length - 1);
}

export function indexingHint(status: DocumentStatus, fileName?: string, error?: string | null) {
  if (isWaitingForRetry(status, error)) {
    return error?.trim() || "Embedding is waiting on the per-minute limit. The file is saved.";
  }
  if (status === "failed") {
    if (isRateLimitError(error ?? "")) return TERMINAL_RATE_LIMIT_HINT;
    return error?.trim() || "Indexing stopped. Retry after you fix the file, or upload a text-based PDF, Markdown, or TXT.";
  }
  const index = indexStepIndex(status);
  const step = INDEX_STEPS[index] ?? INDEX_STEPS[0];
  const target = fileName ? ` ${fileName}` : " this file";
  if (step.id === "indexed") return `${fileName ?? "This file"} is ready to cite.`;
  return `${step.hint} for${target}.`;
}

export function indexingTitle(status: DocumentStatus, error?: string | null) {
  if (isWaitingForRetry(status, error)) return "Waiting to retry · Embedding";
  if (status === "failed") {
    const step = INDEX_STEPS[inferFailedStepIndex(error)];
    return `Stopped at ${step?.label ?? "Embedding"}`;
  }
  if (isIndexing(status)) {
    const step = INDEX_STEPS[indexStepIndex(status)];
    return `Indexing · ${step?.label ?? "Queued"}`;
  }
  return "Indexed";
}

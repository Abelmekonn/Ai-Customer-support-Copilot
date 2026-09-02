export const RATE_LIMIT_DELAY_MS = 60_000;

export type IndexProcessResult =
  | { ok: true }
  | { ok: false; error: string; retryable?: boolean };

export type JobAction =
  | { type: "fail-job"; error: string }
  | { type: "complete" }
  | { type: "reschedule"; error: string; delayMs: number }
  | { type: "fail-document"; error: string };

export function resolveIndexJobAction(input: {
  documentId: string;
  attempts: number;
  maxAttempts: number;
  result: IndexProcessResult;
}): JobAction {
  if (!input.documentId) {
    return { type: "fail-job", error: "index_document missing documentId." };
  }

  if (input.result.ok) {
    return { type: "complete" };
  }

  if (input.result.retryable && input.attempts < input.maxAttempts) {
    return { type: "reschedule", error: input.result.error, delayMs: RATE_LIMIT_DELAY_MS };
  }

  return { type: "fail-document", error: input.result.error };
}

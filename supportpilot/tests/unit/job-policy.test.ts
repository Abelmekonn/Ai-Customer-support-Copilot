import { describe, expect, it } from "vitest";
import { RATE_LIMIT_DELAY_MS, resolveIndexJobAction } from "@/lib/jobs/policy";

describe("resolveIndexJobAction", () => {
  it("completes when indexing succeeds", () => {
    expect(
      resolveIndexJobAction({
        documentId: "doc-1",
        attempts: 1,
        maxAttempts: 8,
        result: { ok: true },
      }),
    ).toEqual({ type: "complete" });
  });

  it("reschedules retryable rate limits before max attempts", () => {
    expect(
      resolveIndexJobAction({
        documentId: "doc-1",
        attempts: 2,
        maxAttempts: 8,
        result: { ok: false, error: "RPM", retryable: true },
      }),
    ).toEqual({
      type: "reschedule",
      error: "RPM",
      delayMs: RATE_LIMIT_DELAY_MS,
    });
  });

  it("fails the document when retries are exhausted", () => {
    expect(
      resolveIndexJobAction({
        documentId: "doc-1",
        attempts: 8,
        maxAttempts: 8,
        result: { ok: false, error: "RPM", retryable: true },
      }),
    ).toEqual({ type: "fail-document", error: "RPM" });
  });

  it("fails the document on a non-retryable error", () => {
    expect(
      resolveIndexJobAction({
        documentId: "doc-1",
        attempts: 1,
        maxAttempts: 8,
        result: { ok: false, error: "No text could be read from this file." },
      }),
    ).toEqual({ type: "fail-document", error: "No text could be read from this file." });
  });
});

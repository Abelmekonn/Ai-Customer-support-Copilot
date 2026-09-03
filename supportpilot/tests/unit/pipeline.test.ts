import { describe, expect, it } from "vitest";
import {
  INDEX_STEPS,
  TERMINAL_RATE_LIMIT_HINT,
  displayStepIndex,
  indexStepIndex,
  indexingHint,
  indexingProgress,
  indexingTitle,
  inferFailedStepIndex,
  isIndexing,
  isWaitingForRetry,
  normalizeIndexStatus,
} from "@/lib/knowledge/pipeline";

describe("normalizeIndexStatus", () => {
  it("maps uploading onto the queued step", () => {
    expect(normalizeIndexStatus("uploading")).toBe("queued");
    expect(normalizeIndexStatus("failed")).toBe("failed");
    expect(normalizeIndexStatus("embedding")).toBe("embedding");
  });
});

describe("indexStepIndex", () => {
  it("walks the pipeline in order", () => {
    expect(indexStepIndex("queued")).toBe(0);
    expect(indexStepIndex("extracting")).toBe(1);
    expect(indexStepIndex("chunking")).toBe(2);
    expect(indexStepIndex("embedding")).toBe(3);
    expect(indexStepIndex("indexed")).toBe(4);
    expect(indexStepIndex("failed")).toBe(-1);
  });
});

describe("indexingProgress", () => {
  it("fills the bar by step, not by a fake percent", () => {
    expect(indexingProgress("queued")).toBe(0);
    expect(indexingProgress("embedding")).toBe(0.75);
    expect(indexingProgress("indexed")).toBe(1);
    expect(indexingProgress("failed")).toBe(0.75);
    expect(indexingProgress("failed", "No text could be read from this file.")).toBe(0.25);
  });
});

describe("indexingHint", () => {
  it("names the current step and the file", () => {
    expect(indexingHint("embedding", "policy.pdf")).toMatch(/policy\.pdf/);
    expect(indexingHint("embedding", "policy.pdf")).toMatch(/search vectors/i);
    expect(isIndexing("embedding")).toBe(true);
    expect(isIndexing("indexed")).toBe(false);
    expect(INDEX_STEPS).toHaveLength(5);
  });

  it("keeps a rate-limit wait on Embedding instead of calling it a failure", () => {
    const wait =
      "Indexing hit a per-minute embedding limit. The file is saved. We will retry automatically in about a minute.";
    expect(isWaitingForRetry("embedding", wait)).toBe(true);
    expect(isWaitingForRetry("failed", wait)).toBe(false);
    expect(indexingTitle("embedding", wait)).toBe("Waiting to retry · Embedding");
    expect(indexingHint("embedding", "Abel_Mekonen.pdf", wait)).toMatch(/retry automatically/i);
    expect(displayStepIndex("embedding", wait)).toBe(3);
  });

  it("marks the failed step and does not promise another automatic retry", () => {
    const wait =
      "Indexing hit a per-minute embedding limit. The file is saved. We will retry automatically in about a minute.";
    expect(inferFailedStepIndex(wait)).toBe(3);
    expect(indexingTitle("failed", wait)).toBe("Stopped at Embedding");
    expect(indexingHint("failed", "Abel_Mekonen.pdf", wait)).toBe(TERMINAL_RATE_LIMIT_HINT);
    expect(indexingHint("failed", "file.pdf", wait)).not.toMatch(/automatically/);
    expect(inferFailedStepIndex("No text could be read from this file.")).toBe(1);
    expect(indexingTitle("failed", "The file had no usable text to index.")).toBe("Stopped at Chunking");
  });
});

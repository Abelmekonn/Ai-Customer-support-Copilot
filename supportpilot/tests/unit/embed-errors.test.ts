import { describe, expect, it } from "vitest";
import { friendlyEmbeddingError, isRateLimitError } from "@/lib/knowledge/embed";

describe("embedding errors", () => {
  it("detects MiniMax RPM messages", () => {
    expect(isRateLimitError("rate limit exceeded(RPM)")).toBe(true);
  });

  it("rewrites RPM into an automatic retry message", () => {
    expect(friendlyEmbeddingError("rate limit exceeded(RPM)")).toMatch(/retry automatically/i);
  });
});

import { describe, expect, it } from "vitest";
import { calculateConfidence } from "@/lib/copilot/confidence";

describe("calculateConfidence", () => {
  it("weights retrieval more heavily than intent", () => {
    const result = calculateConfidence({
      retrievalQuality: 0.91,
      sourceCoverage: 0.95,
      intentConfidence: 0.94,
    });

    expect(result.overall).toBe(0.9295);
    expect(result.retrievalQuality).toBe(0.91);
  });

  it("clamps out-of-range inputs", () => {
    const result = calculateConfidence({
      retrievalQuality: 1.4,
      sourceCoverage: -0.2,
      intentConfidence: 0.5,
    });

    expect(result.retrievalQuality).toBe(1);
    expect(result.sourceCoverage).toBe(0);
    expect(result.overall).toBe(0.575);
  });
});

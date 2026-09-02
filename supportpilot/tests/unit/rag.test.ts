import { describe, expect, it } from "vitest";
import { rewriteSearchQuery } from "@/lib/rag/rewrite";
import { NO_POLICY_RESPONSE, scoresFromRetrieval } from "@/lib/rag/scores";

describe("rewriteSearchQuery", () => {
  it("uses the subject and latest customer message, not the full agent thread", () => {
    const query = rewriteSearchQuery({
      subject: "Refund for order 1842",
      category: "billing",
      messages: [
        { sender_type: "agent", content: "Thanks, looking into this." },
        { sender_type: "customer", content: "I was charged twice last week." },
      ],
    });
    expect(query).toContain("Refund for order 1842");
    expect(query).toContain("charged twice");
    expect(query).not.toContain("looking into this");
  });
});

describe("scoresFromRetrieval", () => {
  it("is zero when nothing matched", () => {
    expect(scoresFromRetrieval([])).toEqual({ retrievalQuality: 0, sourceCoverage: 0 });
  });

  it("averages similarity and scales coverage by hit count", () => {
    const scores = scoresFromRetrieval([0.8, 0.6]);
    expect(scores.retrievalQuality).toBe(0.7);
    expect(scores.sourceCoverage).toBe(0.5);
  });
});

describe("refuse copy", () => {
  it("does not promise policy when retrieval is empty", () => {
    expect(NO_POLICY_RESPONSE).toMatch(/don’t have indexed company policy/i);
    expect(NO_POLICY_RESPONSE).not.toMatch(/refund is approved/i);
  });
});

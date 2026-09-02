import { describe, expect, it } from "vitest";
import { chunkPages } from "@/lib/knowledge/chunk";

describe("chunkPages", () => {
  it("keeps a short page as one chunk", () => {
    const chunks = chunkPages([{ text: "Refunds take 5–7 days.", pageNumber: 1 }]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.pageNumber).toBe(1);
    expect(chunks[0]?.chunkIndex).toBe(0);
  });

  it("splits long text and preserves order", () => {
    const text = Array.from({ length: 40 }, (_, index) => `Paragraph ${index + 1}.`).join("\n\n");
    const chunks = chunkPages([{ text, pageNumber: 2 }], 80, 10);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.pageNumber === 2)).toBe(true);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(chunks.map((_, index) => index));
  });

  it("skips empty pages", () => {
    const chunks = chunkPages([
      { text: "   ", pageNumber: 1 },
      { text: "Keep this.", pageNumber: 2 },
    ]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe("Keep this.");
  });
});

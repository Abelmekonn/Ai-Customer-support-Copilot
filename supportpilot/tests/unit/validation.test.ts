import { describe, expect, it } from "vitest";
import { sendMessageSchema, updateTicketSchema } from "@/lib/validation/ticket";
import { copilotResultSchema } from "@/lib/ai/schemas";

describe("ticket validation", () => {
  it("rejects an empty reply", () => {
    const parsed = sendMessageSchema.safeParse({
      ticketId: "not-a-uuid",
      content: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a status update", () => {
    const parsed = updateTicketSchema.safeParse({ status: "resolved" });
    expect(parsed.success).toBe(true);
  });
});

describe("copilot structured output", () => {
  it("requires a non-empty response", () => {
    const parsed = copilotResultSchema.safeParse({
      intent: "billing",
      category: "duplicate_charge",
      urgency: "high",
      response: "",
      needsHumanReview: true,
    });
    expect(parsed.success).toBe(false);
  });
});

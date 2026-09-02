import { describe, expect, it } from "vitest";
import { formatTicketNumber, initials } from "../../lib/utils";
import { copilotClassificationSchema } from "../../lib/ai/schemas";

describe("formatTicketNumber", () => {
  it("prefixes a hash", () => {
    expect(formatTicketNumber(1042)).toBe("#1042");
  });
});

describe("initials", () => {
  it("uses first and last name", () => {
    expect(initials("Sarah Johnson")).toBe("SJ");
  });
});

describe("copilot classification schema", () => {
  it("accepts structured intent JSON", () => {
    const parsed = copilotClassificationSchema.parse({
      intent: "billing",
      category: "duplicate_charge",
      urgency: "high",
      intentConfidence: 0.94,
    });
    expect(parsed.intent).toBe("billing");
  });
});

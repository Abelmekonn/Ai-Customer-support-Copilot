import { describe, expect, it } from "vitest";
import { buildThreadHeaders, replySubject, wrapMessageId } from "@/lib/channels/email/headers";
import { mapOutboundError } from "@/lib/channels/email/send";
import { resolveSendJobAction } from "@/lib/jobs/policy";

describe("outbound thread headers", () => {
  it("replies to the latest prior Message-ID and keeps References in order", () => {
    const headers = buildThreadHeaders({
      ourMessageId: "new@mail",
      previousIds: ["<root@mail>", "mid@mail", "<root@mail>"],
    });
    expect(headers.inReplyTo).toBe("mid@mail");
    expect(headers.headerInReplyTo).toBe("<mid@mail>");
    expect(headers.headerMessageId).toBe("<new@mail>");
    expect(headers.headerReferences).toBe("<root@mail> <mid@mail>");
  });

  it("prefixes Re: after stripping existing reply tags", () => {
    expect(replySubject("Re: Refund")).toBe("Re: Refund");
    expect(replySubject("Where is my order?")).toBe("Re: Where is my order?");
  });

  it("wraps ids once", () => {
    expect(wrapMessageId("<abc@mail>")).toBe("<abc@mail>");
  });
});

describe("mapOutboundError", () => {
  it("asks the operator to fix keys and domains instead of leaking provider copy", () => {
    const unauthorized = mapOutboundError(401, "Invalid API key");
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) expect(unauthorized.error).toMatch(/Resend API key/i);

    const forbidden = mapOutboundError(403, "domain is not verified");
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) expect(forbidden.error).toMatch(/verified/i);

    const busy = mapOutboundError(429, "Too many requests");
    expect(busy.ok).toBe(false);
    if (!busy.ok) expect(busy.retryable).toBe(true);

    const down = mapOutboundError(500, "boom");
    expect(down.ok).toBe(false);
    if (!down.ok) expect(down.retryable).toBe(true);
  });
});

describe("resolveSendJobAction", () => {
  it("completes when the provider accepted the mail", () => {
    expect(
      resolveSendJobAction({
        messageId: "m1",
        attempts: 1,
        maxAttempts: 8,
        result: { ok: true },
      }),
    ).toEqual({ type: "complete" });
  });

  it("reschedules retryable provider failures", () => {
    expect(
      resolveSendJobAction({
        messageId: "m1",
        attempts: 1,
        maxAttempts: 8,
        result: { ok: false, error: "busy", retryable: true },
      }).type,
    ).toBe("reschedule");
  });
});

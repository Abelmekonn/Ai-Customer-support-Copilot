import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseInboundPayload, peekToAddress, stripReplyPrefix } from "@/lib/channels/email/parse";
import { threadLookupIds, sanitizeAttachmentName } from "@/lib/channels/email/thread";
import { secretsMatch, verifyInboundRequest, verifySvixSignature } from "@/lib/channels/email/verify";

describe("parseInboundPayload", () => {
  it("reads a canonical JSON payload", () => {
    const email = parseInboundPayload({
      from: "Ada Lovelace <ada@example.com>",
      to: "acme@inbound.supportpilot.local",
      subject: "Re: Refund for order 1842",
      text: "I was charged twice.",
      messageId: "<abc-1@mail>",
      inReplyTo: "<root@mail>",
      references: "<root@mail> <mid@mail>",
    });

    expect(email.fromEmail).toBe("ada@example.com");
    expect(email.fromName).toBe("Ada Lovelace");
    expect(email.toEmail).toBe("acme@inbound.supportpilot.local");
    expect(email.messageId).toBe("abc-1@mail");
    expect(email.inReplyTo).toBe("root@mail");
    expect(email.references).toEqual(["root@mail", "mid@mail"]);
  });

  it("reads a Postmark-style payload", () => {
    const email = parseInboundPayload({
      From: "ada@example.com",
      FromName: "Ada",
      FromFull: { Email: "ada@example.com", Name: "Ada Lovelace" },
      To: "desk@inbound.test",
      ToFull: [{ Email: "desk@inbound.test" }],
      Subject: "Where is my order?",
      TextBody: "Still waiting.",
      MessageID: "pm-99",
      Headers: [
        { Name: "In-Reply-To", Value: "<prev@mail>" },
        { Name: "References", Value: "<root@mail>" },
      ],
      Attachments: [{ Name: "photo.png", ContentType: "image/png", Content: "aGVsbG8=" }],
    });

    expect(email.fromName).toBe("Ada Lovelace");
    expect(email.toEmail).toBe("desk@inbound.test");
    expect(email.inReplyTo).toBe("prev@mail");
    expect(email.attachments[0]?.filename).toBe("photo.png");
  });

  it("reads a Resend email.received payload", () => {
    const email = parseInboundPayload({
      type: "email.received",
      data: {
        from: "casey@shop.test",
        to: ["help@inbound.test"],
        subject: "Chargeback",
        text: "Please help",
        message_id: "re_1",
        in_reply_to: "re_0",
      },
    });

    expect(email.fromEmail).toBe("casey@shop.test");
    expect(email.toEmail).toBe("help@inbound.test");
    expect(email.messageId).toBe("re_1");
  });

  it("requires From, To, and Message-ID", () => {
    expect(() => parseInboundPayload({ to: "a@b.com", subject: "Hi", text: "x" })).toThrow(/From/i);
  });
});

describe("peekToAddress", () => {
  it("finds the envelope recipient before full parse", () => {
    expect(peekToAddress({ To: "Help Desk <desk@inbound.test>" })).toBe("desk@inbound.test");
  });
});

describe("threading helpers", () => {
  it("strips reply prefixes without emptying the subject", () => {
    expect(stripReplyPrefix("Re: Refund")).toBe("Refund");
    expect(stripReplyPrefix("FWD: Re: Hello")).toBe("Hello");
  });

  it("collects unique In-Reply-To and References ids", () => {
    expect(
      threadLookupIds({
        inReplyTo: "a",
        references: ["b", "a", "c"],
      }),
    ).toEqual(["a", "b", "c"]);
  });

  it("sanitizes attachment names for storage keys", () => {
    expect(sanitizeAttachmentName("invoice 2026 — final.pdf")).toBe("invoice_2026_final.pdf");
  });
});

describe("inbound verification", () => {
  it("accepts a timing-safe shared secret", () => {
    expect(secretsMatch("abc123", "abc123")).toBe(true);
    expect(secretsMatch("abc123", "abc124")).toBe(false);
    expect(
      verifyInboundRequest({
        rawBody: "{}",
        headers: new Headers({ "x-inbound-secret": "channel-secret" }),
        channelSecret: "channel-secret",
      }),
    ).toBe(true);
  });

  it("rejects a missing or wrong secret", () => {
    expect(
      verifyInboundRequest({
        rawBody: "{}",
        headers: new Headers(),
        channelSecret: "channel-secret",
      }),
    ).toBe(false);
  });

  it("accepts a Svix-style HMAC", () => {
    const secret = `whsec_${Buffer.from("test-secret").toString("base64")}`;
    const id = "msg_1";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = '{"ok":true}';
    const key = Buffer.from("test-secret");
    const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");

    expect(
      verifySvixSignature({
        secret,
        rawBody,
        id,
        timestamp,
        signatureHeader: `v1,${signature}`,
      }),
    ).toBe(true);
  });
});

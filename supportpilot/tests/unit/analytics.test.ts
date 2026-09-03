import { describe, expect, it } from "vitest";
import { buildAnalytics, isNoSource, percent, utcDayKeys } from "@/lib/analytics/build";

describe("utcDayKeys", () => {
  it("returns 14 UTC days ending today", () => {
    const now = new Date("2026-09-03T15:00:00.000Z");
    const keys = utcDayKeys(14, now);
    expect(keys).toHaveLength(14);
    expect(keys[0]).toBe("2026-08-21");
    expect(keys[13]).toBe("2026-09-03");
  });
});

describe("percent", () => {
  it("returns null when there is no denominator", () => {
    expect(percent(1, 0)).toBeNull();
    expect(percent(2, 8)).toBe(25);
  });
});

describe("isNoSource", () => {
  it("treats empty retrieval as no source", () => {
    expect(isNoSource(0)).toBe(true);
    expect(isNoSource(null)).toBe(true);
    expect(isNoSource(0.25)).toBe(false);
  });
});

describe("buildAnalytics", () => {
  const now = new Date("2026-09-03T12:00:00.000Z");

  it("buckets tickets, drafts, and sends onto the 14-day series", () => {
    const snapshot = buildAnalytics({
      now,
      draftsUsedMonth: 5,
      draftsCap: 40,
      tickets: [
        { status: "open", priority: "high", created_at: "2026-09-03T08:00:00.000Z" },
        { status: "resolved", priority: "low", created_at: "2026-09-01T08:00:00.000Z" },
        { status: "pending", priority: "medium", created_at: "2026-07-01T08:00:00.000Z" },
      ],
      generations: [
        {
          source_coverage: 0.5,
          retrieval_quality: 0.8,
          approved_at: "2026-09-03T09:00:00.000Z",
          created_at: "2026-09-03T08:30:00.000Z",
        },
        {
          source_coverage: 0,
          retrieval_quality: 0,
          approved_at: null,
          created_at: "2026-09-02T08:30:00.000Z",
        },
      ],
      usage: [
        { type: "draft", quantity: 1, created_at: "2026-09-03T08:30:00.000Z" },
        { type: "draft", quantity: 1, created_at: "2026-09-03T10:00:00.000Z" },
        { type: "email_out", quantity: 1, created_at: "2026-09-03T09:00:00.000Z" },
      ],
      documents: [{ status: "indexed" }, { status: "failed" }],
      messages: [{ send_status: "sent" }, { send_status: "failed" }, { send_status: "queued" }],
    });

    expect(snapshot.queue).toEqual({ open: 1, pending: 1, resolved: 1, total: 3 });
    expect(snapshot.days[13]).toMatchObject({ key: "2026-09-03", tickets: 1, drafts: 2, sent: 1 });
    expect(snapshot.days[11]).toMatchObject({ key: "2026-09-01", tickets: 1, drafts: 0, sent: 0 });
    expect(snapshot.copilot.sendRate).toBe(50);
    expect(snapshot.copilot.noSourceRate).toBe(50);
    expect(snapshot.copilot.grounded).toBe(1);
    expect(snapshot.documents.failed).toBe(1);
    expect(snapshot.mail).toEqual({ sent: 1, failed: 1, queued: 1 });
    expect(snapshot.drafts.remaining).toBe(35);
  });

  it("does not invent rates when there are no drafts", () => {
    const snapshot = buildAnalytics({
      now,
      draftsUsedMonth: 0,
      draftsCap: 40,
      tickets: [],
      generations: [],
      usage: [],
      documents: [],
      messages: [],
    });
    expect(snapshot.copilot.sendRate).toBeNull();
    expect(snapshot.copilot.noSourceRate).toBeNull();
    expect(snapshot.copilot.avgRetrieval).toBeNull();
    expect(snapshot.days.every((day) => day.tickets === 0 && day.drafts === 0)).toBe(true);
  });
});

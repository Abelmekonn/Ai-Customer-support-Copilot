import { afterEach, describe, expect, it } from "vitest";
import { authorizeCronRequest } from "@/lib/jobs/auth";

const original = process.env.CRON_SECRET;

afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;
});

describe("authorizeCronRequest", () => {
  it("rejects when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET;
    const request = new Request("http://localhost/api/jobs/run", {
      headers: { authorization: "Bearer nope" },
    });
    expect(authorizeCronRequest(request)).toBe(false);
  });

  it("accepts a matching Bearer token", () => {
    process.env.CRON_SECRET = "worker-secret";
    const ok = new Request("http://localhost/api/jobs/run", {
      headers: { authorization: "Bearer worker-secret" },
    });
    const bad = new Request("http://localhost/api/jobs/run", {
      headers: { authorization: "Bearer other" },
    });
    expect(authorizeCronRequest(ok)).toBe(true);
    expect(authorizeCronRequest(bad)).toBe(false);
  });
});

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(__dirname, "../..");

function readApp(relative: string) {
  return readFileSync(path.join(appRoot, relative), "utf8");
}

function existsApp(relative: string) {
  return existsSync(path.join(appRoot, relative));
}

describe("Phase 0 — jobs platform", () => {
  it("upload stores the file and enqueues indexing instead of processing inline", () => {
    const source = readApp("app/api/knowledge/upload/route.ts");
    expect(source).toContain("enqueueIndexDocument");
    expect(source).toContain('status: "queued"');
    expect(source).not.toContain("processKnowledgeDocument");
  });

  it("retry indexing enqueues a job instead of blocking on processKnowledgeDocument", () => {
    const source = readApp("app/api/knowledge/process/route.ts");
    expect(source).toContain("enqueueIndexDocument");
    expect(source).not.toContain("processKnowledgeDocument");
  });

  it("ships a worker endpoint to drain the job queue", () => {
    expect(existsApp("app/api/jobs/run/route.ts")).toBe(true);
    expect(existsApp("lib/jobs/run.ts")).toBe(true);
    expect(existsApp("supabase/migrations/004_jobs.sql")).toBe(true);
  });

  it("records usage events when chunks are indexed", () => {
    const source = readApp("lib/knowledge/process.ts");
    expect(source).toContain("recordUsage");
    expect(source).toContain("index_chunks");
  });
});

describe("Phase 1 — RAG copilot", () => {
  it("retrieves org-scoped chunks and attaches citations on Generate draft", () => {
    expect(existsApp("lib/rag/retrieve.ts")).toBe(true);
    const generate = readApp("lib/copilot/generate.ts");
    expect(generate).toContain("retrievePolicyChunks");
    expect(generate).toContain("sources");
    const actions = readApp("app/dashboard/tickets/copilot-actions.ts");
    expect(actions).toContain('from("citations")');
    expect(actions).toContain("rewritten_query");
  });

  it("refuses to draft policy when retrieval is empty", () => {
    const generate = readApp("lib/copilot/generate.ts");
    expect(generate).toContain("NO_POLICY_RESPONSE");
    expect(generate).not.toContain("sourceCoverage = 0");
  });
});

describe("Phase 2 — email in", () => {
  it("creates a ticket from a verified inbound email webhook", () => {
    expect(existsApp("lib/channels/email/inbound.ts")).toBe(true);
    expect(existsApp("app/api/channels/email/inbound/route.ts")).toBe(true);
    const inbound = readApp("lib/channels/email/inbound.ts");
    expect(inbound).toContain("verifyInboundRequest");
    expect(inbound).toContain("enqueueIngestEmail");
    const run = readApp("lib/jobs/run.ts");
    expect(run).toContain("ingest_email");
    expect(run).toContain("ingestInboundEmail");
  });

  it("keeps sample tickets behind the demo workspace flag", () => {
    const seed = readApp("app/api/demo/seed/route.ts");
    expect(seed).toContain("is_demo");
    const tickets = readApp("components/tickets/ticket-list.tsx");
    expect(tickets).toContain("isDemo");
  });
});

describe("Phase 3 — email out + audit", () => {
  it("sends the edited draft through the mail provider and stores the provider id", () => {
    expect(existsApp("lib/channels/email/send.ts")).toBe(true);
    expect(existsApp("lib/channels/email/outbound.ts")).toBe(true);
    expect(existsApp("supabase/migrations/006_email_outbound.sql")).toBe(true);
    const queue = readApp("lib/channels/email/queue-reply.ts");
    expect(queue).toContain("enqueueSendEmail");
    expect(queue).toContain("isInternal");
    const outbound = readApp("lib/channels/email/outbound.ts");
    expect(outbound).toContain("sendWithResend");
    expect(outbound).toContain("send_audits");
    expect(outbound).toContain("email_provider_id");
    const run = readApp("lib/jobs/run.ts");
    expect(run).toContain("send_email");
    expect(run).toContain("deliverOutboundMessage");
    const actions = readApp("app/dashboard/actions.ts");
    expect(actions).toContain("queueTicketReply");
  });
});

describe("Phase 4 — team workspace", () => {
  it.todo("admin can invite an agent who cannot delete knowledge");
});

describe("Phase 5 — billing", () => {
  it.todo("enforces a monthly draft cap without affecting other orgs");
  it("does not yet have a billing module", () => {
    expect(existsApp("lib/billing/plans.ts")).toBe(false);
  });
});

describe("Phase 6 — out of scope until 1–3", () => {
  it("does not ship a customer-facing chatbot route", () => {
    expect(existsApp("app/api/widget/chat/route.ts")).toBe(false);
    expect(existsApp("app/api/public/chat/route.ts")).toBe(false);
  });
});

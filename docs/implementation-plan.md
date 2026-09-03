# SupportPilot — structural implementation plan

Status: accepted product direction (2026-09-02)  
App root: `supportpilot/`  
This file is the source of truth for *what we build and in what order*. Cursor agents must follow it (see `.cursor/rules/supportpilot-ai-as-service.mdc`).

---

## 1. Product

SupportPilot is **AI as a service** for human support teams.

A company subscribes. We host models, embeddings, retrieval, and the copilot. They connect a mailbox (later a helpdesk), upload policy, and agents get **grounded drafts**. The agent always reviews and sends. We never operate a customer-facing chatbot.

**One-line loop:** inbound ticket → retrieve policy → cite + draft → human edit → send on the same channel → audit log.

If any step is fake (sample tickets only, draft with no sources, send only writes Postgres), it is not the product yet.

---

## 2. Current baseline (do not pretend this is production)

| Area | Today |
| --- | --- |
| Tenancy | Orgs, auth, RLS — keep and extend |
| Tickets | Inbound email webhook creates tickets and threads. Demo seed stays behind `is_demo` |
| Knowledge | Upload + extract/chunk/embed in the HTTP request. MiniMax RPM kills indexing |
| Copilot | MiniMax draft from thread only. Empty sources. Dummy confidence |
| Send | Resend outbound + audit. Internal notes stay local |
| Analytics / settings | Shell pages |
| Billing / invites | Stripe Checkout + portal; monthly draft cap; seats; invites |

---

## 3. Principles (non-negotiable)

1. **Hosted AI.** Our keys, our rate limits, our jobs. Customer BYOK is an enterprise add-on, not v1.
2. **Human-in-the-loop.** No auto-send to the customer.
3. **Ground or refuse.** If retrieval is weak, say so. Do not invent policy.
4. **One channel first.** Inbound + outbound email before Zendesk/Intercom.
5. **Work in jobs.** Ingest, index, embed, and send never block an upload/draft HTTP request for more than a few seconds (enqueue + poll/status).
6. **Tenant isolation.** Retrieval, storage paths, and logs are org-scoped. No cross-tenant chunks.
7. **Demo seed is a sandbox**, not intake.

---

## 4. Architecture (target)

```
Email provider          SupportPilot (Next.js + Supabase)
(inbound webhook)  -->  ingest job --> tickets + messages
PDF/MD/TXT upload  -->  index job  --> chunks + embeddings (pgvector)
Agent: Generate    -->  query embed --> match_documents --> LLM draft + citations
Agent: Send        -->  send job   --> outbound email + audit row
```

**Stack to keep:** Next.js App Router, TypeScript, Supabase (Postgres, Auth, RLS, Storage, pgvector).

**Add when a phase needs it:**

- Job runner: start with Supabase (table `jobs` + cron/edge, or Inngest). Do not keep indexing inside `POST /api/knowledge/upload`.
- Embeddings: OpenAI `text-embedding-3-small` (1536 dims — already in schema). MiniMax is OK for *drafts*, not for burst indexing.
- Email: one provider (Resend or Postmark inbound + send).
- Billing later: Stripe.

**New modules (create when the phase starts, don’t invent early):**

| Module | Role |
| --- | --- |
| `lib/jobs/` | Enqueue, run, retry, dead-letter |
| `lib/rag/` | Query rewrite, retrieve, citations |
| `lib/channels/email/` | Inbound parse, outbound send, threading |
| `lib/knowledge/` | Already started — extract, chunk, embed, process as a *job* |
| `lib/billing/` | Usage events, caps (phase 5) |

---

## 5. Feature map → phase

### Always (already started — harden, don’t rebuild)

- Multi-tenant orgs, login/register, RLS
- Ticket inbox + workspace UI (thread, status, reply composer)
- Copilot panel shell (intent, editor, sources list)
- Knowledge list + upload UI

### Phase 0 — Platform for AIaaS

**Status:** applied (2026-09-02). Jobs table, usage events, upload enqueues `index_document`, worker via `after()` + `POST /api/jobs/run`. RPM reschedules the job (~60s) instead of failing the upload POST.

**Outcome:** indexing and AI calls are hosted, reliable, org-scoped.

- Background `jobs` table: `index_document`, later `ingest_email`, `send_email`
- Move `processKnowledgeDocument` off the upload request; upload only stores the file and enqueues
- Embeddings: OpenAI (required for production indexing). Surface MiniMax RPM as a product bug, not a user puzzle
- Usage event stub: `org_id`, `type` (`draft` \| `embed_tokens` \| `email_out`), `quantity` — write events even before Stripe
- Status UX: Uploading → queued → extracting → … → Indexed / Failed + retry (already partly there)

**Done when:** a 20-page PDF indexes without a 400 from RPM, and refresh shows progress without hanging the browser on the upload POST.

### Phase 1 — The AI service (RAG)

**Status:** applied (2026-09-02). Generate draft rewrites a search query, retrieves org-scoped chunks via `match_knowledge_chunks`, cites them, and refuses when nothing matches.

**Outcome:** Generate draft uses *this org’s* indexed docs or refuses.

- `lib/rag/retrieve.ts`: embed query, `match_documents`, threshold
- Query rewrite from thread (short search query, not the raw email)
- Pass chunks into MiniMax/LLM; return `sources[]` (chunk id, document name, page)
- Confidence from real retrieval quality + source coverage (`lib/copilot/confidence.ts`)
- UI: SourceList populated; “no policy — ask / escalate” when empty
- Copilot still never sends

**Done when:** upload a refund PDF, open a refund ticket, Generate draft quotes that PDF with a citation.

### Phase 2 — Email in

**Status:** applied (2026-09-02). Inbound webhook verifies a shared/Svix secret, stores attachments, enqueues `ingest_email`, and creates customers/tickets/messages. Sample seed stays behind `organizations.is_demo`.

**Outcome:** real customers create tickets.

- Org setting: inbound address or forwarding
- Webhook route verifies provider signature
- Parse From / Subject / body / In-Reply-To → customer + ticket + messages
- Attachments on the ticket (storage, same org prefix as knowledge)
- Keep “Load sample tickets” behind a Demo workspace flag

**Done when:** a Gmail/Outlook send to the inbound address appears in the inbox without seeding.

### Phase 3 — Email out + audit

**Status:** applied (2026-09-02). Send enqueues `send_email`, Resend delivers with thread headers, messages store the provider id, and `send_audits` records generation/chunks/user. Internal notes stay local.

**Outcome:** Send leaves the building.

- Send on ticket = provider send, same thread headers
- Persist `messages` with `sender_type = agent` **and** provider message id
- Audit: `generation_id`, chunk ids, user id, sent_at
- Internal notes (not emailed) — separate from customer thread
- Resolve/pending still local status

**Done when:** agent hits Send and the customer receives the edited draft.

### Phase 4 — Team & workspace

**Status:** applied (2026-09-02). Admins invite by email; invited users join the same org (no new workspace). Agents cannot upload or delete knowledge. Tickets have an assignee. Org from-name, reply-to, and one brand-tone line feed outbound mail and copilot drafts.

**Outcome:** more than one agent can use the service.

- Invite by email; roles: `admin` (docs, mailbox, billing), `agent` (queue + send), `manager` (analytics)
- Assignee on tickets
- Presence / “already open” optional; assignee is enough for v1
- Org settings: from-name, reply-to, one brand-tone line for the copilot prompt

**Done when:** admin invites an agent; agent cannot delete knowledge.

### Phase 5 — Packaging & billing

**Status:** applied (2026-09-02). Plans live on the organization (`starter` / `team` / `scale`) with seats and a calendar-month UTC draft cap from `usage_events`. Generate draft is blocked at cap before MiniMax. Stripe Checkout + customer portal + webhook; without Stripe keys, Starter caps still apply.

**Outcome:** it is sold as a service.

- Plans: seats + monthly draft cap
- Meter from usage events; 80% warning; hard cap with a clear UI
- Stripe Checkout + customer portal
- Hosted keys only; BYOK later

**Done when:** a test customer can subscribe and is blocked at cap without killing other orgs.

### Phase 6 — Later (do not start before 1–3)

- Zendesk / Intercom / Help Scout
- Help-center URL crawl
- Doc collections + effective dates
- Eval harness (golden tickets)
- SSO
- Customer-facing widget that *creates tickets* (still human send)
- Hybrid search / rerank
- Auto-send / bot mode — **out of scope forever unless product explicitly reverses principle 2**

---

## 6. Screen-by-screen (v1)

| Screen | v1 job |
| --- | --- |
| Landing | Sell AIaaS: agents, citations, human send. Not a chatbot. |
| Auth | Register org, login, invite accept |
| Overview | Open count, drafts today, index failures — not vanity “AI assisted” with no RAG |
| Tickets | Real queue; demo banner if seed-only |
| Ticket | Thread + copilot (sources required) + send |
| Knowledge | Upload, job status, retry, delete |
| Customers | Derived from intake; don’t hand-build a CRM |
| Analytics | Drafts, send rate, no-source rate |
| Settings | Mailbox, tone, members, plan/usage |

Cut duplicate ticket UIs (`ticket-view.tsx` leftover) when touching that area.

---

## 7. Data to add (when the phase needs it)

Do not migrate everything up front. Add tables with the phase:

- **Phase 0:** `jobs` (`id`, `organization_id`, `type`, `payload`, `status`, `attempts`, `error`, `run_after`)
- **Phase 0:** `usage_events` (`organization_id`, `type`, `quantity`, `created_at`)
- **Phase 2:** `channel_accounts` (provider, inbound address, secrets encrypted)
- **Phase 3:** `outbound_messages` or columns on `messages` (provider_id, generation_id)
- **Phase 3:** `internal_notes`
- **Phase 4:** invites table; `tickets.assigned_to` already exists — use it
- **Phase 5:** Stripe IDs and `plan_id` on `organizations` (not a separate plans table)

---

## 8. Implementation rules for agents

- Implement **one phase at a time**. Do not start Phase 2 UI for Zendesk during Phase 1 RAG.
- After each phase, run `npm test` in `supportpilot/`. Phase contracts live in `tests/phases/phase-gates.test.ts` (`it.todo` becomes a real test when that phase ships).
- Prefer extending `lib/knowledge`, `lib/copilot`, `lib/rag` over new parallel pipelines.
- Every copilot draft in Phase 1+ must go through retrieval or an explicit refuse path.
- Never log API keys. Never commit `.env.local`.
- User-facing errors: actionable (wait / retry / add mailbox), not raw provider strings (`Invalid key`, `RPM`) unless mapped.
- Tests: chunking, retrieve threshold, confidence, email threading parse — as each module appears.

---

## 9. Suggested build order (first PRs)

1. `jobs` + enqueue index on upload; worker processes documents  
2. OpenAI embeddings for index + query  
3. RAG on Generate draft + citations in the panel  
4. Inbound email webhook → ticket  
5. Outbound send + audit  
6. Invites + role gates  
7. Stripe + draft caps  

---

## 10. Definition of production (v1)

A stranger can: create a workspace, connect a mailbox, upload a policy, receive a real email as a ticket, generate a draft that cites that policy, edit it, send it, and the customer gets the mail. Usage is counted. Another org cannot see that data.

Until then, keep calling it a prototype in README and landing — or finish the loop.

See [`docs/production-hardening.md`](./production-hardening.md) for the post-Phase-5 worker, CI, and operator checklist. Do not start Phase 6 until that loop runs without a dashboard tab as the job runner.

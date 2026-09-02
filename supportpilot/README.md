# SupportPilot

AI copilot for customer support agents. It helps a human understand a ticket, retrieve the right company policy, and draft a reply with sources — then the agent edits, approves, and sends.

This is **not** a customer-facing chatbot.

## Current stage

Stages 1–2 are in place: multi-tenant SaaS foundation, auth, ticket inbox, ticket workspace, and the copilot UI shell.

| Stage | Status |
| --- | --- |
| 1. SaaS foundation (Next.js, Supabase, auth, RLS, dashboard) | Done |
| 2. Ticket system (customers, inbox, workspace, human send) | Done |
| 3. Knowledge base (extract → chunk → embed → pgvector) | Upload + status UI only |
| 4. Basic RAG | Not started |
| 5. Copilot (intent, rewrite, structured output, confidence) | Types + confidence formula |
| 6. Human review (edit / regenerate / approve / send) | Send is live; AI actions stubbed |
| 7. Advanced RAG (hybrid search, reranking) | Not started |
| 8. Evaluation harness | Not started |

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase: Postgres, Auth, Storage, Row Level Security, pgvector
- Zod for validation
- Vitest for unit tests

Claude, OpenAI embeddings, and the retrieval pipeline are intentionally not wired yet.

## Setup

### 1. Create a Supabase project

In the Supabase dashboard:

1. Create a project.
2. Enable the `vector` extension (`Database` → `Extensions` → `vector`).
3. Run the SQL in `supabase/migrations/` **in order**:
   - `001_schema.sql`
   - `002_rls.sql`
   - `003_vector_search.sql`
4. Authentication → Providers → Email: turn **off** “Confirm email” while developing locally, or you will need to click the confirmation link before signing in.
5. Copy the project URL, anon key, and service role key.

### 2. Configure the app

```bash
cd supportpilot
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a workspace, then **Load sample tickets** on the dashboard.

## What you can demo today

- Register an organization (the first user becomes admin).
- Sign in; sessions are org-scoped via RLS.
- Dashboard stats and recent tickets.
- Ticket inbox with Open / Pending / Resolved and search.
- Ticket workspace: customer thread, agent reply, resolve/reopen.
- Copilot panel that explains it will not send mail for you.
- Knowledge upload to Storage (indexing is the next stage).
- Customers, analytics, and settings.

Replies are stored as `sender_type = agent`. The model never sends the customer message.

## Project layout

```
app/            routes, auth, dashboard, API
components/     tickets, copilot, knowledge, layout
lib/ai          structured copilot types and Zod schemas
lib/copilot     confidence calculation
lib/rag         (stage 3+)
lib/supabase    browser, server, admin, middleware clients
supabase/       schema, RLS, vector search
tests/unit      confidence + validation
```

## Why the pieces exist

- **Intent + query rewriting** — tickets are messy; retrieval queries should not be.
- **pgvector + reranking** — first cheap recall, then precision.
- **Structured LLM output** — intent, draft, and review flag as data, not prose.
- **Calculated confidence** — retrieval quality, source coverage, classification; not a model saying “97%”.
- **Human-in-the-loop** — the agent is accountable for the customer.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
```

# SupportPilot

Hosted copilot for **human** support agents: grounded drafts with citations. The agent always reviews and sends. This is not a customer-facing chatbot.

App root: this folder.

## Product loop

Inbound email → retrieve this workspace’s policy → cite or refuse → human edits → send on the same thread → usage counted.

Phases 0–5 in `../docs/implementation-plan.md` are implemented. Production hardening (job worker + CI) is `../docs/production-hardening.md`.

## Setup

1. Create a Supabase project, enable the `vector` extension, run `supabase/migrations/` **in order** (through `009_jobs_org_claim.sql`).
2. Copy env:

```bash
cp .env.example .env.local
```

Fill at least:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=
MINIMAX_API_KEY=
CRON_SECRET=
```

For real mail: inbound webhook secret, `INBOUND_MAIL_DOMAIN`, `RESEND_API_KEY`, `RESEND_FROM`. Stripe keys are optional; Starter draft caps still apply.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a workspace, upload a policy, connect a mailbox. Demo sample tickets stay behind the demo workspace flag.

## Jobs

Indexing, inbound ingest, and outbound send run as jobs.

- Upload / inbound / send still kick `after()` so work starts immediately.
- `GET /api/jobs/run` with `Authorization: Bearer $CRON_SECRET` drains **all** due jobs (Vercel Cron or GitHub Actions).
- Logged-in `POST /api/jobs/run` drains **only that org** (Knowledge page poller, local demo).

Set GitHub secrets `APP_URL` and `CRON_SECRET` so the scheduled workflow can ping production every 5 minutes. Vercel Hobby cron is once per day; use Pro or the GitHub ping.

## Tests

```bash
npm test
npm run typecheck
```

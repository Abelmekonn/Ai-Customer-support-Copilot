# Production hardening (after Phase 5)

Status: applied (2026-09-03)  
This is **not** Phase 6. No Zendesk, chatbot, auto-send, or hybrid search.

Product loop (Phases 0–5) exists. This work makes that loop run when nobody has the dashboard open, and fail in CI before it fails for a customer.

## Goal

A design-partner workspace can: connect a mailbox, upload policy, receive mail as a ticket, generate a grounded draft (or an explicit refuse), send, and have usage counted — **without a browser tab acting as the worker**.

## What we will ship in this pass

1. **Dedicated job drain**
   - `CRON_SECRET` on `GET`/`POST /api/jobs/run` for a global drain (cron, GitHub Actions, Vercel Cron).
   - Logged-in `POST` only drains **that org’s** jobs (Knowledge poller / local demo).
   - Keep `after()` on upload, inbound, and send for low latency.
2. **Schedulers**
   - `vercel.json` cron every minute (needs Vercel Pro for `* * * * *`).
   - GitHub Actions every 5 minutes as the portable drain (`APP_URL` + `CRON_SECRET` secrets).
3. **CI**
   - On push/PR: install, lint, `tsc --noEmit`, unit tests.
4. **Docs**
   - README matches Phases 0–5 + this worker. `.env.example` includes `CRON_SECRET`.

## What we will not do in this pass

- Move Generate draft into a job (timeouts stay a known limit; keep the HTTP action).
- Sentry, SSO, eval harness, Playwright against a live mailbox.
- Phase 6 features.

## Done when

- An unauthenticated request cannot drain jobs.
- A logged-in agent cannot drain another org’s jobs.
- Cron with `CRON_SECRET` can drain all due jobs.
- `npm test` and typecheck pass in GitHub Actions.
- README no longer calls the app a prototype that lacks RAG/send.

## Operator checklist (after merge)

- Set `CRON_SECRET` (long random) on the host.
- Set GitHub secrets `APP_URL` and `CRON_SECRET`, or enable Vercel Cron on Pro.
- Confirm `OPENAI_API_KEY`, `MINIMAX_API_KEY`, `RESEND_*`, inbound webhook secret, Stripe if you sell.
- Forward one real email, upload one policy, Generate draft, Send, confirm the customer inbox.

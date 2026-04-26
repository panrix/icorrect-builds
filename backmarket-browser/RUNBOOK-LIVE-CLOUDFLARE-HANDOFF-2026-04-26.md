# Live Cloudflare Handoff Runbook — Back Market

Date: `2026-04-26`
Status: ready when operator is available

## Purpose

Relaunch the Back Market headful auth flow only when Ricky/operator is available to solve Cloudflare in the visible browser.

## Current blocker

- Password works.
- Mailbox-code path is approved.
- Latest headful run hit Cloudflare human verification.
- The prior Chromium window is no longer active, so the next attempt must be relaunched live.

## Approval already given

Ricky approved headful Back Market auth handoff.

Allowed scope:

- launch operator-visible DataImpulse browser
- operator may solve Cloudflare if it appears
- agent may use approved mailbox-code retrieval for Back Market login code
- stop at dashboard

Not allowed:

- listing detail opens
- Save clicks
- listing edits
- inventory/price/publication changes
- customer/return/refund/warranty actions

## Launch command

From `/home/ricky/builds/backmarket-browser`:

```bash
node scripts/run-headful-cloudflare-auth-handoff.js --keep-open-on-block --hold-open-ms=900000
```

Recommended only when operator is ready, because hold-open is time-limited.

## Operator steps if Cloudflare appears

1. Connect to the visible GUI session for display `:99`.
2. Bring Chromium to front.
3. Complete only the Cloudflare human-verification checkbox/challenge.
4. Do not navigate elsewhere.
5. Do not open seller listing pages.
6. Tell Jarvis once challenge is cleared.

## Agent steps after Cloudflare clears

1. Continue Back Market email/password auth.
2. If `/2fa/email` appears, retrieve latest approved Back Market code from Jarvis mailbox.
3. Enter code without logging it.
4. Stop at dashboard/listings landing.
5. Write report and checkpoint.

## Success state

- Dashboard/listings page reached.
- Dedicated profile remains authenticated for next read-only browser agents.
- No portal mutation occurred.

## Next after success

- Agent A: GB-flag frontend URL capture.
- Agent B: SKU-change canary, only after exact write scope is separately approved.

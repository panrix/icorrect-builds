# Headful Cloudflare Handoff Plan — Back Market Login

Date: `2026-04-26`
Status: `READY FOR APPROVAL`

## Why this exists

The auth-only mailbox-code login runner could not reach the Back Market email-code step because `accounts.backmarket.co.uk` presented a Cloudflare human-verification gate first.

Previous state:

- DataImpulse path reaches Back Market auth.
- Jarvis password is accepted.
- A prior run reached `/2fa/email` and proved the next normal blocker is email code.
- Latest mailbox-code run was blocked earlier by Cloudflare human verification.

Conclusion: the next step needs a headful/operator-visible browser handoff, not another headless retry loop.

## Goal

Get one authenticated Jarvis seller-portal browser session through:

1. Cloudflare human verification, if shown.
2. Back Market email + password.
3. Back Market email-code step using the approved mailbox-code retrieval path or live code handoff.
4. Stop at seller dashboard/listings landing.

No listing/browser work starts until dashboard access is confirmed.

## Approval needed

Recommended approval wording:

> Approve headful Back Market auth handoff. Agent may launch an operator-visible DataImpulse browser, I may solve Cloudflare if it appears, and agent may use approved mailbox-code retrieval for the Back Market login code. Stop at dashboard. No listing edits, no Save, no portal mutations.

## Guardrails

- Auth only.
- No listing detail opens unless the task is later extended.
- No Save clicks.
- No listing edits.
- No inventory/price/publication changes.
- No customer messages.
- No returns/refunds/warranty actions.
- Do not print secrets, cookies, tokens, or email code.
- If dashboard is reached, stop and report.

## Proposed run shape

1. Launch Chromium headful through DataImpulse with the dedicated portal profile.
2. Navigate to `https://backmarket.co.uk/bo-seller/`.
3. If Cloudflare appears:
   - pause for operator/manual solve
   - do not attempt to bypass programmatically
4. Continue email/password auth using stored env values.
5. If `/2fa/email` appears:
   - use approved mailbox-code retrieval, or pause for live code handoff
6. Verify dashboard/listings landing only.
7. Save checkpoint and screenshot.
8. Stop.

## Success criteria

- Dashboard or Listings page reached.
- Session/profile remains available for next read-only browser tasks.
- No portal mutations occurred.

## Next after success

Start two separate browser-agent tracks:

### Agent A — Frontend URL capture

- Use authenticated Jarvis session.
- Open listing details one by one.
- Click/open GB flag frontend link.
- Capture final public URL and spec snapshot.
- Write `listing_id -> frontend_url` mapping.
- No edits.

### Agent B — SKU-change canary

- Use authenticated Jarvis session.
- Read one explicitly approved test listing.
- Verify current portal SKU vs canonical BM Devices SKU.
- If Ricky later approves exact write canary, change only SKU and verify.

## Current blocker

Waiting for approval/headful handoff path.

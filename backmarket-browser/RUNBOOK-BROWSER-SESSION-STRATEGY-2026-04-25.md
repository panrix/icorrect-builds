# Browser Session Strategy for VPS Browser-Harness

Date: 2026-04-25
Status: draft, no live Back Market access performed

## Decision

Use a VPS-first browser session for the durable Back Market runtime. A routed local Chrome session may be used only for discovery if needed, not as the production path.

## Option A: VPS Chrome/Edge session (preferred durable path)

Purpose: browser-harness controls a browser running on the VPS.

Steps, stopping before Back Market:

1. Confirm no runtime lock exists.
2. Confirm `browser-harness --doctor` current state.
3. Start a VPS Chrome/Edge profile dedicated to Back Market browser ops.
4. Run `browser-harness --setup` to attach to that browser.
5. Re-run `browser-harness --doctor`.
6. Capture doctor output and a neutral screenshot/tab proof only.
7. Stop. Do not open Back Market unless Ricky explicitly approves read-only portal access.

Pros:

- productised where the automation lives
- no dependency on Ricky laptop being awake/connected
- aligns with Ricky's "go VPS" direction

Risks:

- VPS browser profile/login/cookies need to be managed securely
- email-code login still needs approved live-login step
- must avoid concurrent sessions with runtime lock

## Option B: Ricky local Chrome routed to VPS (discovery only)

Purpose: use Ricky's already-authenticated local browser temporarily to discover UI paths.

Steps, stopping before Back Market mutation:

1. Ricky starts Chrome locally with remote debugging.
2. Ricky routes CDP to VPS with SSH reverse tunnel.
3. Browser-harness attaches from VPS.
4. Use screenshots/coordinate mapping to discover UI.
5. Compile findings into a skill.
6. Productise on VPS Chrome before recurring automation.

Pros:

- faster discovery if VPS login is blocked
- user can watch the browser actions

Risks:

- not durable
- depends on Ricky laptop/session
- should not become production runtime

## Approval boundaries

No approval needed for:

- local scripts/tests
- `browser-harness --help`
- `browser-harness --doctor`
- plan-only IMAP scripts
- runtime lock checks

Explicit approval required for:

- live IMAP mailbox connection
- starting a real BM login flow
- entering BM credentials
- requesting/using BM email code
- opening BM portal pages if logged in
- any SKU/customer/return/warranty/listing mutation

## Recommended next executable step

Implement `scripts/setup-strategy-plan.js` that prints this decision and current readiness from local-only checks:

- harness installed
- doctor status
- lock status
- IMAP env plan status
- next blocked action requiring approval

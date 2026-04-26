# Back Market Browser Agent TODO — 2026-04-26

Owner: Jarvis / Codex browser agents  
Status: active  
Purpose: get authenticated browser agents working safely before resuming listing decisions.

## Operating decision

Ricky and Jarvis agreed to pause further listing execution/cards until the Back Market browser automation foundation is proven.

Reason:

- Listing work moved too fast off dry-run/card evidence.
- Scraper/matching uncertainty showed we need stronger source-of-truth evidence.
- Browser agents should capture canonical seller-portal/front-end evidence directly before listing decisions continue.

## Hard safety rules

- No Back Market mutation without explicit scoped approval.
- No listing live action unless Ricky explicitly says `Approve <BM>`.
- Browser agents are read-only unless a task explicitly authorizes one exact write canary.
- No Save clicks unless the specific write canary approval includes it.
- No customer messages, returns, refunds, warranty actions, price changes, inventory changes, or publication changes.
- If email code/2FA/captcha appears, stop and report.
- Do not print passwords, cookies, tokens, or sensitive URLs with auth parameters.

## Active plan

### Phase 1 — Auth proof

- [x] DataImpulse path reaches Back Market auth email step.
- [x] Jarvis email submitted successfully: `jarvis@icorrect.co.uk`.
- [x] Password was stored in env as `BM_PORTAL_PASSWORD`.
- [x] Run password-stage canary.
  - Session: `kind-meadow`
  - Result: password accepted, then Back Market requested email verification code.
  - Blocker: `email_code_required`
  - Seller dashboard reached: no
  - Report: `/home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-PASSWORD-STAGE-CANARY-2026-04-26.md`
- [x] Attempt mailbox-code login completion via approved path. Result: blocked by Cloudflare human-verification before `/2fa/email`; mailbox retrieval not reached.
- [ ] Resolve Cloudflare human-verification / interactive browser path, then retry code step.

### Phase 2 — Two logged-in browser agents

Only after Phase 1 confirms login state.

#### Agent A — frontend URL capture

- [ ] Use authenticated Jarvis session.
- [ ] Go listing by listing.
- [ ] Open seller listing detail.
- [ ] Click/open GB market flag/link.
- [ ] Capture final public Back Market frontend URL.
- [ ] Capture safe public title/spec snapshot.
- [ ] Write `listing_id -> frontend_url` mapping locally.
- [ ] No edits, no Save, no mutations.

Existing scaffold:

- `/home/ricky/builds/backmarket-browser/reports/gb-flag-frontend-url-capture-design-2026-04-26.md`
- commit `daf7722` — GB frontend URL capture scaffold
- commit `4b42a36` — integrated into SKU browser task

#### Agent B — SKU-change canary

- [ ] Use authenticated Jarvis session.
- [ ] Choose one explicitly approved test listing only.
- [ ] Read current portal SKU and compare to canonical BM Devices SKU.
- [ ] If Ricky approves exact SKU write canary, change only SKU.
- [ ] Click Save only if approval explicitly includes Save.
- [ ] Reopen listing and verify SKU changed while product/appearance/quantity/publication state stayed unchanged.
- [ ] No broad replication until this is proven.

Existing SKU task/runbook:

- `/home/ricky/builds/backmarket-browser/RUNBOOK-SKU-PORTAL-CANARY-2026-04-26.md`
- `/home/ricky/builds/backmarket-browser/lib/fix-sku-contract.js`

### Phase 3 — Write the skill

After Agent A and Agent B are proven:

- [ ] Write browser-agent skill/runbook covering:
  - DataImpulse login/session pattern
  - handling password/email-code states
  - safe selector strategy
  - frontend URL capture via GB flag
  - SKU change workflow
  - verification steps
  - rollback/stop conditions
  - explicit approval language

### Phase 4 — Resume listing work

Only after browser evidence is reliable:

- [ ] Use captured frontend URLs as preferred scrape targets.
- [ ] Regenerate BM 1527 card with reconciled scrape proof.
- [ ] Generate missing cards only from corrected pipeline.
- [ ] Resume listing approvals one card at a time.

## Current listing state while browser work runs

- BM 1582: listed and verified.
- BM 1592: listed and verified.
- BM 1524: listed and verified.
- BM 1549: held by Ricky.
- BM 1527: paused until regenerated with reconciled scrape/URL evidence.
- BM 1541: held due return/refund relist caution.
- Remaining To List BMs do not all have full cards yet.

## Update cadence

- Keep Ricky updated as soon as any browser agent returns.
- Do not wait for the next heartbeat if a result comes back.
- Updates should say:
  - what completed
  - current blocker/state
  - exact next action
  - whether approval is needed

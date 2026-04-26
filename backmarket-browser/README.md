# Back Market Browser Ops Runtime

Status: design only on 2026-04-25. This task did not log into Back Market, email, Monday, or any other external system, and it did not mutate anything.

Purpose: define the controlled VPS-first browser-harness runtime for portal work that the Back Market API does not support for jarvis@icorrect.co.uk, with four initial capabilities:
- email-code login via SMTP-forwarded mailbox capture
- selector-mapping harness with drift detection
- fix-sku for existing listings
- read-only cs-monitor for customer service, warranty, and returns

## Guardrails
- Default mode is read-only and fail-closed.
- No customer replies, refunds, return decisions, warranty decisions, quantity edits, or price edits.
- No live fix-sku writes until selector validation is green and Ricky or Ferrari approves a 5-listing canary.
- Only the SKU field is in scope for mutation, and only for approved listing ids with pre and post screenshots.
- Canonical SKU source is BM Devices `text89` from SOP 05 QC handoff; browser automation verifies or copies this value only, never invents a SKU.
- A single runtime lock blocks concurrent portal sessions.
- Any selector ambiguity, login drift, toast error, quantity drift, or pub_state drift halts the run.

## Proposed File Tree

    backmarket-browser/
    ├── README.md
    ├── SPEC-2026-04-25.md
    ├── lib/
    │   ├── session.js
    │   ├── mailbox-smtp.js
    │   ├── selector-map.js
    │   ├── selector-harness.js
    │   ├── portal-client.js
    │   ├── lock.js
    │   ├── rate-limiter.js
    │   ├── screenshots.js
    │   └── db.js
    ├── operations/
    │   ├── fix-sku.js
    │   └── cs-monitor.js
    ├── scripts/
    │   ├── bootstrap-session.js
    │   ├── validate-selectors.js
    │   ├── run-fix-sku.js
    │   ├── rollback-fix-sku.js
    │   └── run-cs-monitor.js
    ├── config/
    │   └── selectors/
    ├── test/
    │   ├── fixtures/
    │   ├── unit/
    │   └── integration/
    └── data/
        ├── browser.db
        ├── inbox/
        ├── runs/
        ├── screenshots/
        └── storage-state/

Import rule: backmarket-browser may read helpers from /home/ricky/builds/backmarket/scripts. The reverse import is not allowed.

## Milestones
- M0: freeze the mailbox path for login codes. Pure SMTP is not enough to read mail, so the runtime assumes a mailbox forward that delivers BM code emails into a local SMTP sink or spool.
- M1: prove VPS browser-harness read-only login, cookie persistence, session refresh, and logout recovery.
- M2: build the selector harness and capture signed-off fixtures for login, dashboard, listings, listing edit, customer service, warranty, and returns pages.
- M3: ship the fix-sku dry-run path, CSV validation, checkpoint DB, and rollback drill.
- M4: run the first approved 5-listing SKU canary, then wait for manual audit before any larger batch.
- M5: ship the read-only monitor that polls customer service, warranty, and returns queues and emits alert cards only.

## Env Vars
- BM_PORTAL_EMAIL, BM_PORTAL_PASSWORD
- BM_LOGIN_CODE_MODE=smtp-forward
- BM_SMTP_HOST, BM_SMTP_PORT, BM_SMTP_USER, BM_SMTP_PASS, BM_SMTP_TLS
- BM_SMTP_FROM_FILTER, BM_SMTP_SUBJECT_FILTER, BM_CODE_REGEX, BM_CODE_TIMEOUT_SEC
- BM_CODE_SPOOL_DIR, BM_STORAGE_STATE_DIR, BM_BROWSER_DB_PATH, BM_SCREENSHOT_DIR
- BM_LOCK_PATH, BM_RATE_LIMIT_MS, BM_HEADLESS, BM_SELECTOR_PROFILE
- BM_ALERT_WEBHOOK or a local queue sink for operator alerts

## Test Plan
- Unit: login-code parsing, selector manifest validation, CSV schema validation, stop-condition logic, rollback record generation.
- Fixture integration: replay cached HTML for the seven required portal pages and require every selector to resolve uniquely.
- Browser smoke: read-only login bootstrap, session reuse, selector walkthrough, screenshot capture, and logout recovery.
- Canary write test: synthetic rollback drill, then one approved 5-listing production batch only after all read-only checks are green.

## First 5-Listing SKU Batch Protocol
1. Input comes from the fixed listings audit with listing_id, current_sku, correct_sku, and the full device tuple.
2. Freeze the batch at 5 listings, acquire the runtime lock, and run a read-only preflight on all required pages and all 5 listings.
3. For each listing, capture current SKU, quantity, pub_state, and screenshots before editing.
4. Edit only the SKU field, save, reload, and verify that SKU changed while quantity and pub_state did not.
5. Stop the entire batch on any toast error, selector drift, mismatch, or unexpected state change.
6. After the batch, rerun the listings audit, inspect all 5 listings manually, and keep the next batch blocked until the audit is clean.

## Neutral harness commands

```bash
npm run harness:about-blank:plan
node scripts/vps-cdp-about-blank-check.js --start-chromium
```

The neutral harness probe uses localhost CDP only, runs browser-harness `page_info()` against `about:blank`, and fails closed if it sees Back Market/seller-portal text.

See SPEC-2026-04-25.md for the detailed runtime contract and RUNBOOK-SKU-PORTAL-CANARY-2026-04-26.md for the next read-only SKU portal canary.

# VPS Browser-Harness Read-Only Preflight Runbook

Date: 2026-04-25
Status: draft, no live Back Market action performed

## Purpose

Prove the Back Market seller portal can be controlled through a VPS-first browser-harness runtime before any SKU/customer/return/warranty mutation is allowed.

This runbook is read-only until Ricky explicitly approves the first one-SKU canary.

## Hard stops

Stop immediately if any of these happen:

- browser-harness is missing from the VPS
- no runtime lock can be acquired
- Chrome/CDP is unreachable or attaches to the wrong profile
- Back Market asks for login/email code before a live-login approval is given
- selector map is ambiguous
- screenshots do not match expected page/state
- any UI path exposes customer reply/refund/return/warranty decision controls in a way the runtime cannot avoid
- any action would change SKU, quantity, price, publication state, customer message, return state, or warranty state

## Repeatable neutral CDP attach/startup

Use the productised neutral probe before any portal work:

```bash
cd /home/ricky/builds/backmarket-browser
npm run harness:about-blank:plan
node scripts/vps-cdp-about-blank-check.js --start-chromium
```

What the script does:

1. Acquires `data/.runtime.lock` and aborts if another browser operation is active.
2. Uses only localhost CDP (`http://127.0.0.1:9222` by default); non-local CDP endpoints fail closed.
3. Optionally starts headless Chromium at `about:blank` with an isolated profile under `data/chromium-profile`.
4. Discovers the CDP websocket from `/json/version`.
5. Runs browser-harness with `BU_CDP_WS=<discovered websocket>`.
6. Executes only:
   - `ensure_real_tab()`
   - `page_info()`
7. Requires the harness output to confirm `about:blank` and contain no Back Market URL/text.

This neutral probe does not open Back Market and does not authenticate anywhere.

Environment overrides:

- `BROWSER_HARNESS_BIN` or `--harness-bin=<path>`
- `BU_CDP_HTTP` or `--cdp-http=http://127.0.0.1:9222`
- `BU_CDP_WS` to attach to an already-discovered local websocket
- `BM_CHROMIUM_BIN` for a non-standard Chromium path
- `BM_CHROMIUM_PROFILE_DIR` or `--profile-dir=<path>`
- `BM_LOCK_PATH` or `--lock=<path>`

### Failure policy

The script fails closed if:

- runtime lock exists
- browser-harness binary is missing
- CDP endpoint/websocket is not localhost/127.0.0.1
- Chromium cannot be found when `--start-chromium` is requested
- `/json/version` does not expose `webSocketDebuggerUrl`
- browser-harness does not confirm `about:blank`
- probe output contains Back Market/seller-portal text

## Preflight gates

### Gate 0: local files and tests

Run from `/home/ricky/builds/backmarket-browser`:

```bash
npm test
npm run validate:selectors
npm run harness:about-blank:plan
node scripts/plan-imap-metadata-fetch.js --since=<timestamp>
```

Required result:

- all tests pass
- selector map validates
- IMAP plan returns `ok: true`, `readOnly: true`, `liveNetwork: false`

### Gate 1: VPS harness availability

Run:

```bash
command -v browser-harness
browser-harness --help
```

Required result:

- binary resolves to `/home/ricky/.local/bin/browser-harness` or equivalent VPS path
- help/doctor command exits cleanly

### Gate 2: runtime lock

Acquire a single lock before any browser session starts:

- lock path: `data/.runtime.lock`
- lock owner: operation name + timestamp + pid
- if lock exists, abort; never run concurrent portal sessions

### Gate 3: browser session attach

Preferred target: VPS browser session controlled by browser-harness.

Fallback for discovery only: Ricky local Chrome routed to VPS, but do not treat that as the production runtime.

Required evidence:

- screenshot of blank/new tab or already-authenticated Back Market tab
- profile/account evidence does not leak secrets
- CDP/session target is stable

### Gate 4: read-only Back Market landing

Only after explicit approval for live portal read-only access:

- open seller portal
- if already logged in: screenshot dashboard/navigation only
- if login required: stop unless live-login approval has been given
- if email-code is requested: stop unless code-retrieval approval has been given

### Gate 5: selector walk, read-only only

Validate these pages by screenshot + selector map only:

- dashboard/nav
- Listings page
- Listings filter panel
- one listing detail page opened by known approved fixture only, no edits
- Customer Care -> Open tasks
- Customer Care -> All requests

Required evidence per page:

- screenshot saved under `data/screenshots/preflight/`
- selector validation result saved under `data/runs/`
- no mutation buttons clicked except safe navigation/filter open/close

## First one-SKU canary prerequisites

Do not proceed until all are true:

- read-only preflight green
- mailbox metadata-only validation green
- exact one listing approved by Ricky/Ferrari
- CSV row includes listing_id, current_sku, correct_sku, product_id, appearance, title/spec tuple
- rollback drill documented
- pre-change screenshot and values captured

## Evidence bundle for Ricky

Before asking for one-SKU canary approval, provide:

- tests passed
- selector walk passed
- screenshots path
- exact listing candidate
- current SKU and target SKU
- unchanged fields to verify after save: product_id, appearance, quantity, pub_state, title/spec
- rollback plan

# Local Harness Preflight - 2026-04-25

## Scope

Added local-only runtime lock and browser-harness availability checks for the VPS-first Back Market browser ops runtime.

No Back Market login, browser session attach, mailbox network connection, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/lib/runtime-lock.js`
- `/home/ricky/builds/backmarket-browser/lib/harness-check.js`
- `/home/ricky/builds/backmarket-browser/scripts/preflight-local.js`
- `/home/ricky/builds/backmarket-browser/test/unit/runtime-lock.test.js`
- `/home/ricky/builds/backmarket-browser/test/unit/harness-check.test.js`

## What it validates

- runtime lock can be acquired and released
- concurrent lock acquisition fails closed
- stale/wrong PID release fails closed
- browser-harness binary exists on the VPS
- `browser-harness --help` exits successfully
- local preflight reports `liveNetwork: false` and `portalAccess: false`

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/preflight-local.js
node -c /home/ricky/builds/royal-mail-automation/dispatch.js
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Result:

```text
selector-map.test passed
fix-sku.test passed
cs-monitor.test passed
mailbox-code.test passed
mailbox-imap-contract.test passed
mailbox-fetcher.test passed
imap-metadata-fetcher.test passed
runtime-lock.test passed
harness-check.test passed
Selector map contract valid
preflight-local: ok=true, harness.ok=true, liveNetwork=false, portalAccess=false
Dispatch match self-test passed
```

## Next

Next safe step is a plan-only `browser-harness --doctor` wrapper that records whether the daemon/browser attach path is ready without opening Back Market.

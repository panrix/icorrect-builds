# VPS Harness Preflight Runbook Report - 2026-04-25

## Scope

Created the read-only VPS browser-harness preflight runbook for Back Market seller-portal automation.

No live Back Market login, mailbox connection, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/RUNBOOK-VPS-HARNESS-PREFLIGHT-2026-04-25.md`

## What it covers

- hard stops
- local tests and selector gates
- VPS browser-harness availability gate
- runtime lock gate
- browser session attach gate
- read-only Back Market landing gate
- read-only selector walk for Listings and Customer Care
- prerequisites before the first one-SKU canary
- evidence bundle required before asking Ricky/Ferrari for canary approval

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/plan-imap-metadata-fetch.js --since=2026-04-25T20:00:00Z
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
Selector map contract valid
Dispatch match self-test passed
```

## Next

Implement the runtime lock and harness availability check as executable scripts, still without live portal access.

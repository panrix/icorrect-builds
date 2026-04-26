# SKU Portal Browser-Harness Path Report

Generated: 2026-04-26 03:12 UTC  
Mode: READ-ONLY / NON-LIVE except local docs/tests and neutral `about:blank` browser probe

## Scope performed

No Back Market portal login, navigation, SKU/listing/customer/return/warranty/refund action, Monday write, Google Sheets write, Slack/Telegram send, or external mutation was performed.

Neutral browser work was limited to local/VPS Chromium CDP at `about:blank`.

## Files changed

- `lib/vps-cdp-harness.js`
  - Shared helpers for localhost-only CDP validation, `/json/version` websocket discovery, Chromium launch args, browser-harness probe input, and neutral `about:blank` output assertions.
- `scripts/vps-cdp-about-blank-check.js`
  - Repeatable fail-closed neutral harness probe.
  - Acquires runtime lock.
  - Optionally starts headless Chromium at `about:blank`.
  - Discovers CDP websocket.
  - Runs browser-harness `ensure_real_tab()` + `page_info()` using `BU_CDP_WS`.
  - Fails if output does not confirm `about:blank` or contains Back Market/seller portal text.
- `test/unit/vps-cdp-harness.test.js`
  - Unit coverage for localhost CDP validation, websocket extraction, Chromium args, probe input, and neutral-page guard.
- `package.json`
  - Adds `vps-cdp-harness.test.js` to `npm test`.
  - Adds:
    - `npm run harness:about-blank:plan`
    - `npm run harness:about-blank`
- `RUNBOOK-VPS-HARNESS-PREFLIGHT-2026-04-25.md`
  - Adds productised neutral CDP startup/attach flow and failure policy.
- `RUNBOOK-SKU-PORTAL-CANARY-2026-04-26.md`
  - New read-only SKU portal canary runbook.
  - Defines approval gates, screenshot/checkpoint plan, hard stops, and future write-canary boundary.
- `README.md`
  - Adds canonical SKU source note: BM Devices `text89` from SOP 05 QC handoff.
  - Adds neutral harness commands.

## QC SKU model mapped to browser path

Canonical SKU now belongs to SOP 05/QC handoff:

- BM Devices `text89` is the browser path's canonical SKU source.
- Portal read-only canary verifies seller-portal SKU equals BM Devices `text89`.
- Browser automation must not construct/invent SKU values.
- Future portal write path may only copy an explicitly approved canonical BM Devices `text89` into the seller portal SKU field.
- Missing or mismatching BM Devices `text89` is a QC/SOP 05 blocker, not a browser correction task.

## Candidate for first read-only portal canary

From `/home/ricky/builds/backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json`:

- Main item: `11522195767`
- Item: `BM 1555 ( Isaiah Ellis )`
- BM Devices item: `11522177120`
- UUID: `8948b82c-f746-4be0-a8b0-0758b1dc4acc`
- Canonical SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
- Classification: `READY_FOR_LISTING_PROPOSAL`

If a fresher queue report exists before the canary, use the fresher report and re-validate that `sku_current === sku_expected`.

## Verification commands and output

Run from `/home/ricky/builds/backmarket-browser`.

### Unit tests / local validators

```bash
npm test
npm run validate:selectors
npm run harness:about-blank:plan
```

Output summary:

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
harness-doctor.test passed
vps-cdp-harness.test passed
Selector map contract valid
harness:about-blank:plan => ok=true, readOnly=true, livePortalAccess=false, opensBackMarket=false, mutations=false
```

### Neutral VPS/CDP/browser-harness probe

```bash
node scripts/vps-cdp-about-blank-check.js --start-chromium
```

Output:

```json
{
  "ok": true,
  "readOnly": true,
  "livePortalAccess": false,
  "openedBackMarket": false,
  "cdpHttp": "http://127.0.0.1:9222",
  "cdpWebSocketDiscovered": true,
  "harnessStatus": 0,
  "neutral": {
    "ok": true
  },
  "stdoutPreview": "{'url': 'about:blank', 'title': '', 'w': 1280, 'h': 813, 'sx': 0, 'sy': 0, 'pw': 1280, 'ph': 813}\n",
  "stderrPreview": ""
}
```

## Remaining blockers

- No approval yet to open Back Market seller portal.
- No approval yet to perform login or email-code retrieval.
- No live selector capture from Back Market portal pages yet.
- No SKU write approval.
- Candidate should be re-confirmed from the latest queue report immediately before canary.
- The `backmarket-browser/` scaffold appears untracked in the parent `/home/ricky/builds` git tree, so this report does not claim a clean committed repo state.

## Exact next approval request

Recommended wording for Jarvis/Ricky:

> Approve one read-only Back Market seller-portal browser canary using VPS browser-harness. Candidate: BM 1555 / Main `11522195767` / BM Devices `11522177120` / UUID `8948b82c-f746-4be0-a8b0-0758b1dc4acc` / canonical SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`. Permission requested: open seller portal, log in if required, retrieve/use the login email code if prompted, navigate only to Listings/filter/listing detail for this candidate, capture screenshots/checkpoints, and read portal SKU/product_id/appearance/quantity/publication/title. No Save, no edits, no customer/return/warranty/refund/listing mutation, no Monday/BM/Google/messaging writes.

Do not proceed to any SKU correction until a separate write-canary approval names the exact field/value and allows clicking Save.

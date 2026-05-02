# Browser Ops Skeleton - 2026-04-25

## Scope

Created the first non-live skeleton for `/home/ricky/builds/backmarket-browser/`.

No Back Market, Monday, customer, return, warranty, or listing mutations were performed.

## Added

- `package.json`
- `config/selectors/portal.json`
- `lib/selector-map.js`
- `lib/fix-sku-contract.js`
- `lib/cs-monitor-contract.js`
- `scripts/validate-selectors.js`
- `scripts/run-fix-sku.js`
- `scripts/run-cs-monitor.js`
- `test/unit/selector-map.test.js`
- `test/unit/fix-sku.test.js`
- `test/unit/cs-monitor.test.js`

## What it proves

- Selector manifest is machine-validated.
- SKU fix operation has a dry-run contract that encodes Ricky's required verification loop: edit, save, return to listings, filter again, reopen, verify exact SKU.
- Customer Care monitor has initial classification logic for:
  - `Repair/replace`
  - typo variant `Repair/replaxe`
  - upcoming deadline statuses such as `5 days left`
  - suppression for `Completed` / `No action needed`

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
```

Result:

```text
selector-map.test passed
fix-sku.test passed
cs-monitor.test passed
Selector map contract valid
```

## Next

Implement VPS browser-harness read-only login/session bootstrap once mailbox-code retrieval path is confirmed.

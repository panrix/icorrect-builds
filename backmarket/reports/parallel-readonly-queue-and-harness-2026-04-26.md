# Parallel Readonly Queue Pull and Harness Preflight - 2026-04-26

## Scope

Ricky approved doing both in parallel:

1. current queue read-only pull
2. VPS browser-harness setup/preflight

No Back Market portal login, customer action, listing mutation, return/warranty action, or bulk listing mutation was performed.

## Queue pull result

First read-only pull output:

- `/home/ricky/builds/backmarket/reports/current-queue-readonly-2026-04-26-000545.json`
- row count: 12
- initial result showed all 12 blocked because the script incorrectly followed Main Board `board_relation5`, which links to the generic Devices board, not BM Devices.

Fix applied:

- updated `/home/ricky/builds/backmarket/scripts/current-queue-readonly.js` to map BM Devices by the BM Devices board `board_relation` back-link to the Main Board item.

Corrected read-only pull output:

- `/home/ricky/builds/backmarket/reports/current-queue-readonly-2026-04-26-000638.json`
- row count: 12
- classes:
  - `SAFE_TO_LIST`: 1
  - `BLOCKED`: 11

Confirmed safe candidate:

- Main item `11522195767`
- `BM 1555 ( Isaiah Ellis )`
- BM Devices item `11522177120`
- SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
- classification: `SAFE_TO_LIST` in the narrow queue script

Main blocker pattern:

- 10 rows blocked for missing BM Devices SKU
- 1 row blocked for missing BM Devices relation

## Harness result

Started a neutral headless Chromium session on the VPS with CDP on `127.0.0.1:9222`.

`browser-harness --doctor` improved from:

- Chrome running: fail
- daemon alive: fail

To:

- Chrome running: ok
- daemon alive: fail unless explicit setup/attach is used

Direct CDP override works:

```bash
BU_CDP_WS=<ws from /json/version> browser-harness <<'PY'
ensure_real_tab()
print(page_info())
PY
```

Result:

```text
{'url': 'about:blank', 'title': '', 'w': 780, 'h': 493, ...}
```

This proves browser-harness can control the VPS Chromium session without opening Back Market.

## Remaining guardrails

Still not performed:

- Back Market login
- email-code request/use
- live mailbox connection
- BM portal navigation
- SKU/customer/return/warranty/listing mutation

## Next

1. Review the corrected 12-row queue output and column assumptions.
2. If approved, use the safe candidate BM 1555 as the first listing/portal canary path, still read-only before any SKU/listing mutation.
3. Productise the CDP override/session launch into a repeatable harness startup script.

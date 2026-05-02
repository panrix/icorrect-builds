TASK: Triage missing Back Market trade orders from the sheet-vs-BM Devices reconciliation.

Context:
- Workdir: /home/ricky/builds/backmarket
- Primary report: /home/ricky/builds/backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.md
- Result summary from Jarvis: 291 in-scope 2026 orders checked, 281 matched, 9 missing BM Devices, 1 duplicate/ambiguous.

Goal:
- Investigate the 9 missing BM Devices orders and the 1 duplicate/ambiguous order.
- Determine for each: likely cause, whether a BM Devices item exists under another identifier, whether it is a data-linking issue, import gap, duplicate, return/relist artifact, cancelled/refunded order, or real missing record.

Hard requirements:
- Read-only only. No Monday writes, no Back Market writes, no customer messages, no portal mutation.
- You may use existing repo scripts if they are read-only. Avoid scripts known to send Telegram or mutate data unless you inspect and prove they are safe.
- If credentials are needed, use existing repo/env conventions, but do not print secrets.
- Preserve evidence: item IDs, order IDs, serials, customer names if already present in source reports, and links/column IDs where useful.

Output:
- Write a markdown report under /home/ricky/builds/backmarket/reports/ named bm-missing-orders-triage-2026-04-26.md.
- Include a compact table/list: order, evidence checked, likely cause, recommended action, confidence.
- Include a top summary suitable for Jarvis to paste to Ricky.
- Do not perform writes.

When completely finished, run:
openclaw system event --text "Done: Codex triaged the missing Back Market trade orders" --mode now

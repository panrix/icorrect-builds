TASK: Live-list BM 1524 under Ricky's temporary clearance rule, then produce next profit-metrics card.

Context:
- Ricky approved after seeing BM 1524 card: “Yes proceed please.”
- Temporary rule: commercial/profit threshold is informational only; proceed if SKU/listing/product_id/return-safety gates are clean.
- BM 1524 card: /home/ricky/builds/backmarket/reports/sop06-card-BM-1524-2026-04-26.md

Part A: Live-list BM 1524
- Candidate: BM 1524 / Djibril Fotsing
- Main item: 11430091106
- BM Devices: 11430091746
- SKU: MBP.A2338.M1.8GB.256GB.Grey.Fair
- Listing slot: 5500817
- Product ID: 8948b82c-f746-4be0-a8b0-0758b1dc4acc
- Price: £405
- Min price: £393

Hard safety requirements:
- Before mutation, re-read the BM 1524 card and re-verify identity gates: exact Main item, BM Devices item, stored SKU, expected SKU, listing slot, product_id, return_relist_caution=false.
- Do not list if item differs, SKU mismatches, product_id/listing slot mismatches, return_relist_caution=true, or script attempts a different item/price.
- Do not run bulk reconcile scripts or mutate other listings.
- Do not touch customer messages, returns, refunds, warranty, portal state, or unrelated Monday fields.
- Use safest existing single-item SOP/list-device path, with override if needed to force £405/£393 and bypass commercial block only.
- Verify after mutation with read-only BM API/listing check and Monday check.

Part B: Next card after BM 1524
- Produce exactly one next full SOP 06 dry-run listing card after BM 1524.
- Temporary card style: focus on profit metrics and identity/safety gates. Commercial threshold is informational only.
- Include: SKU match, listing/product_id confidence, return/relist caution, live market prices, purchase/parts/labour/shipping/fixed cost, break-even, proposed, min price, net at min, margin at min.
- If identity/safety gates pass, state "Proceedable under Ricky's temporary clearance rule" even if profit is below old SOP threshold.
- Exclude BM 1541 or any return/relist cautioned item.
- Read-only only for next card. No writes for next candidate.

Outputs:
1. Write live-list report: /home/ricky/builds/backmarket/reports/live-list-bm-1524-2026-04-26.md
2. Write next card report under /home/ricky/builds/backmarket/reports/sop06-card-BM-XXXX-2026-04-26.md
3. Include paste-ready summaries for Jarvis.
4. Commit only intentional code/doc/report changes if safe; do not commit secrets/logs.

When completely finished, run:
openclaw system event --text "Done: Codex live-listed BM 1524 under temporary clearance rule and produced next card" --mode now

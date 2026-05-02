TASK: Apply Ricky's temporary clearance rule, live-list BM 1592 if identity gates still pass, then produce next card focused on profit metrics.

Context:
- Ricky clarified temporary listing rule on 2026-04-26:
  "temporarily remove the SOP block reasons. All I need at the moment is to understand the profit metrics. But as long as the sku, listing, etc match then we should proceed"
- This means: commercial SOP block / profit threshold no longer blocks listing for the current Back Market clearance push.
- Identity/safety gates still apply: SKU, listing slot/product_id, resolver/catalog, return/relist caution, and exact item match must be clean.
- BM 1592 full card: /home/ricky/builds/backmarket/reports/sop06-card-BM-1592-2026-04-26.md
- BM 1592 approved clearance position from card: list £599, min £582.

Part A: Live-list BM 1592
- Candidate: BM 1592 / roxy ROX
- Main item: 11717344920
- BM Devices: 11717348363
- SKU: MBP.A2338.M2.8GB.256GB.Grey.Fair
- Listing slot: 6569346
- Product ID: ef20e8dd-bcbf-4d94-8933-15f59560b9b9
- Price: £599
- Min price: £582

Hard safety requirements for Part A:
- Before mutation, re-read card and re-verify identity gates: exact Main item, BM Devices item, stored SKU, expected SKU, listing slot, product_id, return_relist_caution=false.
- Do not list if item differs, SKU mismatches, product_id/listing slot mismatches, return_relist_caution=true, or script attempts a different item/price.
- Do not run bulk reconcile scripts or mutate other listings.
- Do not touch customer messages, returns, refunds, warranty, portal state, or unrelated Monday fields.
- Use safest existing single-item SOP/list-device path, with override if needed to force £599/£582 and bypass commercial block only.
- Verify after mutation with read-only BM API/listing check and Monday check.

Part B: Next card after BM 1592
- Produce exactly one next full SOP 06 dry-run listing card after BM 1592.
- Temporary card style: focus on profit metrics and identity gates. Do not let commercial SOP block language dominate.
- Still include: SKU match, listing/product_id confidence, return/relist caution, live market prices, purchase/parts/labour/shipping/fixed cost, break-even, proposed, min price, net at min, margin at min.
- If identity/safety gates pass, state "Proceedable under Ricky's temporary clearance rule" even if profit is below old SOP threshold.
- Exclude BM 1541 or any return/relist cautioned item.
- Read-only only for next card. No writes for the next candidate.

Outputs:
1. Write live-list report: /home/ricky/builds/backmarket/reports/live-list-bm-1592-2026-04-26.md
2. Write next card report under /home/ricky/builds/backmarket/reports/sop06-card-BM-XXXX-2026-04-26.md
3. Include paste-ready summaries for Jarvis.
4. Commit only intentional code/doc/report changes if safe; do not commit secrets/logs.

When completely finished, run:
openclaw system event --text "Done: Codex live-listed BM 1592 under temporary clearance rule and produced next card" --mode now

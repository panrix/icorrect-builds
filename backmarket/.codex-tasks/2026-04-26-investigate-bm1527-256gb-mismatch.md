TASK: Investigate BM 1527 scraper/product mismatch. READ ONLY.

Context:
- Ricky spotted: "The scraper is matching BM 1527 to 256gb but it’s 512gb".
- Recent BM 1527 card claims SKU/spec is 512GB but current market/product scrape may be matching/pricing against a 256GB product or market page.
- BM 1527 card: /home/ricky/builds/backmarket/reports/sop06-card-BM-1527-2026-04-26.md
- Candidate details from card:
  - BM 1527 / Precious Uhwache
  - Main item: 11440582288
  - BM Devices: 11440594268
  - Expected SKU: MBP.A2338.M1.8GB.512GB.Silver.Fair
  - Claimed registry slot: 5035146
  - Claimed product_id: 9ef00207-1136-45f4-99c3-ade923986e43
  - Claimed numeric BM product: 545417

Goal:
- Root cause investigation only. No fix until root cause is proven.
- Determine whether BM 1527 has been matched/priced against a 256GB market/product/listing despite being a 512GB device.
- Identify exact layer causing mismatch: Monday spec read, SKU generation, registry mapping, BM catalog entry, scraper URL/query, market-price selection, or report generation.

Rules:
- READ ONLY ONLY.
- Do not list, mutate BM, mutate Monday, send messages, alter returns/refunds, or update production data.
- Do not apply code fixes unless root cause is confirmed and you include a minimal patch proposal/report. Prefer report first.

Investigation steps:
1. Inspect BM 1527 card and the dry-run/log evidence used to create it.
2. Inspect relevant mappings for SKU MBP.A2338.M1.8GB.512GB.Silver.Fair, listing 5035146, product_id 9ef00207-1136-45f4-99c3-ade923986e43, numeric product 545417.
3. Check whether these refer to 512GB or 256GB in:
   - data/listings-registry.json
   - data/bm-catalog.json
   - scraper market data / V7 scraper outputs
   - any product/order-history maps
   - scripts/lib/v7-scraper.js and scripts/list-device.js selection logic
4. If safe, run read-only dry-run/probe commands only if needed, but no live listing/mutation.
5. Produce a concrete root-cause hypothesis with evidence.

Output:
- Write report: /home/ricky/builds/backmarket/reports/bm1527-256gb-mismatch-investigation-2026-04-26.md
- Include Jarvis paste-ready summary:
  - confirmed issue or false alarm
  - affected layer
  - why it happened
  - whether BM 1527 card is invalid
  - safest next action

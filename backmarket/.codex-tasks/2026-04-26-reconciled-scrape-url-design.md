TASK: Design and, if safe/minimal, implement a reconciled Back Market scrape URL verification layer.

Context:
- Ricky identified a serious issue: scraper/matching may be incorrect. BM 1527 appears to be a 512GB device, but scraper/pricing may be matching a 256GB product/page.
- Active BM 1527 investigation session `vivid-gulf` is checking the immediate mismatch. This task is broader: design the robust fix so every listing card verifies model/spec/grade against a fully reconciled scrape target.
- New hard rule: no live listings unless Ricky explicitly says `Approve <BM>`.

Goal:
- Prevent wrong-market pricing by requiring a fully reconciled scrape URL/target before any card or listing proposal is trusted.
- The scrape target must verify that model, chip, RAM, SSD, colour, keyboard/layout where relevant, and grade match the candidate, not just product_id/listing_id or fuzzy family.

Required investigation/design:
1. Trace current scraper/matching path in `scripts/list-device.js`, `scripts/lib/v7-scraper.js`, registry/catalog data, and market data files.
2. Identify how current code selects product/page/market prices and why a 512GB item could receive 256GB market data.
3. Propose a reconciled scrape target contract:
   - canonical candidate spec from Monday/QC SKU
   - canonical BM catalog product/listing target
   - generated URL/query/filters used for scrape
   - page/product assertions before accepting prices
   - grade-specific price extraction and ladder validation
   - hard fail if page/spec/grade mismatch
4. If safe and small, implement the validation layer in read-only/dry-run path only. Do not touch live mutation paths unless strictly gated and tested.
5. Add regression tests or fixtures covering BM 1527 / 512GB vs 256GB mismatch.
6. Produce a report with root cause, proposed/implemented fix, and verification.

Hard rules:
- Do not list or mutate BM/Monday.
- Do not change live listing behavior unless dry-run/card generation validation is proven.
- If implementation requires >5 files or uncertain behavior, stop at design + patch plan.
- Preserve secrets.

Outputs:
- Report: /home/ricky/builds/backmarket/reports/reconciled-scrape-url-verification-2026-04-26.md
- If implemented, include files changed, tests run, and verification output.
- Include Jarvis paste-ready summary.

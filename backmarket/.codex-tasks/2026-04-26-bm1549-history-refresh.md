TASK: Read-only historical evidence refresh for BM 1549 product card.

Context:
- Ricky asked that approval requests include full product cards.
- BM 1549 card exists: /home/ricky/builds/backmarket/reports/sop06-card-BM-1549-2026-04-26.md
- Current card has live market and identity/profit metrics, but the fast run skipped historical sales lookup.

Goal:
- Add/produce historical Back Market sales evidence for BM 1549 without any writes/mutations.

Candidate:
- BM 1549 / Lily Doherty
- Main item: 11507101485
- BM Devices item: 11507109525
- SKU: MBA.A2337.M1.7C.8GB.256GB.Grey.Fair
- Listing slot: 5606597
- Product ID: b5ebc79d-0304-41a6-b1ae-d2a487afa11f

Hard rules:
- READ ONLY ONLY.
- Do not list, mutate Monday, mutate BM, send messages, touch returns/refunds/customer workflows, or alter other listings.
- Use existing scripts/data sources safely.
- If a script would mutate, do not run it.

Output:
- Write a concise report: /home/ricky/builds/backmarket/reports/sop06-card-BM-1549-history-refresh-2026-04-26.md
- If safe, update /home/ricky/builds/backmarket/reports/sop06-card-BM-1549-2026-04-26.md to include the historical evidence section. Do not alter pricing/identity unless your read-only evidence proves it is stale.
- Include Jarvis paste-ready summary with historical order counts, first/last seen, price range, listing-specific history if available, and any caveats.

TASK: Continue with the next Back Market SOP 06 dry-run listing card.

Context:
- Ricky approved continuing after BM 1555.
- Workdir: /home/ricky/builds/backmarket
- Current reports to inspect:
  - /home/ricky/builds/backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json
  - /home/ricky/builds/backmarket/reports/listing-proposal-dry-runs-2026-04-26-0302.md
  - /home/ricky/builds/backmarket/reports/return-refund-relist-invariant-2026-04-26.md
  - SOP docs under /home/ricky/builds/backmarket and KB Back Market SOP 06 if needed.

Goal:
- Pick the next safest READY_FOR_LISTING_PROPOSAL candidate after BM 1555.
- Do NOT pick BM 1541 if it is return/relist cautioned.
- Produce exactly one full SOP 06 dry-run listing proposal card.

Hard requirements:
- Read-only only. No Monday writes, no Back Market API writes, no seller portal actions, no customer messages.
- Include current live market scrape/current market check if available.
- Include historical Back Market sales evidence.
- Confirm product identity/spec and product_id confidence.
- Include suggested listing position/price and explicit caution/block flags.
- If live scrape fails, state the failure and fallback source clearly. Do not invent data.

Output:
- Write a markdown report under /home/ricky/builds/backmarket/reports/ named like sop06-card-BM-XXXX-2026-04-26.md.
- Include a top summary suitable for Jarvis to paste to Ricky.
- Do not commit unless you changed tracked code/docs beyond report creation.

When completely finished, run:
openclaw system event --text "Done: Codex produced the next Back Market SOP 06 dry-run listing card" --mode now

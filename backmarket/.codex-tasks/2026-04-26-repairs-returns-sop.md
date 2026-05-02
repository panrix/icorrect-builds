TASK: Draft the Back Market Repairs and Returns SOP.

Context:
- Ricky said: “We actually need to create an SOP for repairs and returns.”
- Back Market recovery context: Ferrari should be removed from manual BM portal admin work where possible. Browser automation is read-only first and mutation-gated.
- Return/refund relist invariant exists: /home/ricky/builds/backmarket/reports/return-refund-relist-invariant-2026-04-26.md
- BM 1541 is SKU-ready but listing-cautioned until return linkage/reset verified.
- Existing docs may live under /home/ricky/builds/backmarket/docs, historical docs, and KB Back Market SOPs.

Goal:
- Create a practical SOP draft for Back Market repairs and returns, suitable for operations use and later automation.
- Cover repair/replace requests, returns, refunds, warranty/after-sales, relisting returned stock, and data-linkage rules.

Hard requirements:
- Documentation only. No external writes. No customer messages. No BM portal mutation.
- Ground the SOP in existing docs/reports where possible. Flag uncertain gaps rather than inventing.
- Include safety gates: approval required for refund, return accept/reject, warranty decision, customer-facing reply, and live relist.
- Include minimum data checks: BM order, Main item, BM Devices item, serial/IMEI, return/refund state, repair notes, QC state, listing/SKU state.
- Include an automation-ready checklist and escalation rules.

Output:
- Write markdown SOP draft under /home/ricky/builds/backmarket/docs/ named SOP-BM-REPAIRS-RETURNS-2026-04-26.md.
- Include a short “Open questions for Ricky” section, max 8 bullets.
- Include a top summary suitable for Jarvis to paste to Ricky.
- Commit the doc if this repo is clean enough to commit just this file; otherwise leave uncommitted and explain why in the report.

When completely finished, run:
openclaw system event --text "Done: Codex drafted the Back Market repairs and returns SOP" --mode now

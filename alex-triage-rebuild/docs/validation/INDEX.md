# docs/validation — INDEX

Validation fixtures, results, and run reports for the Alex triage rebuild (email triage + Telegram review flow).

## Files

- `email-triage-fixtures.json` — Fixture pack of synthetic Intercom email conversations (fresh Monday match, etc.) used as inputs to triage validation runs.
- `email-triage-remediation-2026-04-11.md` — Root-cause summary and fixes for the 2026-04-11 remediation pass (live-posting flag, Telegram send verification, historical-quote guard, fallback drafts).
- `email-triage-validation-2026-04-09.md` — Validation report for the 2026-04-09 email triage run (scope, hard guards, freshness window).
- `email-triage-validation-2026-04-11.md` — Validation report for the 2026-04-11 email triage run (post-remediation).
- `email-triage-validation-results-2026-04-09.json` — Per-fixture pass/fail decisions and customer match output for 2026-04-09.
- `email-triage-validation-results-2026-04-11.json` — Per-fixture pass/fail decisions, expected vs actual outcomes for 2026-04-11.
- `telegram-review-flow-2026-04-09.json` — Telegram review-flow QA cases (approve, approve-retry, etc.) with pass/result/details for 2026-04-09.
- `telegram-review-flow-2026-04-09.md` — Human-readable Telegram review-flow QA report for 2026-04-09.
- `telegram-review-flow-2026-04-11.json` — Telegram review-flow QA cases for 2026-04-11.
- `telegram-review-flow-2026-04-11.md` — Human-readable Telegram review-flow QA report for 2026-04-11.

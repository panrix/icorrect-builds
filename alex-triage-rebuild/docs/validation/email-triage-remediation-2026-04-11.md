# Email Triage Remediation Pack — 2026-04-11

## Root Cause Summary

- `ALEX_ENABLE_LIVE_POSTING` was not present in the env files loaded by the repo, and the runtime only treated the exact string `"1"` as enabled. Scheduled triage could therefore complete, write `pending` rows, and leave checkpoints stale without posting anything.
- The Telegram send path accepted any HTTP 200 response and did not verify Telegram `ok` or `result.message_id`, so a soft Telegram API failure could have left rows without a recorded Telegram message id.
- The historical quote guard was too narrow and allowed internal quote-automation emails like `New quote emailed to ...` into the email review path.
- Fallback drafts were generic for the real email triage categories (`active_repair`, `complaint_warranty`, `quote_followup`, `corporate_account`, `bm_email`), so timeout fallback quality degraded materially.

## Runtime Evidence Before Restart

- SQLite checkpoints are still stale in the live repo data: `last_successful_check_at=2026-04-08T07:46:02.522Z`, `last_successful_morning_at=2026-04-09T08:50:43.530Z`.
- SQLite currently has `63` pending conversations, with `25` pending rows still missing Telegram message ids.
- Existing Telegram-posted evidence is present in SQLite: conversations `215473526683969`, `215473828667086`, `215473838643895`, and `215472862153240` have Telegram ids `1945`, `1944`, `1943`, and `1942` in chat `-1003822970061`, thread `774`.
- Pricing operational state is now refreshed: `data/pricing.json` contains `879` entries, and `data/cron-pricing-sync.log` shows the old `250` count on 2026-04-09/10 and `879` on 2026-04-11 05:00 UTC.

## Validation Cases

### 1. Fresh Intercom email with valid Monday match
- Expected outcome: post, show Monday item + link, produce reviewable draft.
- Actual outcome: PASS via `docs/validation/email-triage-validation-2026-04-11.md` (`fresh-monday-match`). Monday link rendered and fallback draft stayed usable.
- Notes: Classified as `active_repair` with Monday link `.../pulses/1111`.

### 2. Fresh email from returning customer with previous repairs visible
- Expected outcome: post, show previous repairs and Monday context.
- Actual outcome: PASS via `returning-customer-history`.
- Notes: Card now includes a dedicated `PREVIOUS REPAIRS` section and Monday link `.../pulses/2222`.

### 3. Fresh email with no Monday match but repair history present
- Expected outcome: post, no Monday link, repair history still visible.
- Actual outcome: PASS via `history-no-monday`.
- Notes: Classified as `new_enquiry`; previous repair history remained visible without a Monday match.

### 4. Fresh email with weak or missing pricing
- Expected outcome: post, safe diagnostic-style draft, no invented price.
- Actual outcome: PASS via `weak-pricing-data`.
- Notes: Price resolved to `Diagnostics recommended`; fallback draft stayed reviewable and non-committal.

### 5. Old resolved quote or stale historical item excluded
- Expected outcome: exclude from email triage.
- Actual outcome: PASS via `stale-old-quote-excluded` and `quote-automation-excluded`.
- Notes: Both stale quote history and internal quote-automation email noise are blocked.

### 6. Already-processed conversation excluded
- Expected outcome: exclude already-reviewed/sent conversation.
- Actual outcome: PASS via `already-processed-no-resurface`.
- Notes: Existing Telegram-reviewed conversation did not resurface.

### 7. Card posts to Telegram with message id recorded
- Expected outcome: post into the email topic and persist `telegram_message_id`/chat/thread ids.
- Actual outcome: PASS on existing runtime evidence in SQLite; multiple rows already persist Telegram ids in thread `774`.
- Notes: Code is now stricter and will throw if Telegram returns HTTP 200 without `ok=true` and `result.message_id`.

### 8. Approve / Edit / Escalate / Snooze behaviour
- Expected outcome: approve once, retry Monday sync without double-send, edit refreshes card, escalate tags/note, snooze reposts once due.
- Actual outcome: PASS via `docs/validation/telegram-review-flow-2026-04-11.md` (`6/6` cases passed).
- Notes: Routing case also confirmed the email topic `774` and quote-card blocking.

## Code Changes Made

- Added boolean env parsing so live-posting and polling flags accept `1/0`, `true/false`, `yes/no`, and `on/off`.
- Made the Telegram client fail closed when Telegram returns `ok=false` or omits `message_id`.
- Added an explicit live-posting warning in `scripts/inbox-triage.js` and log output when checkpoints advance.
- Tightened email triage exclusion for internal quote-automation traffic.
- Expanded card context with `monday_url`, latest visible message fallback, and a dedicated `PREVIOUS REPAIRS` section.
- Hardened fallback draft quality for the real email triage categories and reject obviously malformed LLM output before using it.
- Reduced false-positive `corporate_account` classification to cases with real business signals instead of any non-personal domain.
- Fixed category precedence so quote-followup emails with quote context do not get misclassified as `active_repair`.
- Updated deployment docs and cron so controlled live triage explicitly exports `ALEX_ENABLE_LIVE_POSTING=1` unless overridden.

## Blockers / Caution

- I did not execute a fresh live Telegram post from this sandbox, so the post-fix checkpoint advance has not been re-proven against the real Telegram API from this environment.
- Because the live repo data still shows stale checkpoints, the operational cutover step remains: reinstall the updated cron and observe one successful live run that writes a new checkpoint and Telegram message id.

## Go / No-Go

- Recommendation: `NO-GO` for immediate uncontrolled restart.
- Condition to move to `GO`: deploy the updated cron/runtime, run one controlled live check, and confirm in SQLite that a newly posted conversation records `telegram_message_id` and advances the relevant checkpoint beyond 2026-04-09/2026-04-08.

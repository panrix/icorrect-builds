# Codex Remediation Brief — Alex Email Triage Recovery

**Date:** 2026-04-11 00:49 UTC  
**Priority:** Critical  
**Owner:** Codex builder  
**Scope:** Email triage recovery only. Do not broaden into quote triage rebuild.

## Objective

Get the **email triage card flow** into a state where it is safe for a **controlled live restart**.

This means:
- fresh Intercom email conversations only
- useful Telegram triage cards posted to the correct email review thread
- previous repairs, Monday context, and Monday link present where expected
- no historical quote leakage
- no duplicate resurfacing
- review actions behave correctly
- clear validation proving go/no-go

## Current repo reality

The system is partly built and partly live, but degraded.

Observed from repo + runtime inspection:
- triage runs are still completing every 15 minutes
- recent runs are finding actionable conversations
- conversations are being inserted into SQLite as `pending`
- many recent conversations have **no Telegram message id**, so cards are not reliably reaching Telegram
- service is running on port 8020
- checkpoints are stale:
  - `last_successful_morning_at`: 2026-04-09
  - `last_successful_check_at`: 2026-04-08
- draft generation is timing out frequently and falling back
- Monday API is intermittently returning 500/504 or HTML error pages
- pricing code now supports pagination, but cron log still shows old `Synced 250 pricing entries`

## Non-negotiable scope guard

Today is **not** about expanding features.

Do:
- recover and verify **email triage only**
- fix missing context on cards
- fix live posting / checkpointing / runtime issues
- produce real validation evidence

Do not:
- expand quote triage
- broaden the brief into a new architecture pass
- enable auto-send
- ship speculative improvements outside the critical path

## Primary problems to solve

### 1. Live posting appears disabled or silently broken
Symptoms:
- pending conversations in DB
- many missing Telegram message ids
- checkpoints not advancing

You must determine exactly why and fix it.

Potential causes to inspect:
- env loading for `ALEX_ENABLE_LIVE_POSTING`
- service environment mismatch vs shell environment
- send failures swallowed before checkpoint update
- topic/thread config issues

### 2. Card enrichment is incomplete or inconsistent
Ricky explicitly wanted these to come through properly:
- previous repairs
- Monday match
- Monday link
- useful latest-message context
- usable draft

Audit the card assembly end-to-end and fix any breakpoints.

### 3. Historical quote leakage must stay quarantined
The email triage flow must not surface old quote history or stale quote cases into the live email review thread.

### 4. Drafting degrades badly under timeout
OpenRouter/Qwen timeouts are frequent. Improve resilience enough that review cards remain useful even when generation fails.

### 5. Pricing refresh may still be stale in operations
The code change for pagination exists, but the operational refresh may not have been run after the fix. Confirm and correct.

## Required work

### A. Runtime and delivery audit
Inspect and fix the actual live path:
- triage script
- Telegram posting path
- env/config loading
- checkpoint update conditions
- service wiring
- cron wiring if relevant

Deliver the exact root cause for why cards are not consistently landing in Telegram.

### B. Email card completeness audit
For the email triage path, verify and fix:
- previous repair lookup shown when present
- Monday match and Monday item link shown when matched
- latest message or compact thread context shown clearly
- confidence tier and buttons match category
- red-tier cards do not show Approve

### C. Historical/stale exclusion guards
Prove the email flow excludes:
- old quote noise
- already processed conversations
- stale conversations outside freshness window
- snoozed/resolved conversations where applicable

### D. Draft resilience
Without changing overall product intent, improve reliability so that:
- timeout or malformed LLM responses fall back cleanly
- fallback drafts are still reviewable and safe
- the system does not silently degrade into junk cards

### E. Pricing operational verification
Confirm whether `pricing.json` is based on the paginated sync.
If not, refresh it and ensure the operational path now produces the full catalogue, not the old 250-product subset.

### F. Validation pack
Create a concise validation document in this repo that proves behaviour before live restart.

Minimum required cases:
1. Fresh Intercom email with valid Monday match
2. Fresh email from returning customer with previous repairs visible
3. Fresh email with no Monday match but repair history present
4. Fresh email with weak or missing pricing
5. Old resolved quote or stale historical item excluded
6. Already-processed conversation excluded
7. Card posts to Telegram with message id recorded
8. Approve / Edit / Escalate / Snooze behaviour validated or clearly scoped if not fully testable end-to-end

For each case show:
- input summary
- expected outcome
- actual outcome
- pass/fail
- notes

## Acceptance criteria

Only mark this ready for controlled live restart if all are true:
- cards land in the correct Telegram email thread
- Telegram message ids persist in DB for posted cards
- checkpoints advance on successful live posting
- previous repairs show where expected
- Monday match and Monday link show where expected
- stale historical quote leakage is blocked
- processed conversations do not resurface
- pricing data is refreshed and no longer limited to old 250-product sync
- validation doc clearly shows pass/fail evidence

## Constraints

- Work only in: `/home/ricky/builds/alex-triage-rebuild`
- Use git and commit your changes
- Do not enable auto-send
- Do not broaden scope into quote triage rebuild
- Do not claim “done” without validation evidence

## Deliverables

1. Code changes in repo
2. Validation document with real evidence
3. Short summary:
   - root cause(s)
   - what changed
   - what passed
   - what failed or still needs caution
   - go/no-go recommendation for controlled live restart

## Final instruction

Be surgical. Recover the email triage path. Prove it works. Do not wander.

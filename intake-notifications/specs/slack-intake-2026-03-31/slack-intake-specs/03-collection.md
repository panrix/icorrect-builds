# Slack Intake Spec: Collection

**Written:** 2026-03-31
**Status:** Spec complete, ready for build
**Source:** Ricky voice notes, Mar 31

---

## Overview

Customer arrives to pick up their repaired device. The team needs a clean, accurate notification: who's here, what device, have they paid, and anything to hand back to them. Current build has the right idea but the data quality is poor.

---

## Data Source

- **Typeform:** Collection Form (`vslvbFQr`)
- **Monday.com:** Main Board 349212843 (matched by name + email)
- **n8n workflow:** `FB83t0dN0PNlEOpd` (active)

---

## Current Typeform Fields

| Field | Ref | Type |
|-------|-----|------|
| Device ready confirmation | collection-confirmation | yes_no |
| Name | 5d23f52f-... | short_text |
| Email | client-email | email |
| Device type | 6a5a78bd-... | multiple_choice (MacBook/iPhone/iPad/Watch) |

---

## Slack Notification (On Typeform Submit)

Clean message showing:

- **Customer name**
- **Device:** full model from Monday item name (not just generic "iPhone" from Typeform)
- **Service:** what was done (Repair / Diagnostic / etc.)
- **Payment status:** paid or outstanding balance. Clear and accurate.
- **Accessories to return:** did they leave a case or charger with us? Must pull from the correct Monday column.
- **Intercom + Monday links** at the bottom

---

## What Needs Fixing (Current Build Issues)

### 1. "Repair difficulties detected" fires on almost everyone
- Currently useless because it's too sensitive
- Either fix the detection logic to only flag genuine issues, or remove it entirely
- If kept: only flag when there are actual documented difficulties in updates

### 2. "Customer chasing/upset" detection
- Unclear if this is working correctly
- Needs verification: what triggers it, is it accurate?
- Same rule: only flag if it's real and actionable

### 3. Accessories / Case column
- We were trying to show if a case was left with us so we can return it
- The column being read may not be correct (`status_14` is "Case" but might not mean "customer left a case with us")
- **Must verify:** which Monday column tracks accessories left by the customer
- "Case column: No Case" label must not appear in the notification. Just show "Case: Yes" or nothing.

### 4. Raw data leaking into accessories
- Intercom URLs, Typeform response text, and Monday item descriptions are being dumped into the accessories field
- All of this needs to be stripped. Accessories should only show what the customer physically left with us.

### 5. LLM summary not firing
- The enrichment analysis node calls the LLM endpoint but it silently fails on most notifications
- When it does fire (rare), the notes are useful
- Fix: reliable LLM call with proper error handling, or remove the dependency

---

## Actions

### ✅ Collected
- Button to confirm the device has been handed back to the customer
- Updates Monday status (e.g. to "Collected" or "Returned")
- Slack message updates to show completion

### Optional: Notes
- If there's anything to note at collection (e.g. customer mentioned an issue), allow a quick note that gets added as a Monday update

---

## Hard Requirements

1. **Accurate payment status.** Must reflect what's actually owed, not a guess.
2. **Accessories must be correct.** Only show what the customer actually left with us. No raw data dumps.
3. **Flags must be meaningful.** If "repair difficulties" fires on 80%+ of notifications, it's noise. Fix or remove.
4. **No raw labels.** No "Case column:", no "From updates:", no Intercom URL fragments.
5. **Device model from Monday**, not from Typeform's generic dropdown.

---

## Architecture Notes

- Existing n8n workflow (`FB83t0dN0PNlEOpd`) is the right foundation
- Needs cleanup, not a rebuild
- Enrichment Analysis node needs the LLM endpoint call fixed or a reliable fallback
- Slack template needs reformatting to remove raw labels and data leaks
- Accessories extraction: use only the verified Monday column, stop scanning update text

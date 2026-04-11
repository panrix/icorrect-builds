# Slack Intake Spec: Walk-In (No Appointment)

**Written:** 2026-03-31
**Status:** Spec complete, ready for build
**Source:** Ricky voice notes, Mar 31

---

## Overview

Customer walks in with no booking. No prior Monday item, no pre-repair form, potentially no Intercom history. The Typeform captures the core details; the Slack notification and intake flow handle everything else.

---

## Data Source

- **Typeform:** iCorrect Walk-In v2 (`Rr3rhcXc`)
- **Monday.com:** searched for existing items (returning customer match)
- **Intercom:** searched for prior conversations
- **Shopify/website pricing data:** for price lookup

---

## Current Typeform Fields (Walk-In v2)

| Field | Ref | Type |
|-------|-----|------|
| Name | field_1 | short_text |
| Email | field_2 | email |
| Phone | field_3 | phone_number |
| Device type | field_4 | multiple_choice (iPhone/iPad/MacBook/Watch) |
| Specific model | field_5 | dropdown (100+ models) |
| Issue | field_6 | multiple_choice (Screen/Battery/Port/Keyboard/Liquid/Diagnostic/Data Recovery/Other) |
| Reviewed pricing online? | field_7 | yes_no |
| Pricing info (shown if no) | field_8 | statement |
| Issue detail | field_9 | long_text |
| Data backup status | field_10 | multiple_choice |

---

## Slack Notification (On Typeform Submit)

The message should show:

- **Customer name**
- **Device:** specific model from Typeform (e.g. "MacBook Pro 14 M3 Pro/Max A2992")
- **Issue:** from Typeform (e.g. "Screen") + detail description
- **Data backup status** (currently asked but NOT shown in Slack; must be included)
- **Reviewed pricing?** Yes/No
- **Price lookup:** if possible, match device + fault to show the actual price (not just a link to the pricing page; too many combinations for a generic link)
- **Returning customer?** Match name + email against Monday items and Intercom conversations. If they walked in with a MacBook Pro 14" and we discussed that same device last week, link it and show context.
- **Intent:** Are they here to drop off now, or to book in for later? Plus any additional questions they have for the team.

**Goal:** the team has full context before going upstairs to see the customer.

---

## Actions (Buttons on Slack Message)

### 1. ✅ Complete Intake

Same intake form as booked appointments. Opens fields:

| Field | Source | Editable | Monday Column |
|-------|--------|----------|---------------|
| Telephone number | Typeform | Yes | Phone column |
| Email address | Typeform | Yes | Email column |
| Device info | Typeform model | Yes | Item name |
| Fault details | Typeform issue + detail | Yes | Walk-in Notes |
| Passcode | Manual entry | Yes | Passcode column |

Plus:
- Device powering? (Yes/No)
- Passcode checked? (Yes/No)
- Delivery back? (Yes/No; if yes, capture return address)
- Payment taken via SumUp? (Yes/Prepaid/No)
- Additional notes (free text)
- Voice note option (transcribed via Whisper, added as Monday update)

On submit:
- Creates Monday item (if new customer) or updates existing item
- All fields sync to correct Monday columns (field-level, not text dump)
- Normal automations trigger from there

### 2. ❌ Customer Declined

For when:
- Customer sees price and doesn't want to proceed
- Customer goes upstairs, talks to team, changes their mind
- Customer wants to come back later

On click:
- Option to add reason/notes (e.g. "coming back later today", "price too high", "wants to think about it")
- Slack message updates to show they didn't drop off
- Notes captured so Ferrari can follow up by email or call

---

## Customer Matching Logic

When the Typeform submits:
1. Search Monday Main Board by name AND email
2. Search Intercom by email for prior conversations
3. If match found: show in the Slack message with context (device, last repair, status)
4. If returning with the same device + fault discussed previously, link directly to that Monday item

---

## Pricing Lookup

**REMOVED FROM SCOPE** (Ricky, 2026-04-02): Automated pricing lookup is removed from the walk-in flow. Staff quote from memory or check Shopify manually for edge cases. The pricing module was the one component that dragged this from "enhance existing Typeform flow" into "build a full product catalogue integration". The real value is enrichment, intake form, and Monday write-back, not auto-pricing.

---

## Hard Requirements

1. **Data backup status must appear in Slack.** Currently asked in Typeform but not shown.
2. **Field-level sync to Monday.** Same as booked appointments: every field maps to a column.
3. **Customer matching before notification.** Don't just show the Typeform data; check Monday + Intercom first.
4. ~~**Pricing display.**~~ REMOVED (2026-04-02). Staff handle pricing verbally.
5. **Declined flow captured.** Every walk-in that doesn't convert should have a reason logged.

---

## Phase 2 (Later)

- Image upload at intake
- Automated follow-up email/message to declined customers

---

## Architecture Notes

- Typeform webhook triggers n8n workflow
- n8n searches Monday (name + email match) and Intercom (email match)
- n8n does pricing lookup (Shopify product match or reference table)
- n8n posts enriched Slack message with "Complete Intake" and "Customer Declined" buttons
- Button interactions handled via Slack interactivity (Block Kit / external modal)
- Submit writes to Monday via API (column-level updates, creates item if new)
- Declined flow updates Slack message + logs reason
- Voice note → Whisper transcription → Monday update

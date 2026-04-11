# Slack Intake Spec: Booked Appointment Drop-Off

**Written:** 2026-03-31
**Status:** Spec complete, ready for build
**Source:** Ricky voice notes, Mar 31

---

## Overview

When a customer with a booked appointment arrives and fills in the Typeform to say "I'm here", the intake person (Nahid/Andres) should get everything they need in Slack without touching Monday.

---

## Data Source

- Appointment details live on Monday.com (Main Board 349212843), in Today's Repairs
- Customer confirms arrival via Typeform (appointment drop-off form)
- Pre-repair form answers sent to the customer before their visit
- Intercom chat history from booking communications
- Shopify order data (if prepaid)

---

## Part 1: Morning Alert (Daily)

A daily Slack notification listing all appointments booked for that day:
- Customer name
- Time slot
- Device
- Service type (Repair / Diagnostic)

Purpose: team knows what's coming before anyone walks in.

---

## Part 2: Arrival Notification (Triggered by Typeform)

When the customer submits the arrival Typeform, a Slack message posts with:

- **Customer name**
- **Device** (full model from Monday, not just "iPhone" or "MacBook")
- **Service type:** Repair or Diagnostic
- **Summary of discussions:** brief note of what's been discussed with the client
- **Pre-repair form answers:** shown as a snapshot in the message
- **Prepaid status:** check if payment was taken via Shopify in advance
- **Intercom link:** link to original chat thread

The team should not need to open Monday to understand the customer's situation.

---

## Part 3: "Complete Intake" Button

A button on the Slack message that opens an intake form with the following fields:

### Confirm/Edit Fields
| Field | Source | Editable | Monday Column |
|-------|--------|----------|---------------|
| Telephone number | Monday | Yes | Phone column |
| Email address | Monday | Yes | Email column |
| Device info | Monday item name | Yes | Item name |
| Fault details | Pre-repair form / Monday | Yes | Walk-in Notes |
| Passcode | Manual entry | Yes | Passcode column |

### New Fields
| Field | Type | Monday Column |
|-------|------|---------------|
| Device powering? | Yes / No | TBD |
| Passcode checked? | Yes / No | TBD |
| Delivery back? | Yes / No | TBD (service column or status) |
| Return address | Text (if delivery = yes) | TBD |
| Payment taken via SumUp? | Yes / Prepaid / No | TBD |
| Additional notes | Free text | Update on Monday item |

### Voice Note
- Intake person can leave a voice note for additional context
- Voice note is transcribed (Whisper) and added as a Monday update

---

## Part 4: Submit

On submit:
- **All fields sync to Monday columns directly.** Not dumped as a text update.
- If a field was changed (e.g. wrong phone number corrected), the Monday column is updated with the new value.
- Column matching must be exact and verified against the board schema.
- Normal Monday automations trigger from the status/field changes as usual.
- The intake person does not need to go to Monday afterwards. It's done.

---

## Hard Requirements

1. **Field-level sync to Monday.** Every editable field maps to a specific Monday column. Changes update that column, not a free-text update note.
2. **No Monday dependency for the intake person.** Everything happens in Slack.
3. **Prepaid detection.** System checks Shopify order data to flag if payment was already taken.
4. **Existing automations unaffected.** Status changes and downstream workflows continue to fire as normal after Monday is updated.

---

## Phase 2 (Later, Not in This Build)

- Image upload at intake (photos of device condition on arrival)

---

## Architecture Notes

- Typeform submission triggers n8n workflow
- n8n pulls Monday data (device, status, service, customer details, pre-repair form)
- n8n checks Shopify for prepayment
- n8n pulls Intercom link
- n8n posts enriched Slack message with "Complete Intake" button
- Button triggers interactive Slack workflow (Slack Block Kit or external modal)
- Submit writes back to Monday via API (column-level updates)
- Voice note handled via existing Whisper transcription pipeline

---

## Monday Column Mapping (to verify before build)

These need confirming against the live board schema:

| Data | Expected Column ID | Type |
|------|--------------------|------|
| Phone | text5 or similar | Text |
| Email | text5 (email) | Text/Email |
| Passcode | text column | Text |
| Walk-in Notes | text column | Text |
| Service | service | Status |
| Status | status4 | Status |
| Case | status_14 | Status |
| Intercom Link | link1 | Link |
| Received Date | date column | Date |

Builder must verify all column IDs against board 349212843 before implementation.

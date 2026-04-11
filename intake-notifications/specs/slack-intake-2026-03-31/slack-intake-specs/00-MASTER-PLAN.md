# Slack Intake System: Master Plan

**Written:** 2026-03-31
**Owner:** Ricky
**Builder:** Codex
**Status:** Ready for review and build

---

## What This Is

A complete rebuild of how customer arrivals flow from Typeform through to the team via Slack, with the ability to complete intake without touching Monday.com. Four form submission types, one unified architecture.

**The core principle:** the intake person gets everything they need in Slack. They don't open Monday. They don't look anything up. They confirm, complete intake, and submit. Monday gets updated automatically with field-level precision.

---

## The Four Flows

| # | Flow | Trigger | Current State | Work Needed |
|---|------|---------|---------------|-------------|
| 1 | Booked Appointment Drop-Off | Typeform `nNUHw0cK` | Slack shows name only | Major: enrichment + intake buttons |
| 2 | Walk-In (No Appointment) | Typeform `Rr3rhcXc` | Creates Monday item + Intercom ticket | Major: Slack enrichment + intake + pricing |
| 3 | Collection | Typeform `vslvbFQr` | Enriched Slack (broken data) | Cleanup: fix data quality, add collected button |
| 4 | Enquiry | Typeform `NOt5ys9r` | Name + question only | New build: branching form + enriched Slack |

**Router form** (`dvbfUytG`): customer selects drop-off (no appointment), drop-off (confirmed appointment), collect, or enquiry. Routes to the appropriate Typeform.

---

## Shared Components

These are built once and used across multiple flows.

### 1. Customer Matching Engine

Used by: all four flows.

- Search Monday Main Board (349212843) by **email** (primary) and **name** (fallback)
- Search Intercom by **email** for prior conversations
- Return: matched Monday item(s), device, status, repair history, Intercom link
- If multiple matches: flag for manual selection
- If no match: flag clearly (don't silently skip)

### 2. Pricing Lookup

**REMOVED FROM SCOPE** (Ricky, 2026-04-02): Automated pricing lookup dropped from Walk-In and Enquiry flows. Staff quote from experience or check Shopify manually. Removes the dependency on building a product catalogue integration, keeping the project as an enhanced Typeform flow rather than a custom build.

### 3. Slack Interactive Intake Form

Used by: Booked Appointment, Walk-In.

A Slack modal/form triggered by the "Complete Intake" button:

| Field | Type | Editable | Monday Column |
|-------|------|----------|---------------|
| Telephone number | Text | Yes | Phone column |
| Email address | Text | Yes | Email column |
| Device info | Text | Yes | Item name |
| Fault details | Text | Yes | Walk-in Notes |
| Passcode | Text | Yes | Passcode column |
| Device powering? | Yes/No | Yes | TBD |
| Passcode checked? | Yes/No | Yes | TBD |
| Delivery back? | Yes/No | Yes | TBD |
| Return address | Text (conditional) | Yes | TBD |
| Payment status | SumUp taken / Prepaid / Unpaid | Yes | TBD |
| Additional notes | Free text | Yes | Monday update |
| Voice note | Audio | Yes | Whisper → Monday update |

**Critical rule:** every field maps to a specific Monday column. When a value is changed (e.g. wrong phone number corrected), the column is updated directly. No free-text dumping.

### 4. Monday Write-Back

Used by: all flows with buttons.

- Column-level updates via Monday GraphQL API
- Must verify all column IDs against board 349212843 before build
- Status changes must trigger existing Monday automations normally
- If creating a new item (Walk-In, Enquiry Branch B): set all columns correctly from the start

### 5. Voice Note Pipeline

Used by: Booked Appointment, Walk-In.

- Intake person records voice note in Slack
- Audio sent to Whisper for transcription
- Transcription added as a Monday update on the item
- Existing pipeline: `/home/ricky/.local/bin/whisper`

### 6. LLM Summary Endpoint

Used by: Collection (cleanup), potentially Booked Appointment.

- **URL:** `https://mc.icorrect.co.uk/api/summarize-updates` (POST)
- **Model:** gpt-4o-mini
- Currently unreliable (silently fails on most calls)
- Must fix: proper timeout, error logging, reliable fallback
- When it works, produces useful 3-section summaries (client said / what we found / what we did)

---

## Flow 1: Booked Appointment Drop-Off

**Full spec:** `01-booked-appointment-dropoff.md`

### Morning Alert (Daily)
- Post daily list of booked appointments to Slack
- Customer name, time slot, device, service type

### On Arrival (Typeform Submit)
Slack notification with:
- Customer name, device (full model from Monday), service type
- Summary of discussions with client
- Pre-repair form answers (snapshot)
- Prepaid status (Shopify check)
- Intercom link

### Buttons
- **Complete Intake** → shared intake form → Monday write-back
- Voice note support

### n8n Workflow
- Existing: `lTHrOPUnD6naN28p` (active, needs enhancement)
- Add: Shopify prepaid check, pre-repair form data pull, intake button

---

## Flow 2: Walk-In (No Appointment)

**Full spec:** `02-walk-in-no-appointment.md`

### On Typeform Submit
Slack notification with:
- Customer name, device (specific model from Typeform), issue + detail
- Data backup status (currently missing from Slack)
- Reviewed pricing? + actual price lookup (device + fault → price)
- Returning customer match (Monday + Intercom)
- Intent: drop off now or book for later?

### Buttons
- **Complete Intake** → shared intake form → creates/updates Monday item
- **Customer Declined** → reason capture, Slack message update, follow-up notes

### n8n Workflow
- Existing: `kDfU2wWWv207T24J` (active, creates Monday + Intercom items)
- Add: pricing lookup, enriched Slack notification, intake and declined buttons

---

## Flow 3: Collection

**Full spec:** `03-collection.md`

### On Typeform Submit
Slack notification with:
- Customer name, device (full model from Monday), service performed
- Payment status (accurate)
- Accessories to return (correct column, no raw data)
- Monday + Intercom links

### Cleanup Required
- Fix/remove "repair difficulties detected" (fires on 80%+ of notifications)
- Verify "customer chasing/upset" detection accuracy
- Fix accessories: use correct Monday column only, strip raw data
- Fix LLM summary: make it reliable or remove
- Remove all raw labels ("Case column:", "From updates:")

### Buttons
- **Collected** → updates Monday status to Collected/Returned
- **Notes** (optional) → add Monday update

### n8n Workflow
- Existing: `FB83t0dN0PNlEOpd` (active, needs cleanup not rebuild)

---

## Flow 4: Enquiry

**Full spec:** `04-enquiry.md`

### Typeform Changes Required
Add email (required) + branching question:
- 🔄 Update on existing repair → match to Monday item
- 🔧 New repair or quote → device + model + issue + pricing lookup
- 🔁 Warranty / previous repair issue → match to previous repairs
- ❓ General question → brief description

### On Typeform Submit
Slack notification with:
- Customer name, enquiry type badge
- Device (if provided or matched)
- Enquiry detail
- Customer match context (Monday + Intercom)
- Pricing (Branch B only)

### Buttons (vary by branch)
- Branch A: **Answered**
- Branch B: **Book In** / **Customer Declined**
- Branch C: **Handled** / **Rebook**
- Branch D: **Answered**

### n8n Workflow
- New build (no existing workflow for enquiries)

---

## Existing Infrastructure

### n8n Workflows (active)
| Workflow | ID | Status |
|----------|----|--------|
| Collection → Enriched Slack | `FB83t0dN0PNlEOpd` | Cleanup |
| Drop-Off → Enriched Slack | `lTHrOPUnD6naN28p` | Enhance |
| Walk-In → Intercom + Monday | `kDfU2wWWv207T24J` | Enhance |
| Pre-Repair Form → Monday | `AubY0Rvhhvgp4GJ1` | Reference |

### Typeforms
| Form | ID | Changes Needed |
|------|----|----------------|
| Router | `dvbfUytG` | None |
| Booked Appointment | `nNUHw0cK` | None (data comes from Monday) |
| Walk-In v2 | `Rr3rhcXc` | None (already rich) |
| Collection | `vslvbFQr` | None |
| Enquiry | `NOt5ys9r` | Add email + branching |

### Monday.com
- **Main Board:** 349212843
- **Column mapping must be verified before build.** See individual specs for expected columns.
- Key columns: service, status4, status_14 (case), link1 (Intercom), text5 (email/phone), passcode

### Services
- **LLM Summary:** `https://mc.icorrect.co.uk/api/summarize-updates` (port 8004, systemd)
- **Whisper:** `/home/ricky/.local/bin/whisper`
- **Slack channel:** `C09G72DRZC7`

### Credentials
All in `/home/ricky/config/api-keys/.env`:
- `MONDAY_APP_TOKEN` (Monday GraphQL API)
- `TYPEFORM_API_TOKEN` (Typeform API)
- `SHOPIFY_ACCESS_TOKEN` (pricing lookup)
- `SLACK_BOT_TOKEN` / `SLACK_USER_TOKEN`
- `N8N_CLOUD_API_TOKEN` (n8n API)
- `OPENAI_API_KEY` (LLM endpoint)

---

## Build Order (Recommended)

| Phase | Flow | Reasoning |
|-------|------|-----------|
| **Phase 1** | Collection cleanup | Lowest effort, highest immediate impact. Fix data quality on an existing working flow. |
| **Phase 2** | Booked Appointment enrichment | High value: most common scenario, data already exists on Monday, just needs surfacing. |
| **Phase 3** | Walk-In enhancement | Builds on Phase 2 intake form. Adds pricing lookup + declined flow. |
| **Phase 4** | Enquiry (new build) | Requires Typeform changes + new n8n workflow. Most complex. |

Shared components (customer matching, intake form, Monday write-back) should be built as reusable modules during Phase 1-2 so Phase 3-4 can reuse them.

---

## Hard Rules (Apply to All Flows)

1. **Field-level sync to Monday.** No free-text dumping. Every field maps to a column.
2. **No raw labels in Slack.** No "Case column:", "From updates:", Intercom URL fragments.
3. **Customer matching on every flow.** Always check Monday + Intercom by email.
4. **Device model from Monday** (not Typeform generic dropdown) when a Monday item exists.
5. **Every interaction gets a resolution.** Buttons ensure nothing is left open.
6. **Existing automations unaffected.** Monday status changes continue to trigger downstream workflows.
7. **Pricing is a lookup, not a link.** Device + fault → specific price.

---

## Phase 2 (Later, Not in This Build)

- Image upload at intake (photos of device condition)
- Automated follow-up to declined customers
- Replace Typeform with custom React intake form (saves £70/month)

---

## Reference Files

| File | Purpose |
|------|---------|
| `01-booked-appointment-dropoff.md` | Full spec: booked appointments |
| `02-walk-in-no-appointment.md` | Full spec: walk-ins |
| `03-collection.md` | Full spec: collections |
| `04-enquiry.md` | Full spec: enquiries |
| `../slack-notifications-brief.md` | Original Phase 1 brief (Mar 16) |
| `/home/ricky/builds/intake-system/docs/staged/2026-03-31/intake-process-v2.md` | Walk-in intake process design (Mar 9) |
| `repo/documentation/raw-imports/n8n-automations.md` | n8n architecture reference |

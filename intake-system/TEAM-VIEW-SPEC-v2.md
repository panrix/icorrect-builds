# Team Intake View: CRM Spec (v2)

**Created:** 2026-04-11
**Supersedes:** `TEAM-VIEW-SPEC.md` (v1, queue + gates only)
**Owner:** Ricky
**Status:** Draft for review

---

## Vision

This is not just a queue. It's the CRM card that staff see before walking upstairs to greet a customer. When an operator opens an intake, they should be able to say: "Hey Mr. Robinson, thanks for the third repair. How was your daughter's screen replacement last time?" Every piece of context the customer has given us, every conversation we've had, every repair we've done: visible in one place.

## Architecture

- Same React app as client form, served from `intake.icorrect.co.uk/team`
- `/team` route protected by nginx basic auth
- Supabase Realtime subscription for live queue updates
- All mutations through backend API
- iPad landscape primary, information-dense operator tool

---

## Screen 1: Intake Queue

The landing page. Shows today's intake submissions in Europe/London business day.

```
┌──────────────────────────────────────────────────────────────────┐
│  iCorrect Intake                             Today: 11 Apr 2026 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ● NEW  John Smith  iPhone 15 Pro  Screen  10:32am  🔄 x3  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ◐ WIP  Sarah Lee   MacBook Air    Battery 10:15am         │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ✓ DONE Mike Chen   iPad Pro       Charging 09:48am        │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ● NEW  Emma Wilson  Enquiry: iPhone screen  10:41am  🔄   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  4 intakes today                     [ Hide completed ]          │
└──────────────────────────────────────────────────────────────────┘
```

### Queue Changes from v1

- **Returning customer badge:** 🔄 icon with repair count shown on queue row. Staff can see at a glance who's been before.
- **Flow type icon:** Small icon indicating appointment/walk-in/collection/enquiry.
- **Collection ready flag:** If collection customer said "No" to ready confirmation, row shows ⚠️ so staff check before retrieving.

### Data

- **Source:** `GET /api/intake/today` on load, then Supabase Realtime on `intake_sessions` INSERT/UPDATE
- **Columns:** Status badge, customer name, device + fault (or flow summary), flow type icon, time submitted, returning customer badge
- **Sort:** `submitted` first (newest at top), then `in_progress`, then `completed`/`declined` (muted)

### Status badges

| API status | Display | Colour |
|------------|---------|--------|
| `submitted` | NEW | Blue (`#0071E3`) |
| `in_progress` | IN PROGRESS | Amber (`#F59E0B`) |
| `completed` | COMPLETED | Green (`#34A853`) |
| `declined` | DECLINED | Grey (`#999`) |

### Behaviour

- New submissions appear at top without refresh (Supabase Realtime INSERT)
- Status changes reflect in real-time (Realtime UPDATE)
- Tap any row to open detail view
- Toggle "Hide completed" filters out `completed`/`declined` rows

---

## Screen 2: Intake Detail (Walk-In / Appointment)

This is the core CRM card. Five sections, each with a clear purpose.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Queue                                          ● NEW         │
│                                                                  │
│  John Smith — iPhone 15 Pro Max                                  │
│  Screen Damage · Walk-in · 10:32am                               │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 👤 CUSTOMER PROFILE                    Customer since 2024  ║ │
│  ║                                                             ║ │
│  ║ Name:  John Smith  [✎]     3 previous repairs               ║ │
│  ║ Email: john@x.com  [✎]     Last: Screen, iPhone 14 Pro     ║ │
│  ║ Phone: 07712...    [✎]           Jan 2026 · Completed       ║ │
│  ║                              Before: Battery, iPhone 12     ║ │
│  ║ Type: End user                      Sep 2024 · Completed    ║ │
│  ║                              Before: Screen, iPhone 12      ║ │
│  ║ Monday → Intercom →                 Mar 2024 · Completed    ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 💬 RECENT CONVERSATIONS                                    ║ │
│  ║                                                             ║ │
│  ║ 2 Apr: "Asked about screen repair pricing for 15 Pro Max"  ║ │
│  ║ 28 Mar: "Enquired about turnaround, mentioned travelling"  ║ │
│  ║                                                  View all → ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 📋 WHAT THE CUSTOMER TOLD US                               ║ │
│  ║                                                             ║ │
│  ║ Issue: "Dropped it face down on concrete yesterday,        ║ │
│  ║         screen is cracked and has lines"                    ║ │
│  ║                                                             ║ │
│  ║ Repaired before: Yes — "Screen replaced at another shop    ║ │
│  ║                         6 months ago"                       ║ │
│  ║ Apple seen: No                                              ║ │
│  ║ Purchased: New                                              ║ │
│  ║ Other issues: "Speaker sounds a bit muffled"               ║ │
│  ║ Data backed up: Yes                                         ║ │
│  ║ Data important: Yes, preserve                               ║ │
│  ║ Software update: OK to update                               ║ │
│  ║ Passcode: 1847 ✓                                           ║ │
│  ║ Delivery: I'll collect                                      ║ │
│  ║ Pricing acknowledged: Yes                                   ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ ✅ INTAKE CHECKS                                           ║ │
│  ║                                                             ║ │
│  ║ ☐ Passcode verified    [Verify →]  (pre-filled: 1847)     ║ │
│  ║ ☐ Parts available      [Check →]                           ║ │
│  ║ ☐ Turnaround confirmed [Confirm →]                        ║ │
│  ║ ✓ Fields complete (auto)                                   ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 📝 OPERATOR NOTES                                 [+ Add]  ║ │
│  ║ (No notes yet)                                              ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│       [ Complete Intake ]                    [ Decline ]         │
└──────────────────────────────────────────────────────────────────┘
```

---

### Section 1: Customer Profile (top)

**Purpose:** "Who is this person to us?"

**Data sources:**
- Customer lookup by email against Monday (all groups, historical)
- Intercom contact lookup
- Supabase repair_history table (1,889+ items already imported)

**Displays:**
- Name, email, phone (editable via [✎])
- **Customer since:** Earliest known repair date
- **Total repair count:** "3 previous repairs"
- **Repair timeline:** Last 3-5 repairs, each showing: device, service, date, outcome
- **Customer type:** End user / Corporate (with company name if corporate)
- **Links:** "Monday →" (opens most recent Monday item), "Intercom →" (opens contact)

**New customer variant:** If no history found:
```
👤 NEW CUSTOMER
Name: Emma Wilson  [✎]
Email: emma@x.com  [✎]
Phone: 07...       [✎]

First time with us
```

**Corporate customer variant:** If corporate account detected:
```
👤 CORPORATE: Great Portland Estates
Name: Jose Neto  [✎]
Email: jose@gpe.co.uk  [✎]

5 devices serviced for this company
Passcode policy: Pre-agreed (do not re-ask)
Account contact: jose@gpe.co.uk
```

---

### Section 2: Recent Conversations (conditional)

**Purpose:** "What have we already talked about with this person?"

**Data source:** Intercom conversations for this contact, last 30 days. LLM-summarised to one line each.

**Displays:**
- Date + one-line summary of each recent conversation
- "View all →" link opens Intercom contact in new tab
- Max 3 conversations shown, most recent first

**If no conversations:** Section hidden entirely.

**If Intercom unavailable:** Section shows "Conversation history unavailable" with muted text. Does not block intake.

---

### Section 3: What The Customer Told Us

**Purpose:** "Everything the customer entered on the form, in one place."

**Displays all pre-repair answers:**
- Issue description (the "tell us more" free text; shown prominently at top)
- Repaired before + detail
- Apple/service provider seen + detail
- Purchase condition (new/refurb/secondhand)
- Other issues noticed
- Data backed up
- Data importance (preserve / not important)
- Software update permission
- Passcode (shown in plain text for operator verification)
- Delivery preference
- Pricing acknowledged

**Appointment variant:** Shows confirmed booking details + any corrections flagged + additional notes from the customer.

**All display-only.** These are the customer's answers. Operator corrections go in notes or field edits.

---

### Section 4: Intake Checks

Same gates as v1, with one improvement: **passcode field is pre-filled** from the customer's form answer.

#### Passcode Gate → [Verify →]

Opens inline form:
```
Passcode: [1847________]  (pre-filled from customer form)
Password: [____________]  (MacBook only, pre-filled if provided)

○ Tested on device — unlocked OK
○ Recorded verbally (not tested yet)
○ Customer will provide later

Notes: [________________]

[ Cancel ]       [ Confirm ✓ ]
```

- "Tested on device" = `passed: true` (best outcome: verified working)
- "Recorded verbally" = `passed: true` (have a code, not yet tested)
- "Customer will provide later" = `passed: false` (gate stays unchecked)
- On confirm, passcode is written to Monday `text8` column

#### Parts Gate → [Check →]

Same as v1. Shows device + service for context.
- "Parts in stock" = `passed: true`
- "Parts need ordering (ETA: ___)" = `passed: true` (with ETA)
- "Not sure" = `passed: false`

Future: live stock check via parts service integration.

#### Turnaround Gate → [Confirm →]

Same as v1. Shows estimated turnaround from pricing data.
- "Confirmed with customer" = `passed: true`
- "Different turnaround agreed: ___" = `passed: true`

#### Fields Complete (auto)

System validates: name, email, device, fault, passcode, fault description all present. Auto-checks. Shows what's missing in red if incomplete.

---

### Section 5: Operator Notes

Same as v1. Chronological list. Each note pushed to Monday as item update.

---

### Actions

**Complete Intake**
- Enabled only when all 4 gates pass
- Triggers: `POST /api/intake/:id/complete`
- Monday effects:
  - Walk-in: `status4` → 'Received' (item in Today's Repairs)
  - Appointment: move from Incoming Future to Today's Repairs, `status4` → 'Received'
- Success: toast + return to queue

**Decline**
- Always available. Opens reason modal.
- Triggers: `POST /api/intake/:id/decline`
- Monday: update posted if item linked

---

## Screen 2 Variant: Collection Detail

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Queue                                          ● NEW         │
│                                                                  │
│  John Smith — Collecting iPhone 15 Pro                           │
│  10:32am                                                         │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 👤 CUSTOMER PROFILE                    Customer since 2024  ║ │
│  ║ Name: John Smith          2 previous repairs                ║ │
│  ║ Email: john@x.com         Collecting: iPhone 15 Pro Screen  ║ │
│  ║                                                             ║ │
│  ║ Ready confirmation: Yes ✓                                   ║ │
│  ║ Questions: "Is there a warranty on the screen?"             ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 📝 NOTES                                          [+ Add]  ║ │
│  ║ (No notes yet)                                              ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│                    [ Collected ✓ ]                                │
└──────────────────────────────────────────────────────────────────┘
```

- Shows customer profile (returning customer context even for collections)
- **Ready confirmation status** prominent: ✓ Yes / ⚠️ No / ? Not sure
- If ⚠️: amber banner "Customer hasn't received a ready confirmation. Check device status before retrieving."
- Questions displayed if provided
- Single action: Collected
- Notes available for staff to record anything discussed

---

## Screen 2 Variant: Enquiry Detail

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Queue                                          ● NEW         │
│                                                                  │
│  Emma Wilson — Enquiry                                           │
│  iPhone · Screen Damage · 10:41am                                │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 👤 CUSTOMER PROFILE                        New customer     ║ │
│  ║ Name: Emma Wilson                                           ║ │
│  ║ Email: emma@x.com                                           ║ │
│  ║ Device: iPhone · Screen Damage                              ║ │
│  ║ Detail: "Screen cracked, wondering about pricing"           ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════════╗ │
│  ║ 📝 NOTES                                          [+ Add]  ║ │
│  ║ (No notes yet)                                              ║ │
│  ╚══════════════════════════════════════════════════════════════╝ │
│                                                                  │
│       [ Handled ✓ ]                        [ Book In → ]        │
└──────────────────────────────────────────────────────────────────┘
```

- Shows customer profile (even for enquiries, helps staff see if they're already a customer)
- Notes for recording what was discussed
- **Handled:** enquiry answered, customer left
- **Book In →** creates Monday item, marks as completed

---

## Backend Changes Required

### New/Modified API Endpoints

**`GET /api/customer/lookup?email=...`** (expanded from v1)

Must now return full `CustomerProfile`:
```json
{
  "isReturningCustomer": true,
  "totalRepairCount": 3,
  "customerSince": "2024-03-15",
  "recentRepairs": [
    {
      "mondayItemId": "12345",
      "deviceCategory": "iPhone",
      "model": "iPhone 14 Pro",
      "service": "Screen Repair",
      "status": "Completed",
      "receivedDate": "2026-01-10",
      "completedDate": "2026-01-10"
    }
  ],
  "activeIntercomConversations": [
    {
      "conversationId": "abc123",
      "intercomLink": "https://app.intercom.com/...",
      "subject": "Screen repair pricing",
      "lastMessageAt": "2026-04-02T14:30:00Z",
      "summary": "Asked about screen repair pricing for iPhone 15 Pro Max"
    }
  ],
  "linkedMondayItems": [],
  "intercomContactLink": "https://app.intercom.com/contacts/...",
  "customerType": "end_user",
  "corporateAccount": null
}
```

**Data sources for customer lookup:**
1. Monday board `349212843`: search all groups by email for repair history
2. Intercom: contact lookup + recent conversations (last 30 days)
3. Supabase `repair_history`: supplement Monday data where available
4. LLM summary service: summarise Intercom conversations to one-liners

**Performance:** This lookup can be slow (Monday + Intercom + LLM). For walk-in/collection/enquiry flows, it fires in background after identity submission. For appointment flow, it's the primary action (spinner shown). Team view can lazy-load the customer profile section.

### Passcode Write-Back

When operator confirms passcode verification, backend writes to Monday column `text8` (Passcode). This replaces the current manual process of the operator typing it into Monday.

### Form Data Storage

`IntakeFormData` in `form_data` JSONB on `intake_sessions` now includes all v3 fields. No schema migration needed (JSONB is flexible), but the `shared/types.ts` contract must be updated.

---

## Data Flow Summary

```
Client form submit
  → Backend: customer lookup by email (async, best-effort)
  → Supabase INSERT (status: submitted, form_data includes all answers)
  → Monday: create item (walk-in/enquiry) or link booking (appointment)
  → Realtime → team queue adds row (with returning customer badge if found)

Operator taps row
  → PATCH status → in_progress, claimedBy
  → GET /api/intake/:id (includes customer profile)
  → Render CRM card: profile, conversations, form answers, gates

Operator verifies passcode
  → POST /api/intake/:id/checks (passcode_verified, with passcode in notes)
  → Write passcode to Monday text8 column
  → Gate updates in UI

Operator completes intake
  → POST /api/intake/:id/complete
  → All 4 gates verified
  → Monday: status4 → Received, group move if needed
  → Tech receives: complete package (device, fault, cause, history, passcode,
    data preference, software preference, other issues, turnaround, parts status)
```

---

## Acceptance Criteria

### Queue
- [ ] Queue shows today's intakes with returning customer badge
- [ ] New submissions appear in real-time
- [ ] Collection rows show ⚠️ if customer hasn't confirmed ready

### Customer Profile
- [ ] Returning customers show: repair count, timeline, customer-since date
- [ ] New customers show "First time with us"
- [ ] Corporate customers show company name + passcode policy note
- [ ] Monday and Intercom links open in new tab

### Conversations
- [ ] Recent Intercom conversations shown as one-line summaries
- [ ] Section hidden when no conversations found
- [ ] Graceful degradation when Intercom unavailable

### Form Answers
- [ ] All pre-repair answers displayed (issue detail, repair history, Apple seen, purchase condition, other issues, backup, data importance, software permission, passcode, delivery)
- [ ] Passcode shown in plain text for operator verification

### Intake Gates
- [ ] Passcode gate pre-filled from customer's form answer
- [ ] Passcode written to Monday on verification
- [ ] All 4 gates required for completion
- [ ] Version conflict handling (409)

### Collection
- [ ] Collection shows customer profile
- [ ] Ready confirmation status prominent with warning if not confirmed
- [ ] Single "Collected" action

### Enquiry
- [ ] Enquiry shows customer profile
- [ ] "Book In" creates Monday item

### Cross-Cutting
- [ ] iPad landscape optimised
- [ ] npm build/lint/test pass
- [ ] Customer lookup degrades gracefully if Monday or Intercom API is slow/down

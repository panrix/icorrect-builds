# Team Intake View — Detailed Spec (v1)

**Created:** 2026-04-08
**Owner:** Ricky + Code
**Status:** Ready for QA
**Depends on:** `plan.md` Phase 3, API contracts in `plan.md` section 0E

---

## What This Is

iPad-first interface for front-desk staff (Andres) to manage incoming customer intake submissions. When a customer submits the client form, this view shows it, lets the operator verify details, run physical checks, and release the device into the repair queue.

**Scope for v1:** Intake management only. The operator does physical checks (passcode testing, parts lookup, turnaround confirmation) outside the app. The app records that checks happened via structured gate forms.

**Not in v1:** Guided step-by-step operator workflow, pre-check evidence capture, diagnostic branching, ammeter readings, intake photos, parts service integration, offline support, push notifications.

---

## Architecture

- Same React app as client form, served from `intake.icorrect.co.uk/team`
- `/team` route protected by nginx basic auth
- Supabase Realtime subscription for live queue updates
- All mutations through backend API (`plan.md` section 0E)
- iPad landscape primary

---

## Screen 1: Intake Queue

The landing page. Shows today's intake submissions in Europe/London business day.

```
┌──────────────────────────────────────────────────────────────────┐
│  iCorrect Intake                             Today: 8 Apr 2026  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ● NEW    John Smith     iPhone 15 Pro  Screen     10:32am │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ◐ IN PROGRESS  Sarah Lee  MacBook Air  Battery    10:15am │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ✓ COMPLETED    Mike Chen  iPad Pro     Charging   09:48am │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ● NEW    Emma Wilson     Enquiry: iPhone screen   10:41am │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  4 intakes today                     [ Hide completed ]          │
└──────────────────────────────────────────────────────────────────┘
```

### Data

- **Source:** `GET /api/intake/today` on load, then Supabase Realtime on `intake_sessions` INSERT/UPDATE
- **Columns:** Status badge, customer name, device + fault (or flow summary), flow type icon, time submitted
- **Sort:** `submitted` first (newest at top), then `in_progress`, then `completed`/`declined` (muted)

### Status badges

| API status | Display label | Colour |
|------------|--------------|--------|
| `submitted` | NEW | Blue (`#0071E3`) |
| `in_progress` | IN PROGRESS | Amber (`#F59E0B`) |
| `completed` | COMPLETED | Green (`#34A853`) |
| `declined` | DECLINED | Grey (`#999`) |

### Behaviour

- New submissions appear at top without refresh (Supabase Realtime INSERT)
- Status changes reflect in real-time (Realtime UPDATE)
- Tap any row → Screen 2 (detail view)
- Toggle "Hide completed" → filters out `completed`/`declined` rows
- Completed/declined rows have muted text and faded background

---

## Screen 2: Intake Detail (Walk-In / Appointment)

Full view for drop-off and appointment intakes. This is where the operator does their work.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Queue                                          ● NEW         │
│                                                                  │
│  John Smith — iPhone 15 Pro                                      │
│  Screen Damage · Walk-in · 10:32am                               │
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐│
│  │ CUSTOMER DETAILS        │  │ WHAT THE CUSTOMER TOLD US      ││
│  │                         │  │                                ││
│  │ Name:  John Smith  [✎]  │  │ Repaired before: No            ││
│  │ Email: john@x.com  [✎]  │  │ Apple seen: No                 ││
│  │ Phone: 07712...    [✎]  │  │ Data backed up: Yes            ││
│  │                         │  │ Delivery pref: Collect          ││
│  │ Device: iPhone 15 Pro   │  │ Pricing acknowledged: Yes      ││
│  │ Fault:  Screen Damage   │  │ Desc: "Cracked from a drop"   ││
│  │                         │  │                                ││
│  └─────────────────────────┘  └────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐│
│  │ 🔄 RETURNING CUSTOMER   │  │ INTAKE CHECKS                  ││
│  │                         │  │                                ││
│  │ 2 previous repairs      │  │ ☐ Passcode      [Verify →]    ││
│  │ Last: Screen, Jan 2026  │  │ ☐ Parts          [Check →]    ││
│  │                         │  │ ☐ Turnaround    [Confirm →]   ││
│  │ Monday →  Intercom →    │  │ ✓ Fields complete (auto)      ││
│  └─────────────────────────┘  └────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ NOTES                                              [+ Add]  ││
│  │ (No notes yet)                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│       [ Complete Intake ]                    [ Decline ]         │
└──────────────────────────────────────────────────────────────────┘
```

### Section: Customer Details (top-left)

- Name, email, phone — each with [✎] edit button
- Tap [✎] → inline edit field replaces text, with Save/Cancel
- Save triggers `PATCH /api/intake/:id` with `version` → updates Supabase + Monday column
- Device, model, fault, description — display only
- If operator needs to correct device/fault, they add a note instead

### Section: What The Customer Told Us (top-right)

- Pre-repair answers from client form (walk-in Flow B only)
- Repaired before, Apple seen, data backed up, delivery preference, pricing acknowledged
- Fault description if provided
- All display-only — these came from the customer
- **Appointment variant:** Shows "Confirmed by customer" or "Customer flagged corrections" with amber highlight if corrections flagged

### Section: Returning Customer (bottom-left, conditional)

- Only shown if backend `isReturningCustomer = true`
- Shows: prior repair count, most recent repair (device + service + date)
- Links: "Monday →" opens Monday item in new tab, "Intercom →" opens conversation
- If no prior history: section hidden entirely

### Section: Intake Checks (bottom-right)

Each gate has a button that opens a structured mini-form (not just a checkbox). This records *what* was checked, not just *that* it was checked.

#### Passcode Gate → [Verify →]

Opens inline form:
```
┌────────────────────────────────────┐
│  Passcode Verification             │
│                                    │
│  Passcode: [_________________]     │
│                                    │
│  ○ Tested on device — unlocked OK  │
│  ○ Recorded verbally (not tested)  │
│  ○ Customer will provide later     │
│                                    │
│  Notes: [_________________]        │
│                                    │
│  [ Cancel ]       [ Confirm ✓ ]    │
└────────────────────────────────────┘
```

- Passcode field: text input (stored in notes, NOT sent to Monday passcode column — operator does that manually or we write to `text8` if confirmed)
- Verification method: radio buttons
- "Tested on device" = `passed: true`
- "Recorded verbally" = `passed: true` (with method noted)
- "Customer will provide later" = `passed: false` (gate stays unchecked)
- Notes: optional free text
- Confirm → `POST /api/intake/:id/checks` with `{ checkType: 'passcode_verified', passed: true/false, operatorName, notes: 'Method: tested on device. Passcode: 1234' }`

#### Parts Gate → [Check →]

Opens inline form:
```
┌────────────────────────────────────┐
│  Parts Availability                │
│                                    │
│  Device: iPhone 15 Pro             │
│  Service: Screen Repair            │
│                                    │
│  ○ Parts in stock                  │
│  ○ Parts need ordering (ETA: ___)  │
│  ○ Not sure — need to check        │
│                                    │
│  Notes: [_________________]        │
│                                    │
│  [ Cancel ]       [ Confirm ✓ ]    │
└────────────────────────────────────┘
```

- Shows device + service for context
- "Parts in stock" = `passed: true`
- "Parts need ordering" = `passed: true` (with ETA in notes — doesn't block intake, just records the situation)
- "Not sure" = `passed: false` (gate stays unchecked)
- Future: integrate with parts service for live stock check

#### Turnaround Gate → [Confirm →]

Opens inline form:
```
┌────────────────────────────────────┐
│  Turnaround Confirmation           │
│                                    │
│  Estimated turnaround:             │
│  Screen Repair — Same day          │
│  (from pricing data)               │
│                                    │
│  ○ Confirmed with customer         │
│  ○ Different turnaround agreed:    │
│    [_________________]             │
│                                    │
│  [ Cancel ]       [ Confirm ✓ ]    │
└────────────────────────────────────┘
```

- Shows estimated turnaround from pricing data (same static JSON as client form)
- "Confirmed with customer" = `passed: true`
- "Different turnaround agreed" = `passed: true` (with actual turnaround in notes)
- Both options pass the gate — operator has confirmed with the customer either way
- Confirm → `POST /api/intake/:id/checks`

#### Fields Complete (auto-check)

- System checks: name present, email present, device present, fault present (for walk-in/appointment)
- Auto-checked — no operator action needed
- If fields are missing (shouldn't happen if client form validated), shows what's missing in red
- Cannot be manually toggled

### Section: Notes (full width)

- Chronological list of operator notes
- Each shows: operator name, timestamp, text
- [+ Add] → opens notes modal (Screen 4)
- Notes are written to Monday as item updates via `POST /api/intake/:id/notes`

### Actions (bottom)

**Complete Intake**
- Enabled only when all 4 gates are checked (green)
- Disabled state: greyed out, tooltip shows "Complete these checks first: [list of unchecked gates]"
- Triggers `POST /api/intake/:id/complete { version, operatorName }`
- If backend returns 400 (gates not passed): show which gates failed
- If backend returns 409 (version conflict): "Updated by someone else — refreshing..."
- Success: toast "Intake complete — John Smith's iPhone 15 Pro is in the queue" → return to queue
- Monday side effects:
  - Walk-in: `status4` → 'Received' (item already in Today's Repairs)
  - Appointment: move from Incoming Future to Today's Repairs + `status4` → 'Received'

**Decline**
- Always enabled (can decline at any point)
- Opens decline reason modal (Screen 5)
- Triggers `POST /api/intake/:id/decline { version, operatorName, reason }`
- Success: toast "Intake declined" → return to queue

### First open behaviour

When operator first opens a `submitted` session, the frontend sends `PATCH /api/intake/:id { status: 'in_progress', claimedBy: 'Andres', version }`. This is advisory — marks it amber in the queue so other operators can see someone is working on it.

---

## Screen 2 Variant: Collection Detail

Simplified view for collection submissions (Flow C).

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Queue                                          ● NEW         │
│                                                                  │
│  John Smith — Collecting iPhone 15 Pro                           │
│  10:32am                                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Name:  John Smith                                           ││
│  │ Email: john@example.com                                     ││
│  │ Device: iPhone                                              ││
│  │                                                             ││
│  │ Questions: "Is there a warranty on the screen repair?"      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│                    [ Collected ✓ ]                                │
└──────────────────────────────────────────────────────────────────┘
```

- No intake gates (nothing to verify — just collecting a finished device)
- No Monday write-back (staff-assisted matching)
- Single action: **Collected** → `POST /api/intake/:id/complete { version, operatorName }`
- Success: toast "Marked as collected" → return to queue

---

## Screen 2 Variant: Enquiry Detail

Simplified view for enquiry submissions (Flow D).

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Queue                                          ● NEW         │
│                                                                  │
│  Emma Wilson — Enquiry                                           │
│  iPhone · Screen Damage · 10:41am                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Name:  Emma Wilson                                          ││
│  │ Email: emma@example.com                                     ││
│  │ Device: iPhone                                              ││
│  │ Fault:  Screen Damage                                       ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ NOTES                                              [+ Add]  ││
│  │ (No notes yet)                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│       [ Handled ✓ ]                        [ Book In → ]        │
└──────────────────────────────────────────────────────────────────┘
```

- No intake gates
- Notes section available (operator can record what was discussed)
- Two actions:
  - **Handled** → marks session as `completed`. Enquiry answered, customer left.
  - **Book In →** → creates Monday item in New Orders (`new_group77101__1`) with customer details + device + fault, then marks session as `completed`. Toast: "Booked in — Monday item created"

---

## Screen 3: Edit Field Inline

Not a separate screen — replaces the field text in-place.

```
  Name: [John Smith________] [Save] [Cancel]
```

- Appears when operator taps [✎] on name, email, or phone
- Pre-filled with current value
- Save → `PATCH /api/intake/:id { version, customerName: '...' }`
- If 409 conflict: "Updated by someone else — refreshing..."
- Cancel → revert to display mode

---

## Screen 4: Add Note Modal

```
┌─────────────────────────────────────┐
│  Add Note                           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Type your note here...        │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Cancel ]           [ Save Note ] │
└─────────────────────────────────────┘
```

- Text area, required (Save disabled when empty)
- Save → `POST /api/intake/:id/notes { operatorName, text }`
- Side effect: creates Monday item update on the linked item
- Close on save, note appears in notes list

---

## Screen 5: Decline Reason Modal

```
┌─────────────────────────────────────┐
│  Decline Intake                     │
│                                     │
│  Why is this being declined?        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Customer changed their mind   │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Cancel ]        [ Confirm ]      │
└─────────────────────────────────────┘
```

- Reason text required
- Confirm → `POST /api/intake/:id/decline { version, operatorName, reason }`
- Side effect: updates Monday item if linked

---

## Data Flow Summary

```
Client form submit
  → Supabase INSERT (status: submitted)
  → Realtime → team queue adds row

Operator taps row
  → PATCH status → in_progress, claimedBy (advisory)
  → GET /api/intake/:id
  → GET /api/customer/lookup?email=...
  → Render detail view

Operator edits field
  → PATCH /api/intake/:id { version, field }
  → Supabase + Monday updated
  → UI refreshes with new version

Operator completes gate check
  → POST /api/intake/:id/checks { checkType, passed, operatorName, notes }
  → intake_checks row created
  → UI updates gate checkbox

Operator completes intake
  → POST /api/intake/:id/complete { version, operatorName }
  → Backend: verify all 4 gates passed
  → Supabase: status → completed
  → Monday: status4 → Received, group move if appointment
  → Realtime → queue row turns green
  → Toast + return to queue

Operator declines
  → POST /api/intake/:id/decline { version, operatorName, reason }
  → Supabase: status → declined
  → Monday: updated if linked
  → Realtime → queue row turns grey
  → Toast + return to queue
```

---

## API Endpoints Used

All contracts defined in `plan.md` section 0E.

| Endpoint | Used by |
|----------|---------|
| `GET /api/intake/today` | Queue (initial load) |
| `GET /api/intake/:id` | Detail view |
| `GET /api/customer/lookup?email=...` | Returning customer context |
| `PATCH /api/intake/:id` | Edit fields, claim session |
| `POST /api/intake/:id/notes` | Add operator notes |
| `POST /api/intake/:id/checks` | Record gate check results |
| `POST /api/intake/:id/complete` | Complete intake |
| `POST /api/intake/:id/decline` | Decline intake |

---

## Design Notes

- Same design system as client form (`DESIGN-SPEC.md` colours, typography)
- More information-dense than client form — this is an operator tool
- Cards with clear section headers and generous padding
- Touch-friendly on iPad (min 44px tap targets) but optimised for scanning
- Gate check buttons should feel satisfying — clear visual transition from unchecked to checked
- Status colours: blue (new), amber (in progress), green (completed), grey (declined)
- Completed/declined rows in queue are visually muted (lower opacity, no hover state)

---

## Acceptance Criteria

- [ ] Queue shows today's intakes, sorted by status then time
- [ ] New submissions appear in real-time without refresh
- [ ] Status changes reflect in real-time across queue
- [ ] Walk-in/appointment detail shows all customer data + repair context
- [ ] Returning customer section shows prior repair count + links
- [ ] Operator can edit name, email, phone → Monday write-back
- [ ] Passcode gate: structured form with verification method + passcode field
- [ ] Parts gate: structured form with stock status + optional ETA
- [ ] Turnaround gate: structured form with confirmation + optional override
- [ ] Fields complete gate auto-checks based on required data
- [ ] Complete button disabled until all 4 gates pass
- [ ] Complete triggers Monday status update + group move (appointment only)
- [ ] Decline captures reason
- [ ] Notes create Monday item updates
- [ ] Collection detail has single "Collected" action
- [ ] Enquiry detail has "Handled" + "Book In" actions
- [ ] Book In creates Monday item in New Orders
- [ ] Version conflicts handled gracefully (409 → refresh)
- [ ] Works on iPad landscape
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

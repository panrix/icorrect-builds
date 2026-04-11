# Intake System — Build Plan (v2)

**Created:** 2026-04-08
**Revised:** 2026-04-08 (progress update)
**Owner:** Ricky + Code
**Status:** Building — Phase 0-2 complete (mocked), UI redesign complete, triage system in progress

---

## Context

iCorrect's intake runs through Typeform (client-facing, £70/month) and broken n8n→Slack notifications (team-facing). Both need replacing with a single custom system.

A React prototype exists at `react-form/` — a useful UI seed for the client form, but built as a linear 10-step wizard with no backend. The plan requires a branching flow engine, backend service, data layer, and team interface that do not exist yet.

**This document is now the canonical scope definition.** It supersedes:
- `SPEC.md` sections 9-10 (MVP scope and phasing) — will be updated to match
- `FORM-FLOW.md` — will be rewritten to match the four flows below
- `DESIGN-SPEC.md` section "Phase 1 Prototype" — will be updated
- `builds/intake-notifications/plan.md` — scrapped, this project replaces it

What remains valid from existing docs:
- `SPEC.md` sections 1-3, 5, 7-8 (problem statement, architecture direction, hard gates, device flows, Monday mapping, tech architecture)
- `SPEC.md` section 4 — partially valid (4 questions explicitly deferred, see strikethroughs in file)
- `SPEC.md` section 6 — updated to match plan's persistence model (intake_responses dropped, photos/turnaround deferred)
- `DESIGN-SPEC.md` brand identity, colours, typography
- `integrations.md` integration touchpoints
- `device-flows/*.md` decision trees
- `flows/*.md` operator flow docs (team-view reference)

---

## Decisions Made (2026-04-08)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canonical scope | `plan.md` (this doc) | SPEC.md MVP was MacBook-only; real need is four flows |
| Backend stack | Node.js + Express | All VPS services are Node.js; reuse Monday/Slack/LLM code directly |
| Appointment data source | Monday (Incoming Future group) | Booking items live in Monday, lookup by email |
| Quote email transport | Intercom | Create/update contact, send via Intercom email |
| Client form domain | `intake.icorrect.co.uk` | Dedicated, professional |
| Team view device | iPad-first | Andres/front desk uses iPad |
| Pricing lookup | Static JSON (no automated API lookup) | Pricing *confirmation* is in walk-in flow, not dynamic lookup |
| Walk-in Monday group | Today's Repairs (`new_group70029`) | Customer is dropping off same-day |
| Pilot strategy | Direct cutover (no parallel run) | Avoids duplicate Monday items; Typeform off when new system goes live |
| Team view auth | nginx basic auth | Matches mc.icorrect.co.uk pattern; simplest for iPad |
| Collection lookup | Staff-assisted (no backend lookup) | Form captures identity; staff matches manually. Lookup deferred. |

---

## The Four Client Flows

### Flow A: Booked Appointment Drop-Off

Customer has already booked and is arriving to drop off.

```
Welcome → "I have an appointment"
→ Name + Email (match against Monday "Incoming Future" group by email)
→ [Backend lookup] → Show what we have on file: device, fault, service, pre-repair answers
→ Customer confirms or flags corrections
→ "Anything else we should know before we come see you?" (free text, optional)
→ Submit → "Thanks [Name], please take a seat. We'll be with you shortly."
```

**Requires backend:** Email → Monday lookup against group `new_group34198` (Incoming Future).

**Lookup resolution rules:**
- **1 match:** Show it. Customer confirms or flags corrections.
- **Multiple matches:** Show list with device + service + booking date. Customer picks theirs.
- **0 matches:** "We couldn't find a booking for that email." Offer: try different email, or switch to walk-in flow (preserves name/email already entered).
- **Family/shared email (multiple items):** Same as multiple matches — let customer pick.

**Loading state:** Spinner "Looking up your booking..." — timeout after 5s → fallback message.
**Error state:** If Monday API fails → "We're having trouble looking up your booking. Please let reception know you've arrived."

### Flow B: Walk-In (No Appointment)

Customer walks in off the street. Longest flow, with a critical pricing/proceed gate.

```
Welcome → "I'd like to drop off for repair"
→ Name + Email + Phone
→ Device category → Model
→ What's wrong? (fault selection + optional description)
→ "Have you seen our pricing?"
   → If No: show price (from static JSON), turnaround, part quality info
   → Confirm: price, turnaround, part quality acknowledged
→ "Would you like to proceed with booking in?"
   → If No:
     → "Would you like the quote emailed to you?" (Yes/No)
     → Optional: "Any reason you'd prefer not to drop off today?" (free text)
     → "Please hand the iPad back to reception. Thank you!"
     → [Backend: create/update Intercom contact, send quote email if requested]
   → If Yes: "Just a few more questions..."
     → Progress bar appears
     → Has it been repaired before? (Yes/No)
     → Has Apple seen this device? (Yes/No)
     → Is your data backed up? (Yes / No / I don't know)
       (conditional wording for liquid damage / not turning on)
     → Passcode acknowledgement
     → Delivery preference (deliver back / I'll collect)
     → Submit → intake notification sent to team
```

### Flow C: Collection

Customer picking up a completed repair. **Staff-assisted** — no backend lookup in v1. The form captures identity info; staff matches the customer manually in Monday or from memory.

```
Welcome → "I'm collecting my device"
→ Name + Email
→ Device type (card selection)
→ "Do you have any questions about your repair?" (free text, optional)
→ Submit → "Thanks [Name], we'll bring your [device] out shortly."
```

**No lookup contract needed for v1.** The team view shows the submission with name + email + device. Staff use their knowledge or Monday search to find the matching item. Automated collection lookup (email → Awaiting Collection group match) is a future enhancement.

### Flow D: Enquiry

Customer has a question (not dropping off today).

```
Welcome → "I have a question"
→ Name + Email
→ Device + Fault
→ Submit → sent to team
```

Future: KB-powered self-service answers before a team member goes up.

---

## Execution Phases

### Phase 0: Foundation (prerequisite — before any feature work)

This phase exists because the QA review correctly identified that Phases 1-3 are greenfield work that needs infrastructure first.

#### 0A: Reconcile repo docs
- Update `SPEC.md` sections 9-10 to reference this plan as canonical MVP
- Mark FastAPI references as superseded (Express is the direction)
- Rewrite `FORM-FLOW.md` to match the four flows above
- Fix lint error in `react-form/src/FormContext.tsx:54`

#### 0B: Backend service scaffold
- Create `backend/` directory alongside `react-form/`
- Express server with health endpoint
- Environment contract: document every env var needed from `/home/ricky/config/api-keys/.env`
- Integration adapters with defined interfaces (can be mocked initially):
  - `MondayAdapter` — lookup, create, update items
  - `IntercomAdapter` — contact lookup, email send
  - `LLMSummaryAdapter` — summarise Monday updates
- Shared TypeScript types between frontend and backend (monorepo or shared types package)

#### 0C: Persistence model (Supabase)

**Authoritative source of truth:** `intake_sessions` is the canonical record. `intake_checks` captures operator verification events against each session.

**Write order:** Client form submit → create `intake_sessions` row (synchronous) → Monday item create/update (synchronous) → store `monday_item_id` back on session row. All in one request. If Monday write fails, session is still created with `monday_item_id = null` and `monday_sync_status = 'failed'`.

**Status enum:**
```sql
CREATE TYPE intake_status AS ENUM (
  'submitted',      -- client form submitted, session created, awaiting operator
  'in_progress',    -- operator has opened/claimed this intake
  'completed',      -- operator marked complete, device in queue
  'declined',       -- customer or operator declined
  'cancelled'       -- abandoned or error
);
```

**Schema:**

```sql
-- Canonical intake record
CREATE TABLE intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,  -- client-generated, prevents duplicate submissions
  flow_type TEXT NOT NULL CHECK (flow_type IN ('appointment', 'dropoff', 'collection', 'enquiry')),
  status intake_status NOT NULL DEFAULT 'submitted',
  version INTEGER NOT NULL DEFAULT 1,  -- optimistic concurrency (incremented on every update)

  -- Customer identity
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Form data (full snapshot — authoritative)
  form_data JSONB NOT NULL,

  -- Monday correlation
  monday_item_id TEXT,
  monday_sync_status TEXT DEFAULT 'pending' CHECK (monday_sync_status IN ('pending', 'synced', 'failed')),

  -- Operator
  claimed_by TEXT,  -- operator name/id who claimed this intake
  claimed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Operator verification checks (one row per gate check)
CREATE TABLE intake_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES intake_sessions(id),
  check_type TEXT NOT NULL CHECK (check_type IN ('passcode_verified', 'parts_available', 'turnaround_confirmed', 'fields_complete')),
  passed BOOLEAN NOT NULL,
  operator_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Realtime: Supabase Realtime listens on intake_sessions INSERT and UPDATE events.
-- Team view subscribes to: INSERT (new intake) and UPDATE where status changes.

CREATE INDEX idx_sessions_status ON intake_sessions(status);
CREATE INDEX idx_sessions_created ON intake_sessions(created_at);
CREATE INDEX idx_sessions_email ON intake_sessions(customer_email);
```

**`intake_responses` table dropped.** Form answers live in `form_data` JSONB on the session row. A separate normalised table adds complexity without value at this scale.

**Realtime trigger:** Supabase Realtime publishes on `intake_sessions` INSERT and UPDATE. Team view subscribes to channel `intake_sessions` with filter `status=in('submitted','pending','in_progress')`.

**Idempotency:** Client generates a UUID before submission and sends it as `idempotency_key`. Backend does `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` and returns the existing session if duplicate. Prevents double-submissions from network retries or iPad double-taps.

#### 0D: Auth + operator concurrency

**Auth:** nginx basic auth on `/team` path. Matches existing `mc.icorrect.co.uk` pattern. Credentials in `/etc/nginx/.htpasswd`.

**Operator concurrency:** Optimistic concurrency via `version` column.
- Every mutation request includes the current `version` value
- Backend checks `WHERE id = :id AND version = :expected_version`
- If version mismatch → `409 Conflict` with current session state
- Client shows: "This intake was updated by someone else. Refresh to see changes."
- No lock/claim is required for viewing, only for mutations

**Session claiming:** When an operator opens an intake detail view and starts working, the frontend sends `PATCH /api/intake/:id` with `{ status: 'in_progress', claimed_by: 'Andres' }`. This is advisory, not a hard lock — another operator can still override.

#### 0E: Full API contract definition

All endpoints defined with request body, response body, error cases, and status codes.

```typescript
// ============================================================
// SHARED TYPES (in shared/types.ts — used by frontend + backend)
// ============================================================

type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';
type IntakeStatus = 'submitted' | 'in_progress' | 'completed' | 'declined' | 'cancelled';
type CheckType = 'passcode_verified' | 'parts_available' | 'turnaround_confirmed' | 'fields_complete';

interface IntakeSession {
  id: string;
  idempotencyKey: string;
  flowType: FlowType;
  status: IntakeStatus;
  version: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  formData: IntakeFormData;
  mondayItemId: string | null;
  mondaySyncStatus: 'pending' | 'synced' | 'failed';
  claimedBy: string | null;
  claimedAt: string | null;
  checks: IntakeCheck[];
  createdAt: string;
  updatedAt: string;
}

interface IntakeCheck {
  id: string;
  checkType: CheckType;
  passed: boolean;
  operatorName: string;
  notes: string | null;
  createdAt: string;
}

interface MondayItem {
  id: string;
  name: string;           // item name (contains device info)
  device: string;         // parsed from name
  service: string;        // from `service` column
  status: string;         // from `status4` column
  group: { id: string; title: string };
  bookingDate: string | null; // from `date6` if present
  intercomLink: string | null; // from `link1` column
}

// ============================================================
// ENDPOINT: POST /api/intake
// Client form submission
// ============================================================

// Request
interface CreateIntakeRequest {
  idempotencyKey: string;  // client-generated UUID
  flowType: FlowType;
  formData: IntakeFormData;
}

// Response 201
interface CreateIntakeResponse {
  sessionId: string;
  mondayItemId: string | null;  // null if Monday write failed
  mondaySyncStatus: 'synced' | 'failed';
  status: IntakeStatus;
}

// Response 200 (duplicate — idempotency key already exists)
// Returns the existing session

// Response 400 { error: string } — validation failure
// Response 500 { error: string } — server error

// ============================================================
// ENDPOINT: GET /api/customer/lookup?email=...&groupIds=...
// Customer match for appointment flow + returning customer check
// ============================================================

// Query params:
//   email (required) — customer email
//   groupIds (optional) — comma-separated Monday group IDs to filter

// Response 200
interface CustomerLookupResponse {
  found: boolean;
  mondayItems: MondayItem[];
  // Resolution rule for appointment flow:
  //   If groupIds includes Incoming Future AND exactly 1 item found → use it
  //   If multiple items → return all, frontend shows "multiple bookings found" and lists them
  //   If 0 items → found=false, frontend offers switch to walk-in
  isReturningCustomer: boolean;  // true if items found in ANY group (excluding current + BM)
  previousRepairCount: number;
  intercomLink: string | null;   // most recent Intercom conversation link
}

// Response 400 { error: 'email required' }

// ============================================================
// ENDPOINT: GET /api/intake/today
// Team view: today's intake sessions
// ============================================================

// Response 200
interface TodayIntakesResponse {
  sessions: IntakeSession[];  // ordered by created_at DESC, filtered to today (Europe/London)
}

// ============================================================
// ENDPOINT: GET /api/intake/:id
// Team view: single intake detail
// ============================================================

// Response 200: IntakeSession (with checks populated)
// Response 404: { error: 'session not found' }

// ============================================================
// ENDPOINT: PATCH /api/intake/:id
// Team view: update intake fields (correct details, claim session)
// ============================================================

// Request
interface UpdateIntakeRequest {
  version: number;  // required — optimistic concurrency
  // All fields optional — only send what's changing:
  status?: IntakeStatus;
  claimedBy?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  formData?: Partial<IntakeFormData>;  // partial update merged into existing
  // Monday write-back: if customerEmail, customerPhone, or formData.deviceCategory
  // changes, backend also updates the corresponding Monday column
}

// Response 200: IntakeSession (updated, version incremented)
// Response 409: { error: 'version conflict', currentSession: IntakeSession }
// Response 404: { error: 'session not found' }

// Status transition rules:
//   submitted → in_progress, declined, cancelled
//   in_progress → completed, declined, cancelled
//   completed → (terminal)
//   declined → (terminal)
//   cancelled → (terminal)
// Invalid transitions return 400.

// ============================================================
// ENDPOINT: POST /api/intake/:id/notes
// Team view: add operator notes (→ Monday item update)
// ============================================================

// Request
interface AddNotesRequest {
  operatorName: string;
  text: string;
}

// Response 201: { mondayUpdateId: string }
// Response 404: { error: 'session not found' }
// Response 400: { error: 'text required' }

// Side effect: creates Monday item update via GraphQL mutation
// on the linked monday_item_id

// ============================================================
// ENDPOINT: POST /api/intake/:id/complete
// Team view: mark intake complete (with gate validation)
// ============================================================

// Request
interface CompleteIntakeRequest {
  version: number;
  operatorName: string;
}

// Response 200: IntakeSession (status=completed)
// Response 400: { error: 'gates not passed', failedGates: CheckType[] }
// Response 409: { error: 'version conflict', currentSession: IntakeSession }

// Pre-condition: all 4 check types must have a passing check in intake_checks.
// If not, returns 400 with the list of failed gates.
// Side effect: updates Monday item status4 → 'Received'.
// Monday group lifecycle:
//   - Walk-in (Flow B): item created directly in Today's Repairs. Complete only updates status4.
//   - Appointment (Flow A): item already exists in Incoming Future. Complete moves it to Today's Repairs AND updates status4.
//   - Collection (Flow C): no Monday mutation on complete (staff handles).
//   - Enquiry (Flow D): item created in New Orders. No complete action (enquiry, not repair).

// ============================================================
// ENDPOINT: POST /api/intake/:id/decline
// Team view: mark intake declined
// ============================================================

// Request
interface DeclineIntakeRequest {
  version: number;
  operatorName: string;
  reason: string;
}

// Response 200: IntakeSession (status=declined)
// Response 409: { error: 'version conflict', currentSession: IntakeSession }

// Side effect: updates Monday item if linked.

// ============================================================
// ENDPOINT: POST /api/intake/:id/checks
// Team view: record a gate check result
// ============================================================

// Request
interface RecordCheckRequest {
  checkType: CheckType;
  passed: boolean;
  operatorName: string;
  notes?: string;
}

// Response 201: IntakeCheck
// Response 404: { error: 'session not found' }

// ============================================================
// ENDPOINT: GET /api/health
// Service health check
// ============================================================

// Response 200: { status: 'ok', uptime: number, version: string }
```

#### 0F: Validation baseline
- ~~Fix existing lint error (FormContext.tsx:54)~~ Done
- Add Playwright for client-flow smoke tests
- Add Vitest for backend unit/contract tests
- **Phase 0 must end with at least:**
  - 1 real backend test: health endpoint responds 200
  - 1 real client test: welcome screen renders
- Minimum test matrix (tests added incrementally per phase, not all at Phase 4):
  - Phase 1 gate: walk-in happy path + decline path (Playwright)
  - Phase 2 gate: `POST /api/intake` contract test, customer lookup contract test (Vitest)
  - Phase 3 gate: team view queue renders, complete-intake with gate validation (Playwright + Vitest)

**Acceptance criteria for Phase 0:**
- [ ] `SPEC.md` and `FORM-FLOW.md` updated to match this plan (**done**)
- [ ] Lint passes (**done**)
- [ ] Backend scaffold exists with health endpoint responding
- [ ] Supabase schema migrated with status enum, version column, idempotency key
- [ ] All API contracts defined in shared types file
- [ ] Auth: nginx basic auth configured for `/team` path
- [ ] At least 1 real backend test + 1 real client test passing

**Implementation status as of 2026-04-08:**
- Root `npm run build`, `npm run lint`, and `npm run test` pass.
- Backend scaffold, shared types, initial repository/service layer, and health test exist.
- Current backend adapters and persistence wiring remain mocked/local for implementation QA; live services are a later phase.

---

### Phase 1: Client Form — Flow Engine + Walk-In Path

**Why walk-in first:** It exercises pricing, branching, decline/quote, intake creation, and team handoff. It's the hardest flow and proves the architecture.

#### 1A: Flow engine rewrite

The current prototype uses a fixed `STEPS` array with linear `next/back`. This must be replaced with a flow-aware routing system.

Design:
```typescript
// Flow definition — each flow is a sequence of step IDs
const FLOWS = {
  appointment: ['welcome', 'visit-purpose', 'identity', 'booking-confirm', 'additional-notes', 'confirmation'],
  dropoff: ['welcome', 'visit-purpose', 'identity', 'device', 'model', 'fault', 'pricing-gate', 'proceed-decision', /* conditional: */ 'pre-repair-questions', 'confirmation'],
  collection: ['welcome', 'visit-purpose', 'identity', 'device', 'collection-questions', 'confirmation'],
  enquiry: ['welcome', 'visit-purpose', 'identity', 'device', 'fault', 'confirmation'],
};

// Step registry
const STEPS: Record<string, React.ComponentType> = {
  'welcome': Welcome,
  'visit-purpose': VisitPurpose,
  'identity': Identity, // name + email + phone (phone only for dropoff)
  // ...
};
```

- Steps are keyed by ID, not array index
- Each flow defines its step sequence
- Conditional steps (pre-repair questions only if proceed=yes) handled in flow definition
- Progress bar calculates against current flow's total steps, only visible after proceed=yes in walk-in
- Back button navigates within current flow
- No dead-end states — every path reaches confirmation or graceful exit

#### 1B: Walk-in flow (Flow B) — full implementation

Build all screens for the walk-in path:
- Identity (name, email, phone)
- Device selection (cards)
- Model selection (searchable list from pricing JSON)
- Fault selection (cards, conditional on device — keyboard only for MacBook)
- Pricing gate ("Have you seen our pricing?" → show price/turnaround/part quality if no)
- Proceed decision (Yes → pre-repair questions / No → quote email offer + decline reason)
- Pre-repair questions (repaired before, Apple seen, data backup, passcode, delivery)
- Confirmation (animated, auto-reset)

#### 1C: Design overhaul (applied to walk-in flow)

- Premium Apple-quality look and feel
- Better card components (hover/active/selected states with tactile feedback)
- Typography hierarchy (clear headings, readable body, proper spacing)
- Device icons (clean, recognisable silhouettes)
- Less flat grey — warmer, more inviting
- iPad landscape primary, phone portrait responsive
- Auto-advance on card taps feels instant

#### 1D: Data model update

Replace current `types.ts` with the full model:

```typescript
export type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';
export type DeviceCategory = 'iPhone' | 'iPad' | 'MacBook' | 'Apple Watch';
export type FaultCategory = 'Screen' | 'Battery' | 'Charging' | 'Keyboard' | 'Liquid Damage' | 'Not Turning On' | 'Diagnostic' | 'Other';

export interface IntakeFormData {
  flowType: FlowType | null;

  // Identity (all flows)
  name: string;
  email: string;
  phone: string;

  // Device (dropoff, collection, enquiry)
  deviceCategory: DeviceCategory | null;
  model: string;

  // Fault (dropoff, enquiry)
  fault: FaultCategory | null;
  faultDescription: string;

  // Pricing gate (dropoff only)
  seenPricing: boolean | null;
  proceedWithBooking: boolean | null;
  declineReason: string;
  wantsQuoteEmailed: boolean | null;

  // Pre-repair questions (dropoff only, after proceed=yes)
  repairedBefore: boolean | null;
  appleSeen: boolean | null;
  dataBackedUp: 'yes' | 'no' | 'unknown' | null;
  passcodeAcknowledged: boolean;
  deliveryPreference: 'deliver' | 'collect' | null;

  // Appointment flow
  selectedBooking: MondayItem | null; // single item selected from CustomerLookupResponse.mondayItems
  bookingConfirmed: boolean;
  additionalNotes: string;

  // Collection flow
  collectionQuestions: string;
}
```

**Acceptance criteria for Phase 1:**
- [ ] Flow engine supports branching (not linear step array)
- [ ] Walk-in happy path works end-to-end on iPad
- [ ] Walk-in decline path works (quote email offer, reason capture, graceful exit)
- [ ] Pricing gate shows correct price from static JSON for selected model+fault
- [ ] Progress bar only appears after customer commits to booking in
- [ ] Design is premium quality
- [ ] Responsive on phone portrait
- [ ] No dead-end navigation states
- [ ] All walk-in data fields captured correctly
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Smoke test covers walk-in happy path and decline path

**Implementation status as of 2026-04-08:**
- This phase is implemented in the new `frontend/` app and passes local QA.
- Walk-in happy path and decline path are covered by Playwright with mocked API responses.

---

### Pre-Phase-2 Checkpoint (hard gate)

Phase 2 live-integration work **cannot complete** until these are resolved. Each has an exit criterion.

| Blocker | Exit criterion | Owner |
|---------|---------------|-------|
| Intercom quote email capability | Send a test email via Intercom API; confirm delivery | Code |
| Phone column ID in Monday | Query board schema, identify column, document ID | Code |
| SPEC.md section 4 alignment | Explicitly defer missing operator questions (see below) | Code |

**SPEC.md section 4 reconciliation:** The following universal intake questions from `SPEC.md` section 4 are **deferred from v1** and will be added to `SPEC.md` as explicitly deferred:
- "New or refurbished?" — rarely actionable at intake
- "How did the fault occur?" — captured in faultDescription free text, not as structured question
- "Secondary-fault authorization" — deferred to post-v1 (currently verbal)
- "Battery upsell authorization" — deferred to post-v1 (currently verbal)

These will be added to the "Not Building (yet)" table and to `SPEC.md` section 4 as explicitly deferred items.

If any blocker cannot be resolved, the dependent feature is **cut from v1**, not left ambiguous:
- No Intercom email → cut quote email feature; just capture "wanted quote emailed" flag
- No phone column → don't write phone to Monday; store in Supabase only

**Status as of 2026-04-08:** client-side Phase 2 flow work can proceed with mocked adapters for implementation QA, but live Monday/Intercom/Supabase signoff remains blocked until the items above are resolved.

---

### Phase 2: Remaining Client Flows + Backend Integration

**Status as of 2026-04-08:** the client-facing portion of this phase is implemented in the current build for mocked/local QA. The live-adapter portion of this phase remains pending.

#### 2A: Flow A (Appointment)

- Identity screen → backend lookup (`GET /api/customer/lookup?email=...`)
- Display matched booking data for confirmation
- Customer confirms or flags issues
- Additional notes
- Loading/fallback states for lookup
- If no match: offer to switch to walk-in flow

#### 2B: Flow C (Collection) + Flow D (Enquiry)

- Short, clean paths (3-4 screens each)
- Collection: name, email, device, optional questions
- Enquiry: name, email, device, fault

#### 2C: Backend service — live integration

Wire up the real adapters (replacing mocks from Phase 0):

- **Monday adapter:**
  - `lookupByEmail(email, groupIds?)` — customer match
  - `createItem(boardId, groupId, columnValues)` — new walk-in/enquiry item
  - `updateItem(itemId, columnValues)` — write-back corrections
  - Column IDs: all verified (see Verified References section)
- **Intercom adapter:**
  - `findContact(email)` — returning customer check
  - `sendQuoteEmail(email, quoteData)` — declined walk-in quote
- **LLM summary:**
  - Absorb from `builds/llm-summary-endpoint/server.js`
  - `summariseUpdates(mondayItemId)` — fetch updates, filter, summarise
  - 15s timeout (up from current 5s)

#### 2D: Form submission pipeline

```
Client form submit
→ POST /api/intake
→ Create intake_sessions row in Supabase
→ Create/update Monday item (flow-dependent)
→ If returning customer: attach history context
→ Emit realtime event for team view
→ Return session ID to client for confirmation
```

**Acceptance criteria for Phase 2:**
- [ ] All 4 flows work end-to-end with real backend
- [ ] Appointment lookup returns correct Monday item from Incoming Future group; handles 0, 1, and multiple matches correctly
- [ ] Walk-in submission creates Monday item in Today's Repairs (`new_group70029`) with correct column values
- [ ] Declined walk-in with "email quote" creates Intercom contact and sends email (or gracefully degrades if Intercom blocked — see pre-Phase-2 checkpoint)
- [ ] Collection and enquiry submissions create Supabase sessions and appear in team view
- [ ] Customer lookup response time < 3s
- [ ] Supabase session created for every submission with idempotency key preventing duplicates
- [ ] API contract tests pass for: `POST /api/intake`, `GET /api/customer/lookup`, all error cases
- [ ] Monday write failures are captured (`monday_sync_status = 'failed'`) not swallowed

**Current implementation status as of 2026-04-08:**
- Appointment flow UI is implemented with lookup loading/error states, zero-match fallback, booking selection, and switch-to-walk-in while preserving identity.
- Collection and enquiry flows are implemented and submit through the shared frontend intake path.
- Frontend submission is wired to `POST /api/intake`, and backend intake creation already handles idempotency, Monday correlation, and sync-status state in the current in-memory implementation.
- Root `npm run build`, `npm run lint`, and `npm run test` pass, and Playwright covers appointment success, appointment zero-match to walk-in, collection, enquiry, and both walk-in paths.
- This does **not** satisfy the real-backend acceptance criteria above yet; live Monday, Intercom, and Supabase integration work is still pending.

---

### Phase 3: Team Intake View (iPad)

iPad-first interface for Andres/front desk.

#### 3A: Intake queue

- Today's submissions (Europe/London business day), live-updating via Supabase Realtime
- Columns: customer name, device, fault, flow type, time, status
- Status flow uses the API enum: `submitted` → `in_progress` → `completed` | `declined`
- UI labels can differ from enum values: `submitted` displays as "New", `in_progress` as "In Progress", etc.
- New submissions appear without refresh
- Tap to open detail

#### 3B: Detail view

- Full display of client submission
- Monday context (pulled via backend):
  - Repair history for this email
  - Intercom conversation summary
  - LLM summary of existing Monday updates
- Returning customer flag + history count

#### 3C: Operator actions

| Action | Backend call | Monday effect |
|--------|-------------|---------------|
| Correct details | `PATCH /api/intake/:id` | Column write-back (email, phone, device) |
| Add notes | `POST /api/intake/:id/notes` | Monday item update |
| Complete intake | `POST /api/intake/:id/complete` | Status → received, group move |
| Decline | `POST /api/intake/:id/decline` | Status update, reason captured |

#### 3D: Operator completion gates

Two tiers of gates, addressing QA finding #6:

**Client-capture gates** (enforced by client form — Flow B only):
- Pricing acknowledged
- Pre-repair questions answered
- Passcode acknowledgement
- Delivery preference set

**Operator completion gates** (enforced by team view before "Complete intake"):
- [ ] Passcode verified on device (operator physically checks)
- [ ] Parts availability confirmed (operator checks stock)
- [ ] Turnaround confirmed with customer (operator verbally confirms)
- [ ] All required fields present (system checks)

These map to `SPEC.md` sections 3 and 4. The following SPEC.md hard gates are **deferred** (not in this build):
- Intake photos (requires photo capture feature — out of scope)
- Parts reservation signaling (requires parts service integration — future)
- Corporate passcode agreements (requires corporate profiles — future)

**Acceptance criteria for Phase 3:**
- [ ] Operator sees all today's intakes without opening Monday
- [ ] New submissions appear in real-time (< 2s after client form submit)
- [ ] Operator can complete full intake from this interface
- [ ] Monday gets field-level column updates (not free-text dumps)
- [ ] Completion gates prevent incomplete intake from entering queue
- [ ] Version conflict handled gracefully (409 → "Updated by someone else, refresh")
- [ ] Two operators can view the same intake without issues; mutations are version-gated
- [ ] iPad touch targets and scrolling work well
- [ ] Vitest: complete-intake rejects when gates not passed; PATCH returns 409 on version mismatch
- [ ] Playwright: team view queue renders, detail view loads, complete flow works

---

### Phase 4: Validation + Cutover

#### 4A: Pre-cutover validation

All automated tests must pass before going live:

| Test type | What | Tool | Phase added |
|-----------|------|------|-------------|
| Client flow | Walk-in happy path + decline | Playwright | Phase 1 |
| API contract | `POST /api/intake`, customer lookup, error cases | Vitest | Phase 2 |
| API contract | PATCH, complete, decline, checks, version conflicts | Vitest | Phase 3 |
| Integration | Form submit → Supabase session → Monday item | Vitest + real APIs | Phase 2 |
| Team view | Queue renders, detail loads, complete flow | Playwright | Phase 3 |
| Realtime | New session → team view update < 2s | Playwright | Phase 3 |

Additionally: manual end-to-end walkthrough of all 4 flows on iPad by Ricky or Andres.

#### 4B: Cutover (direct switch, no parallel run)

No dual-writer period. Typeform goes off when the new system goes live. This avoids duplicate Monday items entirely.

**Pre-cutover checklist:**
- [ ] All automated tests pass
- [ ] Manual iPad walkthrough of all 4 flows completed
- [ ] **Live in-shop rehearsal:** Before customer-facing cutover, run a real rehearsal in the shop with a test device and test Monday item. Operator completes a full walk-in intake + team-view complete cycle against real APIs. This is the final soak before going live. Do this same-day before switching the iPad URL.
- [ ] `intake.icorrect.co.uk` DNS + SSL configured
- [ ] nginx proxy configured for client form + `/team` (with basic auth)
- [ ] Backend systemd service running and healthy
- [ ] Rollback drill completed (see below)
- [ ] Monitoring in place: log every submission, alert on Monday write failures via Telegram

**Cutover steps:**
1. Deploy new system to `intake.icorrect.co.uk`
2. Verify health endpoint + manual test submission
3. Switch iPad kiosk URL from Typeform router to `intake.icorrect.co.uk`
4. Deactivate Typeform webhooks on all 4 forms
5. Deactivate n8n workflows (`FB83t0dN0PNlEOpd`, `lTHrOPUnD6naN28p`, `kDfU2wWWv207T24J`)
6. Monitor first full business day
7. After 2 weeks stable: cancel Typeform subscription (saves £70/month)

**Rollback plan** (if system fails on day 1):
1. Switch iPad back to Typeform router URL
2. Re-enable Typeform webhooks (they're deactivated, not deleted)
3. n8n workflows are deactivated, not deleted — re-enable
4. System is back to pre-cutover state within 5 minutes
5. Investigate failures from Supabase logs + backend journal

**Rollback triggers:**
- Monday item creation failing on > 2 consecutive submissions
- Team cannot see new intakes in team view
- iPad form crashes or hangs for any customer
- Ricky or Andres calls it

**Acceptance criteria for Phase 4:**
- [ ] All automated tests pass
- [ ] Manual walkthrough completed
- [ ] Cutover executed successfully
- [ ] First full business day runs clean
- [ ] Rollback drill completed before cutover (prove you can switch back in < 5 min)

---

## Not Building (yet)

| Feature | Why deferred | When |
|---------|-------------|------|
| Photo capture at intake | Needs camera API + Supabase Storage | After v1 stable |
| Voice note transcription | Needs Whisper pipeline integration | After v1 stable |
| BM trade-in intake flow | Separate system (System 4) with its own services | Separate project |
| Diagnostic flow branching | Needs structured diagnostic schema | After base flows proven |
| Dynamic pricing from API | Static JSON works, avoids API dependency | When pricing changes frequently |
| AI chat for enquiry | Needs KB built first | Future |
| Parts reservation at intake | Needs parts service integration | After v1 stable |
| Corporate passcode profiles | Low volume, manual process works | After v1 stable |
| "New or refurbished?" question | Rarely actionable at intake | After v1 stable |
| Structured fault-cause capture | Captured in faultDescription free text for now | After v1 stable |
| Secondary-fault authorization | Currently verbal between tech and customer | After v1 stable |
| Battery upsell authorization | Currently verbal, offered during repair | After v1 stable |
| Collection backend lookup | Staff-assisted in v1; automated match deferred | After v1 stable |

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Client form | React + TypeScript + Vite + Tailwind + Framer Motion | Existing scaffold |
| Team view | Same React app, `/team` route | One deployable unit |
| Backend API | Node.js + Express + TypeScript | Matches all VPS services; reuse existing code |
| Data | Supabase (intake sessions) + Monday (source of truth) | Supabase for speed + realtime |
| Hosting | VPS (46.225.53.159), nginx, systemd | Existing infrastructure |
| Real-time | Supabase Realtime | Team view live updates |
| Tests | Playwright (client), Vitest (backend) | Standard choices |
| Domain | `intake.icorrect.co.uk` | Dedicated |

---

## Verified References

All IDs verified against live APIs on 2026-04-06 (`builds/agent-rebuild/slack-intake-readiness.md`).

### Monday Column IDs (Board 349212843)

| Column ID | Title | Used for |
|-----------|-------|----------|
| `service` | Service | Repair type |
| `status4` | Status | Repair status |
| `status` | Client | Client type |
| `dup__of_quote_total` | Paid | Paid amount |
| `status_14` | Case | Case/accessories (business meaning TBC — see open items) |
| `color_mkse6rw0` | Problem (Repair) | Repair problem flag |
| `color_mkse6bhk` | Problem (Client) | Client problem flag |
| `text_mm087h9p` | Intercom ID | Intercom conversation ID |
| `link1` | Ticket | Intercom link |
| `text5` | Email | Customer email |
| `color_mkzmbya2` | Source | Source/Shopify detection |
| `text8` | Passcode | Device passcode |
| `text368` | Walk-in Notes | Walk-in notes |
| `date4` | Received | Received date |

### Monday Group IDs

| Group ID | Title | Used by |
|----------|-------|---------|
| `new_group34086` | Awaiting Collection | Future: Flow C automated lookup (not in v1) |
| `group_mkwkapa6` | Quality Control | Future: Flow C automated lookup (not in v1) |
| `new_group70029` | Today's Repairs | Flow B walk-in item creation (confirmed) |
| `new_group77101__1` | New Orders | Flow D enquiry item creation |
| `new_group34198` | Incoming Future | Flow A booking lookup |

### Reusable Code

| File | What to absorb |
|------|---------------|
| `builds/llm-summary-endpoint/server.js` | stripHtml, shouldSkip, formatUpdates, buildPrompt, callOpenAI |
| `builds/intake-notifications/REBUILD-BRIEF.md` | Monday lookup queries, name matching logic |

---

## Build Progress (as of 2026-04-08)

### What's Done

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 0: Foundation** | **Complete** | Backend scaffold (Express + TS), all 8 API endpoints (mocked adapters), Supabase migration ready, shared types, env contract, nginx auth template, health test + welcome smoke test passing |
| **Phase 1: Walk-In Flow** | **Complete** | Flow engine rewrite (keyed step definitions, branching), full walk-in path (identity → device → model → fault → pricing → proceed/decline → pre-repair → confirmation), Playwright covers happy path + decline |
| **Pre-Phase-2 Checkpoint** | **Complete** | Phone column: `text00` verified. Intercom: token missing, quote email degrades gracefully. SPEC.md s4 deferrals recorded. |
| **Phase 2: Remaining Flows** | **Complete (mocked)** | All 4 flows working locally. Appointment handles 0/1/N matches + switch-to-walk-in. Collection + enquiry submit through shared pipeline. Idempotency + Monday correlation in place. **Live adapters still pending.** |
| **UI Redesign** | **Complete** | Restyled all components with shadcn/ui + Tailwind. Apple Store clean aesthetic. Deleted old index.css, Surface, BrandMark. SF Pro font stack. All tests pass. |
| **Phase 3: Team View** | **Spec written** | `TEAM-VIEW-SPEC.md` complete with screen mockups, gate forms, collection/enquiry variants, data flow. Build brief not yet dispatched. |

### What's In Progress

| Item | Status | Brief |
|------|--------|-------|
| **Triage system port** | Brief written, ready to dispatch | `BRIEF-CODEX-TRIAGE.md` — port 92+ specific issues from quote wizard into fault/issue selection. Replaces generic 8-card fault list with device-specific faults + sub-issues with repair/diagnostic/contact routing. |
| **UI redesign** | Dispatched to Codex | `BRIEF-CODEX-REDESIGN.md` — shadcn/ui + Tailwind restyle of all components. |

### What's Remaining

| Item | Depends on | Brief |
|------|-----------|-------|
| **Phase 2C: Live adapters** | Triage + redesign complete | Monday lookup, Intercom, Supabase, LLM summary — swap mocks for real integrations |
| **Phase 3: Team view build** | Phase 2C live | `TEAM-VIEW-SPEC.md` has full spec; needs Codex build brief |
| **Phase 4: Validation + cutover** | Phase 3 complete | Automated tests, live rehearsal, DNS/SSL, direct cutover |
| **Intercom token** | Ricky | `INTERCOM_ACCESS_TOKEN` missing from `.env` — needed for quote email |

### Key Discoveries During Build

1. **Phone column ID:** `text00` (Phone Number) — verified live against board 349212843
2. **Appointment lookup scope:** Should search both Incoming Future AND Today's Repairs (booked client may already be moved)
3. **Intercom token missing:** Quote email capability degrades gracefully — captures intent but doesn't send
4. **Quote wizard triage system:** Website has 92+ curated device-specific issues with repair/diagnostic/contact routing. Being ported into the intake form to replace the generic fault selection.

---

## Open Items (must resolve before relevant phase)

| Item | Blocks | Owner | Status |
|------|--------|-------|--------|
| ~~Phone column ID in Monday~~ | ~~Pre-Phase-2 checkpoint~~ | ~~Code — query board schema~~ | **Resolved: `text00` (`Phone Number`) verified 2026-04-08** |
| `status_14` business meaning | Phase 3 (team view display) | Ricky — confirm with team | Not started |
| Intercom API access for quote email | Phase 2C (live adapters) | Ricky — add `INTERCOM_ACCESS_TOKEN` to `.env` | **Blocked: token missing from `/home/ricky/config/api-keys/.env`** |
| Triage system integration | Phase 2 (fault selection) | Codex — `BRIEF-CODEX-TRIAGE.md` | Brief written, ready to dispatch |
| UI redesign | All phases (visual) | Codex — `BRIEF-CODEX-REDESIGN.md` | **Complete: shadcn/ui + Tailwind restyle done** |
| Team view build | Phase 3 | Codex — brief not yet written | Spec complete (`TEAM-VIEW-SPEC.md`), awaiting build brief |
| ~~Walk-in Monday group~~ | ~~Phase 2~~ | ~~Ricky~~ | **Resolved: Today's Repairs (`new_group70029`)** |
| ~~Pilot duplicate suppression~~ | ~~Phase 4~~ | ~~Code~~ | **Resolved: direct cutover, no dual-writer** |
| ~~Collection lookup contract~~ | ~~Phase 2~~ | ~~Code~~ | **Resolved: staff-assisted, no backend lookup in v1** |
| ~~Auth decision~~ | ~~Phase 3~~ | ~~Code~~ | **Resolved: nginx basic auth** |
| ~~Operator concurrency~~ | ~~Phase 3~~ | ~~Code~~ | **Resolved: optimistic concurrency via version column** |

---

## QA Finding Resolution Matrix

### Round 1 Findings

| # | Finding | Resolution |
|---|---------|------------|
| 1 | Source-of-truth conflict | This plan is canonical. SPEC.md and FORM-FLOW.md updated. |
| 2 | Phase 2/3 are greenfield | Added Phase 0 (Foundation) with backend scaffold, schema, contracts. |
| 3 | Flow A needs lookup contract | Full contract in 0E with resolution rules for 0/1/N matches. Appointment flow UI is now implemented for mocked/local QA; live backend validation remains part of Phase 2 integration. |
| 4 | Linear step model needs rewrite | Phase 1A defines flow-aware routing with step registry. |
| 5 | Prototype disagrees with new flows | Acknowledged as rewrite. Docs updated first (done), then Phase 1 rebuilds. |
| 6 | Hard gates incomplete | Split into client-capture + operator gates. Deferred gates listed. |
| 7 | Open questions not gated | Moved to hard pre-Phase-2 checkpoint with exit criteria. |
| 8 | FastAPI vs Express | Decision made: Express. SPEC.md updated. |
| 9 | Weak validation strategy | Tests required per-phase (not deferred to Phase 4). Real tests at each gate. |
| 10 | Cutover lacks rollback | Direct cutover with rollback drill, triggers, and 5-min recovery plan. |

### Round 2 Findings

| # | Finding | Resolution |
|---|---------|------------|
| R2-1 | Missing API contracts for team-view mutations | Full contracts for all 8 endpoints defined in 0E: request body, response body, error cases, status codes, transition rules. |
| R2-2 | Persistence model too vague | Explicit schema with status enum, version column, idempotency key, write order, realtime trigger source. `intake_responses` table dropped (form_data JSONB is authoritative). |
| R2-3 | Pilot duplicate suppression is fake | Eliminated: direct cutover, no parallel run. Typeform off when new system goes live. |
| R2-4 | Lookup flows underspecified | Appointment: resolution rules for 0/1/N matches defined. Collection: cut from v1 (staff-assisted, no backend lookup). |
| R2-5 | Open items still on critical path | Hard pre-Phase-2 checkpoint added with exit criteria. If blocker unresolvable, dependent feature is cut, not left ambiguous. |
| R2-6 | SPEC.md section 4 misalignment | Four specific universal questions explicitly deferred with rationale. Will be added to SPEC.md section 4 and "Not Building" table. |
| R2-7 | Auth fuzzy, concurrency unspecified | Auth decided: nginx basic auth. Concurrency: optimistic via version column with 409 conflict response. Session claiming defined. |
| R2-8 | Validation gates too weak | Tests required per-phase gate (not empty harnesses). Phase 0: 1 real backend + 1 real client test. Phase 1: walk-in smoke. Phase 2: contract tests. Phase 3: team view + concurrency tests. |

### Round 3 Findings

| # | Finding | Resolution |
|---|---------|------------|
| R3-1 | SPEC.md section 6 schema conflict | Updated section 6: `intake_responses` dropped, photos/turnaround deferred. Plan's "what remains valid" claim corrected to list sections accurately. |
| R3-2 | Status enum mismatch (new vs submitted) | Team queue section now uses API enum (`submitted`, `in_progress`, etc.). `submitted` displays as "New" in UI — mapping stated explicitly. |
| R3-3 | Monday group lifecycle contradictory | Clarified in complete-intake endpoint: walk-in starts in Today's Repairs (complete only updates status4); appointment starts in Incoming Future (complete moves to Today's Repairs + updates status4). |
| R3-4 | UTC instead of London time | `GET /api/intake/today` now defined as Europe/London business day. |
| R3-5 | FORM-FLOW.md lags plan | Synced: appointment lookup resolution rules (0/1/N matches, error state), collection "staff-assisted" positioning, bookingData typed to match API response. |
| R3-6 | No live soak before cutover | Added live in-shop rehearsal step: operator runs full walk-in + team-view cycle against real APIs with test device before customer-facing switch. |

### Final Pass Findings

| # | Finding | Resolution |
|---|---------|------------|
| F-1 | bookingData typed inconsistently | Changed to `selectedBooking: MondayItem \| null` in form state (both plan.md and FORM-FLOW.md). `CustomerLookupResponse` is API-response-only. |
| F-2 | `pending` status has no operational use | Removed from enum and transition rules. `submitted` covers the "awaiting operator" state. |
| F-3 | Enquiry/New Orders contradiction | Verified references table updated: `new_group77101__1` used for Flow D enquiry item creation. |

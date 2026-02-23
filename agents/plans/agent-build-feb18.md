# iCorrect Intake System — Build Plan

## Context

Intake is iCorrect's biggest operational bottleneck. Adil manages all device intake (walk-in, mail-in, courier) for repairs, diagnostics, and Back Market trade-ins. The current process loses information between customer conversations (Intercom) and the Monday.com board, leaving techs with incomplete data.

**Evidence from the board audit (past week):**
- Repair walk-in (Konstantin): Walk-in notes = "Battery replacement". Info Capture = "No Information". No visual inspection, no pre-checks.
- Diagnostic walk-in (Jexna, liquid damage MacBook): Adil's entire note = 4 lines. Zero questions about when damage happened, liquid type, been to Apple, charger, previous repairs.
- BM trade-ins: Reported vs Actual grading columns exist but frequently left at defaults. Passcode "Unable to verify" on most.

**What this system solves:**
1. Guided question flows that adapt per service type and device — Adil can't miss critical questions
2. Intercom conversation context pulled in automatically — no re-asking what's already known
3. Password verified at intake, not discovered wrong at repair time
4. Parts stock checked at intake — accurate timelines given to customers
5. Pre-checks completed before handoff to tech queue
6. Reconciliation between what was reported and what was found

---

## Architecture

```
┌────────────────────────────────────────────────┐
│         intake.icorrect.co.uk (React)          │
│  Responsive: iPad (primary) + iPhone + Desktop │
│  Vite + React + TypeScript + Tailwind v4       │
├────────────────────────────────────────────────┤
│              Supabase (Direct)                 │
│  intake_sessions, intake_checks, device_tests  │
├────────────────────────────────────────────────┤
│     FastAPI Backend (port 8003, systemd)       │
│  Proxies Monday.com + Intercom APIs            │
│  (tokens stay server-side)                     │
│  Nginx: intake.icorrect.co.uk → localhost:8003 │
└────────────────────────────────────────────────┘
```

**Why a backend?** Monday.com and Intercom API tokens must stay server-side. Supabase is accessed directly from React (same pattern as the MC v2 dashboard). The backend handles:
- Intercom conversation lookup by customer name/email
- Monday.com item creation and updates (GraphQL mutations)
- Parts stock check (query Monday.com Parts Required board relation)

---

## Monday.com Main Board (ID: 349212843) — Intake-Relevant Columns

### Currently populated at intake
| Column | ID | What it captures |
|--------|-----|-----------------|
| Service | `service` | Walk-In, Mail-In, Gophr Courier |
| Status | `status4` | Awaiting Confirmation → Received → etc. |
| Passcode | `text8` | Free text (sometimes "Device is erased", "Won't provide") |
| Client | `status` | End User, BM, Corporate, Warranty, B2B |
| Email | `text5` | Customer email |
| Phone | `text00` | Customer phone |
| IMEI/SN | `text4` | Serial number |
| Walk-in Notes | `text368` | Free text — currently 1-2 lines max |
| Intercom ID | `text_mm087h9p` | Linked Intercom conversation |

### Exists but rarely/never populated at intake
| Column | ID | What should be captured |
|--------|-----|------------------------|
| Info Capture | `color_mkvmn8wr` | Almost always "No Information" |
| Passcode Verified | `color_mm01jjsx` | Verified / Failed / Unable to verify |
| Basic Test | `color_mm01xyth` | Passed / Failed |
| Stock Status | `color_mm01323z` | In Stock / Low Stock / Out of Stock |
| Intake Condition | `lookup_mkshgc2p` | Mirror — needs source populated |
| Intake Notes | `long_text_mkqhfapq` | Long text — currently empty |
| iCloud | `color_mkyp4jjh` | Almost always "Unknown" |
| Case | `status_14` | Often "Case?" (unconfirmed) |
| Ammeter Reading | `color_mkwr7s1s` | Only on BM items |
| Liquid Damage? | `color_mkqg8ktb` | Defaults to "Liquid Damage?" |
| Battery/Screen/Casing/Function (Reported) | Various | BM grading — reported condition |
| Battery/Screen/Casing/Function (Actual) | Various | BM grading — actual found condition |
| Been to Apple? | `lookup_mkshhjqh` | Mirror from Client Info Capture board |
| Previous Repairs | `lookup_mkwm9z32` | Mirror from Client Info Capture board |
| Fault to Repair (Details) | `lookup_mkshzp3t` | Mirror from Client Info Capture board |
| Notes for Repairer | `lookup_mkshh7sn` | Mirror from Client Info Capture board |

### Key insight: Mirror columns
Several intake columns mirror from a **Client Information Capture** board (linked via `board_relation_mkshr9ah`). The intake system needs to write to THAT board to populate these mirrors.

---

## Existing Flow Documentation (Jarvis Workspace)

Jarvis has already documented detailed question trees from Meesha's handwritten flows:

| File | Location | Contents |
|------|----------|----------|
| `REQUIREMENTS.md` | `~/.openclaw/agents/main/workspace/docs/intake-system/` | Full requirements + vision (from Ricky voice note Feb 9) |
| `macbook-flows.md` | Same directory | 11 MacBook decision trees: Display (2 parts), Trackpad, Touch Bar, Keyboard, Power/Battery, Liquid Damage, Audio, Camera, Connectivity, Dustgate |
| `iphone-flows.md` | Same directory | 15 iPhone/iPad decision trees: Charging/Power, Display, iPad Display, Audio (2 parts), Connectivity (3 parts), Camera, Face ID, Liquid Damage (2 parts), Power/Battery (2 parts), Rear Glass |
| `INTAKE-REQUIREMENTS.md` | `~/.openclaw/agents/main/workspace/systems/intake/` | Detailed requirements + tech stack considerations |
| SOP Cheat Sheets | Monday board 18250254050 | Walk-in checklist, turnaround times, common objections, payment policy, escalation rules |

**Gaps still to document:**
- Back Market trade-in test matrices (per device model, functional vs non-functional)
- Apple Watch intake flows
- Pre-check checklist specifics (visual inspection standards, what "pass" looks like)
- Mail-in specific flow (vs walk-in)
- Courier-specific flow

**Key reference IDs:**
- Monday Main Board: `349212843`
- Monday Parts/Stock Board: `985177480`
- Monday Products Board: `2477699024`
- Client Information Capture board: Legacy Typeform board (linked via `board_relation_mkshr9ah`) — to be replaced by this intake system

---

## Phasing (One Phase at a Time)

### Phase 1: Foundation — Backend API + Supabase Schema + Intercom/Monday Integration + React scaffold
### Phase 2: Repair Intake Flow — Data-driven flow engine + MacBook/iPhone question trees + universal questions + password verification + stock check
### Phase 3: Diagnostic Intake Flow — Device on/off branching + fault-specific trees + pre-checks
### Phase 4: Trade-In Flow — Functional/non-functional paths + per-model test matrices + reported vs actual grading + reconciliation
### Phase 5: Polish — Photo documentation, notification system, red flag alerts, analytics dashboard, ops-intake agent integration

---

## Phase 1 — Foundation (This Build)

### Deliverables

1. **New Supabase tables** for intake data
2. **FastAPI backend** (port 8003) with Intercom + Monday.com endpoints
3. **Nginx config** for `intake.icorrect.co.uk`
4. **React app scaffold** with Supabase client, routing, responsive layout
5. **Intercom conversation lookup** — search by name/email, pull conversation history
6. **Monday.com write capability** — create items, update columns, write updates

### 1.1 Supabase Schema (new tables)

```sql
-- Intake sessions: one per device drop-off
CREATE TABLE intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monday_item_id TEXT,                    -- Monday.com item ID
  intercom_conversation_id TEXT,          -- Linked Intercom conversation
  intake_type TEXT NOT NULL CHECK (intake_type IN ('repair', 'diagnostic', 'trade_in')),
  service_method TEXT CHECK (service_method IN ('walk_in', 'mail_in', 'courier')),
  device_category TEXT,                   -- iPhone, iPad, MacBook, Apple Watch, etc.
  device_model TEXT,                      -- Specific model
  serial_number TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_type TEXT,                       -- End User, Corporate, BM, etc.

  -- Intake status tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'pending_payment', 'pending_parts', 'completed', 'cancelled'
  )),
  intake_by TEXT,                         -- Who did the intake (Adil, Andres, etc.)
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Synced to Monday
  synced_to_monday BOOLEAN DEFAULT FALSE,
  monday_sync_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question responses: stores all answers from the guided flow
CREATE TABLE intake_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES intake_sessions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,             -- e.g. 'been_to_apple', 'liquid_type', 'charger_type'
  question_text TEXT NOT NULL,            -- The question as displayed
  response_value TEXT,                    -- The answer
  response_type TEXT DEFAULT 'text',      -- text, boolean, select, multi_select
  category TEXT,                          -- 'device_history', 'condition', 'customer_info', etc.
  flagged BOOLEAN DEFAULT FALSE,          -- Red flag responses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-checks: password verification, basic tests, visual inspection
CREATE TABLE intake_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES intake_sessions(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,               -- 'password', 'visual', 'functional', 'stock'
  check_name TEXT NOT NULL,               -- 'passcode_verified', 'screen_cracks', 'charges_ok'
  result TEXT NOT NULL,                   -- 'pass', 'fail', 'na', 'skipped'
  notes TEXT,
  checked_by TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intake photos: visual documentation
CREATE TABLE intake_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES intake_sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,                -- Supabase Storage URL
  photo_type TEXT,                        -- 'front', 'back', 'damage', 'serial', 'liquid'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 FastAPI Backend

**Location:** `/home/ricky/intake-system/backend/`
**Service:** `intake-api.service` (systemd user service, port 8003)

Endpoints:
```
GET  /api/health                          → 200 + timestamp
GET  /api/intercom/search?q=<name/email>  → Search contacts + recent conversations
GET  /api/intercom/conversation/<id>      → Full conversation with messages
POST /api/monday/item                     → Create item on Main Board (349212843)
PUT  /api/monday/item/<id>                → Update item columns
POST /api/monday/item/<id>/update         → Write an update/comment
GET  /api/monday/item/<id>                → Get item with all column values
GET  /api/monday/stock-check?serial=<sn>  → Check parts availability
```

**Reuses:** Existing Monday.com (`monday.py`) and Intercom (`intercom.py`) wrapper functions from `/home/ricky/mission-control-v2/scripts/integrations/`.

### 1.3 React App Scaffold

**Location:** `/home/ricky/intake-system/frontend/`
**Stack:** Vite + React + TypeScript + Tailwind v4 (same as MC v2 dashboard)

Routes:
```
/                    → Dashboard: active intakes, today's appointments
/intake/new          → Start new intake (select type: repair/diagnostic/trade-in)
/intake/:id          → Active intake session (guided flow)
/intake/:id/summary  → Completed intake summary (printable)
```

Responsive: tablet-first (iPad), scales to iPhone and desktop.

### 1.4 Nginx Config

```
intake.icorrect.co.uk → SSL (certbot)
  /              → /home/ricky/intake-system/frontend/dist/ (static React)
  /api/*         → proxy_pass localhost:8003 (FastAPI)
```

### 1.5 DNS

A record: `intake.icorrect.co.uk` → 46.225.53.159 (SiteGround DNS)

---

## Phase 1 Acceptance Criteria

- [ ] `curl https://intake.icorrect.co.uk` returns the React app
- [ ] `curl https://intake.icorrect.co.uk/api/health` returns 200
- [ ] Intercom search returns conversations for a known customer
- [ ] Monday.com item can be created and updated via the API
- [ ] Supabase tables exist and accept inserts
- [ ] React app renders on iPad, iPhone, and desktop
- [ ] Basic auth protects the app (same as MC dashboard)

---

## Files to Create/Modify

### New files (intake-system)
```
/home/ricky/intake-system/
├── backend/
│   ├── main.py                    # FastAPI app
│   ├── routers/
│   │   ├── intercom.py            # Intercom search + conversation endpoints
│   │   ├── monday.py              # Monday.com CRUD endpoints
│   │   └── health.py              # Health check
│   ├── services/
│   │   ├── intercom_client.py     # Wraps existing intercom.py functions
│   │   └── monday_client.py       # Wraps existing monday.py + adds mutations
│   ├── requirements.txt           # fastapi, uvicorn, httpx, python-dotenv, supabase
│   └── .env                       # → symlink to /home/ricky/config/api-keys/.env
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── NewIntake.tsx
│   │   │   ├── IntakeFlow.tsx
│   │   │   └── IntakeSummary.tsx
│   │   ├── components/            # Shared UI components
│   │   ├── hooks/
│   │   │   └── useRealtimeTable.ts  # Copy from MC v2 dashboard
│   │   └── lib/
│   │       ├── supabase.ts        # Copy pattern from MC v2 dashboard
│   │       ├── api.ts             # Backend API client
│   │       └── types.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
└── schema/
    └── intake-tables.sql          # Supabase migration
```

### Existing files to reuse (NOT modify)
- `/home/ricky/mission-control-v2/scripts/integrations/monday.py` — Monday.com GraphQL wrapper
- `/home/ricky/mission-control-v2/scripts/integrations/intercom.py` — Intercom API wrapper
- `/home/ricky/mission-control-v2/dashboard/src/lib/supabase.ts` — Supabase client pattern
- `/home/ricky/mission-control-v2/dashboard/src/hooks/useRealtimeTable.ts` — Realtime hook

### Server config (new)
- `/etc/nginx/sites-available/intake` — Nginx config
- `~/.config/systemd/user/intake-api.service` — systemd service

---

## Verification

```bash
# Backend health
curl -s https://intake.icorrect.co.uk/api/health

# Intercom search
curl -s https://intake.icorrect.co.uk/api/intercom/search?q=Konstantin

# Monday.com item fetch
curl -s https://intake.icorrect.co.uk/api/monday/item/11225730773

# Supabase tables
ssh ricky@46.225.53.159 "python3 -c \"
from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv('/home/ricky/config/supabase/.env')
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_ANON_KEY'])
print(sb.table('intake_sessions').select('*').limit(1).execute())
\""

# Frontend on all devices
# Open https://intake.icorrect.co.uk on iPad, iPhone, desktop

# systemd service
ssh ricky@46.225.53.159 "systemctl --user status intake-api"
```

---

## What Phase 1 Does NOT Include (Deferred)

- Guided question flows (Phase 2-4)
- Conditional logic per device type (Phase 2-4)
- Password verification workflow (Phase 2)
- Parts stock checking at intake (Phase 2)
- Photo upload/documentation (Phase 5)
- Pre-check checklists (Phase 5)
- Trade-in test matrices (Phase 4)
- Reported vs Actual reconciliation (Phase 5)
- ops-intake agent integration (future — agent is dormant, needs Telegram group first)

---

## Ricky's Priorities (stated Feb 18)

1. **Parts check + password/passcode check** — #1 and #2 causes of delay. These are foundational.
2. **Tech availability/queue scheduling** — Needs a separate system (not part of intake MVP, but intake should feed into it)
3. **Additional faults found** — If not a diagnostic, need quick client contact flow (automated)
4. **System must replace current process** — Not just another tool. Must be able to take over for Typeform + manual Monday entry.

---

## Ricky Action Required Before Build

1. **Create DNS A record**: `intake.icorrect.co.uk` → 46.225.53.159 (SiteGround DNS panel)
2. **Confirm**: Basic auth (same creds as mc.icorrect.co.uk) is fine for now?
3. Client Information Capture board is legacy Typeform — intake system replaces it.

---

## Appendix A: Monday.com Main Board Reference (ID: 349212843)

### Status Column Values (status4)
```
0: Awaiting Confirmation    8: Quote Sent         104: Queued For Repair
1: Received                 9: BER/Parts          105: Awaiting Part
2: Diagnostic Complete     10: Client To Contact  106: Booking Confirmed
3: Courier Booked          11: Invoiced           107: QC Failure
5: New Repair              12: Under Repair       108: Book Courier
6: Returned                13: Diagnostics        109: Password Req
7: Clamped                 14: Repair Paused      110: Ready to Quote
16: Repaired               15: Reassemble         151-160: Refurb/Cleaning/Software/etc.
17: Part Repaired          18: Expecting Device
101: Error                102: Ready To Collect   103: Book Return Courier
```

### Client Column Values (status)
```
0: Corporate   1: Corporate Warranty   2: BM   3: Refurb   4: iCorrect
5: Unconfirmed   9: B2B   16: End User   19: Warranty
```

### Repair Type Column Values (status24)
```
0: Warranty   1: BER   2: Diagnostic   3: Counteroffer   4: Quote Rejected
5: Unconfirmed   6: Purchased   7: Listed   8: To List   9: Board Level
10: Sold   11: Trade-In   12: Pay-Out   13: IC ON   14: BM RTN/RFD
15: Repair   16: Task   17: IC OFF   18: Unrepairable   19: Unprocessable
101: Parts   102: Booking Cancelled   103: Manual   104: Unlisted   109: No Fault Found
```

### Board Groups (workflow stages)
```
New Orders | Today's Repairs | Incoming Future
Safan (Short/Long Deadline) | Andres | Mykhailo | Roni | Adil
Quality Control | BMs Awaiting Sale | Client Services (To Do / Awaiting Confirmation)
Outbound Shipping | Devices In Hole | Awaiting Parts | Ferrari
New Orders (Not Confirmed) | Awaiting Confirmation of Price
Trade-In BMs Awaiting Validation | BMs No repair/iCloud
Awaiting Collection | Devices Left in Long Term | Selling
Purchased/Refurb Devices | Completed Refurbs | Recycle List
Returned | Cancelled/Missed Bookings | Locked | Leads to Chase
```

### Key Intake Column IDs
```
service          → Service (Walk-In, Mail-In, Gophr Courier)
status4          → Status
status24         → Repair Type
status           → Client type (End User, BM, Corporate...)
text8            → Passcode
text5            → Email
text00           → Phone Number
text4            → IMEI/SN
text368          → Walk-in Notes
text_mm087h9p    → Intercom ID
color_mkvmn8wr   → Info Capture
color_mm01jjsx   → Passcode Verified
color_mm01xyth   → Basic Test
color_mm01323z   → Stock Status
long_text_mkqhfapq → Intake Notes
color_mkyp4jjh   → iCloud
status_14        → Case
color_mkwr7s1s   → Ammeter Reading
color_mkqg8ktb   → Liquid Damage?
status8          → Colour
board_relation5  → Device (linked board)
date4            → Received date
date36           → Deadline
date6            → Booking Time
date_mkypmgfc    → Intake Timestamp
board_relation_mkshr9ah → Link - Client Info Capture (legacy Typeform)
board_relation   → Requested Repairs
board_relation_mm01yt93 → Parts Required
color_mkse6rw0   → Problem (Repair)
color_mkse6bhk   → Problem (Client)
```

### BM Grading Columns (Reported vs Actual)
```
color_mkqg66bx → Battery (Reported)    color_mkqg4zhy → Battery (Actual)
color_mkqg7pea → Screen (Reported)     color_mkqgtewd → Screen (Actual)
color_mkqg1c3h → Casing (Reported)     color_mkqga1mc → Casing (Actual)
color_mkqg578m → Function (Reported)   color_mkqgj96q → Function (Actual)
color_mkp5ykhf → LCD Pre-Grade
status_2_mkmc4tew → Lid Pre-Grade
status_2_mkmcj0tz → Top Case Pre-Grade
status_2_Mjj4GJNQ → Final Grade
```

### Other Key Board IDs
```
Parts/Stock Board: 985177480
Products Board: 2477699024
Adil's Checklist: 18371922956
SOP Cheat Sheets: 18250254050
Sales Archive: 18394526881
```

---

## Appendix B: Real Item Audit (Feb 11-18, 2026)

### Repair Example: Konstantin Gensitskiy (ID: 11225730773)
- Walk-in, iPad Pro 12.9" battery replacement, End User
- Walk-in notes: "Battery replacement" — that's it
- Info Capture: "No Information", Passcode: "Device is erased"
- Passcode Verified: Verified, Stock Status: Low Stock
- Intercom ID: 215473026011907
- Tech: Andres. Diag time: 11min, Repair time: 6sec, Refurb: 3hr
- **Gap**: No pre-checks, no intake notes, no visual inspection

### Diagnostic Example: Jexna (ID: 11285528596)
- Walk-in, MacBook Air M2, liquid damage, End User
- Adil's update: "Client dropped water on keyboard, Data backed up, Password verified, SN Verified" — 4 lines
- Passcode: "Covid!2025", Verified: Yes, Basic Test: Passed
- Tech: Safan. Diag time: 40min
- **Gap**: No questions about when damage happened, liquid type, been to Apple, charger, previous repairs

### BM Example (Safan): BM 1430 Joe Newman (ID: 11266453372)
- Mail-in, MacBook Pro 16" 2021, Trade-in (Pay-Out)
- Ammeter: 5V, Screen Reported: Good → Actual: Fair, Casing: Good → Fair
- Function: Not Functional both reported and actual (truthful client)
- Passcode: Unable to verify, Liquid Damage: No
- Diag time: 3min, Repair: 1hr22min, Cleaning: 6min

### BM Example (Mykhailo): BM 1364 Peyton Edwards (ID: 11148112056)
- Mail-in, Trade-in, Ammeter: 5V
- Screen Reported: Good → Actual: Fair, Casing: Good → Fair
- Function: Not Functional (both), Liquid: No
- Passcode: Unable to verify
- Diag by: Andres, Repair by: Mykhailo

---

## Appendix C: Existing Infrastructure to Reuse

| Asset | Path | Purpose |
|-------|------|---------|
| Monday.com API wrapper | `/home/ricky/mission-control-v2/scripts/integrations/monday.py` | GraphQL queries, get_boards, get_board_items, get_item_updates |
| Intercom API wrapper | `/home/ricky/mission-control-v2/scripts/integrations/intercom.py` | get_conversations, get_conversation, search_contacts |
| Supabase client pattern | `/home/ricky/mission-control-v2/dashboard/src/lib/supabase.ts` | React Supabase init |
| Realtime hook | `/home/ricky/mission-control-v2/dashboard/src/hooks/useRealtimeTable.ts` | Generic realtime subscription |
| Supabase schema | `/home/ricky/mission-control-v2/scripts/supabase/setup-schema.sql` | 9 existing v2 tables |
| Webhook service | `/home/ricky/mission-control-v2/scripts/webhooks/agent-trigger.py` | FastAPI on port 8002 (pattern to follow) |
| MacBook flows | `~/.openclaw/agents/main/workspace/docs/intake-system/macbook-flows.md` | 11 decision trees |
| iPhone flows | `~/.openclaw/agents/main/workspace/docs/intake-system/iphone-flows.md` | 15 decision trees |
| Requirements | `~/.openclaw/agents/main/workspace/docs/intake-system/REQUIREMENTS.md` | Full requirements doc |
| SOP Cheat Sheets | Monday board 18250254050 | Walk-in checklist, turnaround times, objections, payment, escalation |

---

## Planning Status

**Completed:**
- [x] Monday.com main board audit (columns, groups, status values)
- [x] Real item data audit (4 examples across repair/diagnostic/BM)
- [x] Existing flow documentation inventory (Jarvis workspace)
- [x] Infrastructure inventory (Supabase, integrations, dashboard patterns)
- [x] Architecture design (React + FastAPI + Supabase + Monday sync)

**In Progress:**
- [ ] Map each intake flow in detail with real Monday examples (Ricky sending voice transcriptions)
- [ ] BM trade-in test matrices per device model
- [ ] Pre-check specifics per repair type
- [ ] Additional faults found → client contact automation flow

**Not Started:**
- [ ] Apple Watch flows
- [ ] Tech queue scheduling system (separate from intake but intake feeds into it)
- [ ] Mail-in vs walk-in flow differences
- [ ] Courier-specific flow

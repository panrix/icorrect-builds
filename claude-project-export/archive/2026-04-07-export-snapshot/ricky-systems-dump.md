# Ricky's Systems Vision — Raw Dump

**Date:** 2026-04-05
**Source:** Voice notes from Ricky, captured and structured by Jarvis
**Purpose:** Feed into the agent-rebuild planning. Code to pick up and fold into build phases.

---

## The Big Picture

Monday is currently the interactive layer AND the data store. That needs to split:

- **Monday** → stays as source of truth / data backend (short term), eventually replaced by Supabase
- **Supabase** → mirrors Monday, becomes the real database. Enables custom UI development without Monday's rigidity
- **React frontends** → purpose-built interfaces for every team interaction. iPad + desktop. Replace Monday boards, Slack messages, and LLM chat as the way the team works
- **Scripts** → all deterministic logic. LLMs only where genuine reasoning/writing is needed
- **LLM role** → categorisation of intake notes, draft writing (CS), market analysis. Everything else is scripted

---

## System 1: Client Intake Form (Client-Facing)

**What:** Replace Typeform with a custom React flow hosted on our domain.

**Current state:** Typeform collects client details, submits to Slack. Costs £50-70/mo.

**Phase 1:** Replicate the current Typeform flow exactly. Same questions, same logic, same Slack submission. Kill the Typeform subscription.

**Phase 2:** Add the additional questions and pricing lookups from the product spec that was being written up. Introduce conditional logic based on device type, repair type, drop-off method.

**Phase 3:** Full integration — submission writes to Supabase, triggers downstream systems (workshop intake, queue allocation).

---

## System 2: Workshop Intake System (Team-Facing, iPad)

**What:** When a walk-in client arrives and a tech goes upstairs to see them, they have a single-screen iPad view with everything the client already submitted.

**The problem it solves:** Clients say "I already wrote that in my email" when techs ask questions that were already answered in the intake form. Makes the team look unprepared. Both Andres and Nahid have flagged this.

**What's on screen:**
- All client-submitted details, broken out by category (not a wall of text)
- Device details section
- Serial number field → button to run spec lookup script (confirms model + specs)
- Image upload capability
- Description / notes field
- Pre-repair form answers (everything we currently ask)
- Small LLM-powered box: takes freeform client notes and structures them so techs don't miss anything (e.g. "client mentioned previous liquid damage")

**Key principle:** LLM does ONE job here — pre-process freeform text into structured fields at intake time. Everything else is script-driven.

**Data flow:** Client intake form → Supabase → Workshop intake screen auto-populates.

---

## System 3: Device Intake Checklist (Post-Client, Physical Device)

**What:** After the client leaves, a checklist confirms the device has been properly received and processed.

**Checklist items (examples):**
- Ammeter reading taken
- Device labelled
- Checked for dents/physical damage
- Confirmed powering on/off
- Masking tape applied (MacBooks)
- Allocated to staff member
- Client notified of expected timeline
- Client understands the deadline
- Any additional notes

**On submit:** Device enters the repair/diagnostic queue. All data written to Supabase + Monday.

---

## System 4: BackMarket Intake System

**What:** Specialised intake flow for BM trade-in devices.

**Flow:**
1. Enter serial number → spec lookup
2. Select the BM order (shows order number, BM listing number)
3. iCloud check
4. Grade assessment questions
5. Parts required checklist → automatic "can repair / can't repair" calculation
6. Parts allocation from inventory
7. For non-functionals with power faults: **guided pre-diagnostic** — scripted logic tells intake staff which test points to check, results recorded

**Key value:** Speed up BM intake, capture diagnostic data before it hits the workshop floor. All logic-driven, no LLM needed.

---

## System 5: Mail-In Intake

**What:** Variant of walk-in intake for posted devices.

**Flow:**
1. Confirm device physically received
2. Pull up customer notes from the intake form
3. Check: anything to contact the client about?
4. Flag any discrepancies (device doesn't match description, additional damage, etc.)
5. Allocate to diagnostic/repair queue

**Same system, different entry point.** Walk-in and mail-in share the underlying intake engine.

---

## System 6: Interactive Diagnostic System (Tech-Facing)

**What:** iPad/web app that guides techs through diagnostics with structured test paths.

**Two diagnostic paths:**

### Liquid Damage Path
- Guided image capture of affected board areas
- Structured upload with area labels
- Severity assessment checklist

### Non-Liquid Damage Path (Fault Finding)
- Logic-driven test point sequence based on reported symptoms
- "Go test here → what's the reading? → based on that, go test here"
- Signature fault pattern matching (all scripted logic, not LLM)
- Interactive board view showing techs where to probe next

**Data captured:** All test results recorded and linked to the repair record. When the tech picks up the job, they see exactly what was found at intake/pre-diagnostic.

---

## System 7: Tech Repair Dashboard

**What:** The tech's daily workspace. Replaces Monday as their primary interface.

**Views:**
- **Queue (Kanban)** — their assigned repairs, priorities, ETAs
- **Repair detail** — open a job and see everything: client info, intake data, diagnostic results, parts allocated, history
- **Notes** — write repair notes, log delays, record what was done
- **Parts used** — log actual parts consumed vs what was allocated (feeds back to inventory)
- **Testing module** — integrated with the diagnostic web app. Login with a code, complete structured post-repair testing, results feed into the repair record

**Why not Monday:** Monday is rigid. Can't build conditional logic, can't integrate testing flows, can't show contextual information from multiple sources in one view.

---

## System 8: Inventory Management System

**What:** Custom React UI replacing the Monday parts board.

**Features:**
- Real-time stock levels per part
- Click into a part → see quantity in stock, what's reserved, which jobs each reservation is for
- Auto-updates when stock arrives
- **Stock allocation model** — parts earmarked for specific jobs at intake, deducted when used. Replaces ad-hoc picking
- **China order builder** — running order with line items and value, review and submit
- Search/query across all stock
- Low stock alerts

**Backend:** Supabase (mirroring Monday parts board initially).

---

## System 9: Coordinator Dashboard

**What:** Head coordinator's view of everything flowing through the workshop.

### Head Coordinator View
- All devices in the system, where they are, what's next
- Bottleneck detection (what's stuck and why)
- Predicted completion times based on queue positions

### Task Management (Sub-Coordinator)
- Kanban: pending → in progress → completed
- Two types of tasks:
  1. **Repair-dependent** — tied to an active device (e.g. "call client about issue found by tech")
  2. **Standalone** — internal tasks (e.g. "ship forgotten case to client")
- Each task shows: client, issue, what's needed, running updates
- Updates write back to Monday

---

## System 10: Shipping Interface

**What:** Outbound shipping queue with verification checklists.

**Flow:**
1. See all devices ready to ship
2. Per device: label bought? Serial number verified against order? Physical check done?
3. Tick all checks → confirm ship
4. Prevents mistakes (wrong device shipped, missing label, etc.)

---

## System 11: QC System

**What:** Quality control interface replacing Monday-based QC process.

**Features:**
- **Conditional checklists by repair type:**
  - Screen repair → check bezels, display quality, touch response
  - Battery repair → test battery percentage, cycle count
  - (Each repair type has its own required checks)
- Cross-references the tech's completed testing module results
- **Pending QC queue**
- **Rejection flow:** rejected item → back into tech's repair queue → system estimates when it'll return for re-QC
- **Predictive ETAs:** based on tech's current queue, calculates when the rejected item will be ready again. Feeds into Ronny's (QC) schedule so he can plan his day

---

## Architecture Summary

```
CLIENT SIDE                    TEAM SIDE
-----------                    ---------
                               Coordinator Dashboard (9)
Client Intake (1)                    |
       |                    +--------+--------+
       v                    |                 |
Workshop Intake (2) ------> Tech Dashboard (7)
       |                    |        |
Device Intake (3)           |   Diagnostic (6)
       |                    |        |
BM Intake (4)               |   Testing Module
       |                    |        |
Mail-In Intake (5)          +--------+
       |                         |
       v                    QC System (11)
  Repair Queue                   |
       |                    Shipping (10)
       v                         |
  Inventory (8) <--- Parts ---> Out to client
```

**Tech stack:**
- Frontend: React.js (works on iPad + desktop)
- Backend: Supabase (mirrors Monday until full cutover)
- Scripts: Node.js for all deterministic logic
- LLM: Only for text categorisation (intake), draft writing (CS), and market analysis
- Monday: Data store during transition, eventually deprecated as interactive layer

**Key principles:**
1. Scripts, not LLMs, for everything deterministic
2. Monday stays as backend, custom React replaces the UI
3. Supabase is the bridge — mirror Monday now, replace it later
4. Every system gets phased: Phase 1 = minimum useful, then iterate
5. iPad-first for workshop floor systems
6. Each system needs its own detailed spec before building

---

## What's NOT In This Dump (Yet)

- Customer-facing status tracking / portal
- Finance / invoicing systems
- BackMarket listing management UI
- Marketing / SEO dashboards
- Team performance / KPI dashboards
- CS email drafting workflow (Alex's inbox triage)

Ricky may add these in a follow-up session.

---

*Captured by Jarvis from voice notes. For Code to pick up and fold into the agent-rebuild plan.*

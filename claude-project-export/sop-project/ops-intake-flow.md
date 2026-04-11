# Intake Flow

Status: needs-operator-confirmation
Last verified: 2026-03-31
Verification method: build specs + operator/process confirmation
Evidence sources:
- /home/ricky/builds/intake-system/SPEC.md
- /home/ricky/builds/intake-system/flows/diagnostic-intake-flow.md
- /home/ricky/builds/intake-system/flows/standard-repair-flow.md
- /home/ricky/builds/intake-system/flows/bm-tradein-flow.md
- /home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md
- /home/ricky/builds/intake-system/docs/staged/2026-03-31/intake-process-v2.md
- /home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/00-MASTER-PLAN.md
**Full specs:** /home/ricky/builds/intake-system/

This document mixes:

- verified build/design intent
- observed workflow assumptions
- people/process claims that need operator confirmation

---

## CRITICAL CONTEXT

- **Adil was dismissed on March 5, 2026** (insubordination)
- **Andres is doing some intake work with NO SOP**
- **No verified company-wide intake SOP exists yet** -- this is one of the highest-leverage gaps in the business
- A staged pilot proposal exists at `/home/ricky/builds/intake-system/docs/staged/2026-03-31/intake-process-v2.md`, but it is not canonical process truth yet
- The intake system build (React + FastAPI) is specced but not yet built

---

## Hard Gates (Spec-Derived Candidate Rules, Not Yet Verified Live SOP)

From SPEC.md -- these are intended hard gates in the planned intake system and should not be mistaken for a verified live operator SOP:

1. **Missing required fields block progression** -- cannot advance without complete data
2. **No passcode = reject** -- do not accept device for diagnostics without passcode
3. **Passcode must be verified** where testable before queue entry
4. **Parts must be checked** before queue entry -- confirm availability
5. **Turnaround must be confirmed** with customer and recorded
6. **Intake photos required** before queue entry
7. **Corporate passcode agreements respected** -- do not re-ask when policy exists
8. **Intake to tech handoff must be complete** -- tech should not need to reconstruct context

---

## Working Intake Path Assumptions (Not Verified SOP)

These path summaries reflect design intent and inferred practice from build specs and inherited notes.

They are useful working assumptions, not confirmed current operator SOP.

### Walk-In
1. Greet customer, confirm name + booked repair (cross-reference Monday booking)
2. Verify device model matches booking
3. Check device condition on arrival (note pre-existing damage)
4. Create/update Monday item on Main Board (349212843)
5. Record: Serial/IMEI -> `text4`, Colour -> `status8`, Issues -> updates section
6. Print labels with job reference
7. Set status -> "Received" (`status4`) -- triggers customer notification
8. Set service type -> "Walk-In" in `service` column
9. Set device aside for diagnostic queue

### Mail-In
1. Device arrives via post/courier
2. Match to existing Monday item (should be in "Incoming Future" group)
3. Record serial, condition, any discrepancies from booking
4. Set status -> "Received"
5. Move to "Today's Repairs" group
6. Follow same diagnostic queue process

### BM Trade-In
Full separate workflow is not yet canonicalized in KB.

Current working sources:
- `/home/ricky/builds/intake-system/flows/bm-tradein-flow.md`
- `/home/ricky/builds/backmarket/sops/`

Summary:
1. BM order arrives (Flow 0 already created Monday items)
2. Match customer name on box to Monday board item
3. Enter serial -> triggers SickW iCloud check
4. Flow 2: spec validation + iCloud check
5. If locked: Flow 3 iCloud recheck
6. Diagnostic & grading
7. Payout
8. Refurbishment -> Listing -> Sale

---

## Universal Questions (all intakes)

Required baseline prompts regardless of repair type:
- Has this device been repaired before?
- Has the Apple Store seen this device?
- New or refurbished device?
- How did the fault occur?
- Passcode/password collection and verification status
- Secondary-fault authorisation (if additional faults found, can we proceed?)
- Battery upsell authorisation for relevant screen repairs

---

## Device-Specific Flows

Detailed decision trees exist at:
- `/home/ricky/builds/intake-system/device-flows/macbook-flows.md`
- `/home/ricky/builds/intake-system/device-flows/iphone-flows.md`
- `/home/ricky/builds/intake-system/device-flows/ipad-flows.md`
- `/home/ricky/builds/intake-system/device-flows/apple-watch-flows.md`

Operator flows:
- `/home/ricky/builds/intake-system/flows/client-ipad-flow.md`
- `/home/ricky/builds/intake-system/flows/standard-repair-flow.md`
- `/home/ricky/builds/intake-system/flows/diagnostic-intake-flow.md`
- `/home/ricky/builds/intake-system/flows/bm-tradein-flow.md`

---

## Planned System (Not Yet Built)

Two interfaces with shared data:

1. **Client-facing iPad interface** -- reception self-service triage, name lookup, price/turnaround awareness
2. **Team-facing internal interface** -- operator-guided workflow with hard-gated fields

Tech stack: React + TypeScript frontend, FastAPI integration service, Supabase for data + media, Nginx reverse proxy.

MVP target: MacBook screen repair intake, end-to-end.

---

## Staged Pilot Material (Not Canonical SOP)

The build repos currently contain intake pilot/build material that should not be mistaken for verified live process:

- `/home/ricky/builds/intake-system/docs/staged/2026-03-31/intake-process-v2.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/00-MASTER-PLAN.md`

Those files are useful as proposed workflow/build direction.

They are not confirmation that the Slack briefing flow, voice-note transcription, or pilot process has been rolled out as current operating truth.

---

## Known Gaps

- No SOP for intake exists -- highest-leverage gap
- No consistent conditional question flow across repair/diagnostic/BM paths
- Information lost between customer conversations and workshop execution
- No automated follow-up for no-show bookings
- Passcode verification is inconsistent
- Parts availability not checked systematically at intake
- Monday board automations undocumented -- moves between groups are automated but nobody knows which automation does what

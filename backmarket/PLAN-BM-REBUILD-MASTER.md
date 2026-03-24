# Plan: BackMarket Rebuild Master Plan

## Purpose

This document defines the recommended rebuild order for the BackMarket automation system.

The goal is not just to "ship all scripts". The goal is to rebuild the operating system for BackMarket in a way that:

- protects cash
- prevents wrong actions on live orders
- prevents bad listings and bad payouts
- maximizes profitability
- gives future agents a stable reference point

This plan is intended to be thorough enough to hand to another agent for QA and execution planning.

---

## Rebuild Goal

BackMarket should become a reliable, agent-operable system covering:

- buyback intake and payout
- sale detection and order handling
- dispatch and shipment confirmation
- listing creation and reactivation
- reconciliation and pricing control
- buyback buy-box adjustment
- documentation and handoff

This rebuild explicitly prioritizes:

1. safe live operation
2. profitability
3. process clarity
4. maintainability

This rebuild does **not** prioritize maximum automation at any cost.

---

## Locked Business Rules

These are the decisions already made and should be treated as fixed policy for the rebuild.

### Sales Acceptance

- New BM sales should auto-accept when the match is perfect.
- Matching must be exact enough to avoid wrong-device assignment.

### Payout

- Payout should auto-run at any value.
- No separate `> £200` approval gate applies.
- Payout is allowed only when:
  - model/spec check matched
  - no iCloud lock
  - no counter-offer is needed

### Dispatch / Shipping

- `dispatch.js` is in scope.
- After label purchase succeeds, `status4` should move to `Return Booked`.
- Shipment confirmation must include:
  - serial number
  - Royal Mail tracking number
- After successful shipment confirmation to BM, the BM Devices item should move to the `Shipped` group.

### SOP 03 Missing Automations

Include both:

- arrival notification automation
- auto-move from `Incoming Future` to `Today's Repairs` on receive

### Pricing / Buyback Guardrail

- Flat `£150` net target for the buyback engine.
- Optimize for profit first, not order-count first.
- Buyback auto-adjustment is allowed with guardrails.

### Order Capacity

- BM order allowance rises to 20/day.
- For phase 1, treat 20/day as a ceiling, not a target.
- Do not force a fixed split between resale and donor-parts acquisition yet.

### Donor-Parts Strategy

- Intel donor-parts strategy is real and important.
- It should be documented now.
- It should remain a phase 2 module, not part of the first live buyback engine.

### SOP 10 / 11 / 12

- Documentation only in this rebuild.
- No automation required in the first live build.

---

## Design Principle

The main reason previous rebuild attempts failed appears to be a mix of:

- unresolved policy decisions
- unsafe coupling between scripts
- inconsistent source-of-truth rules
- dirty legacy data, especially around listings

This rebuild should therefore follow one strict principle:

**Lock business rules first, then automate only the paths that are proven safe.**

That means:

- irreversible financial actions must be guarded
- dirty legacy listing data must not be trusted
- runtime dependencies must be sequenced explicitly
- documentation must record policy, not just code structure

---

## Recommended Phase Structure

## Phase 1: Security and Runtime Hardening

### Goal

Stop unsafe public exposure before expanding automation.

### Scope

- Bind all webhook services to `127.0.0.1`
- Put all webhook traffic behind nginx + SSL
- Confirm all Monday webhook URLs
- Confirm Slack interactivity route
- Document:
  - ports
  - routes
  - restart commands
  - health checks
  - runtime ownership

### Why First

There is no value in improving the business logic if live webhook endpoints remain unsafe.

### Exit Criteria

- Public IP cannot hit BM webhook endpoints directly
- nginx is the only ingress path
- live webhook map is confirmed and documented

---

## Phase 2: Core Transaction Services

### Goal

Stabilize the highest-value live transaction flows first.

### Scope

Build or harden the flows for:

- sales detection and auto-accept
- payout webhook
- dispatch batch label-buying
- shipment confirmation

### Included Rules

#### Sales Detection

- Auto-accept only on perfect match
- Update Monday and BM Devices consistently

#### Payout

- Auto-run when:
  - spec matched
  - no iCloud lock
  - no counter-offer pending

#### Dispatch

- Buy labels in batch
- Write tracking to Monday
- Set `status4` to `Return Booked`
- Post labels / slips to Slack for team handling

#### Shipment Confirmation

- Send serial + RM tracking to BM
- Move BM Devices item to `Shipped`

### Why This Phase Comes Early

This phase covers the clearest operational cash flow:

- sales
- payout
- shipment

If these are stable, the business can keep moving while the harder listing and pricing layers are hardened.

### Exit Criteria

- Sales are detected and accepted correctly
- Payout path follows policy exactly
- Dispatch and ship-confirmation are clearly separated
- Tracking and serial are correctly propagated

---

## Phase 3: Intake / Diagnostic Support Automations

### Goal

Close the inbound operational gaps that currently remain manual.

### Scope

- iCloud recheck extraction into standalone runtime
- arrival notification automation
- auto-move from `Incoming Future` to `Today's Repairs` on receive

### Why This Matters

These automations improve operational flow and reduce queue confusion, especially on inbound trade-ins.

### Exit Criteria

- Locked-device recheck is standalone and reliable
- Daily arrival visibility exists
- Receive-state moves items into the repair queue automatically

---

## Phase 4: `list-device.js` Safe Go-Live

### Goal

Fix the highest-risk automation before broad live use.

### Context

This is the part of the system that has caused the most damage recently:

- wrong spec listed
- wrong colour listed
- legacy BM listing reuse based on unreliable identity
- non-congruent SKUs across existing BM listings

### Scope

Implement the hardening plan in:

- `backmarket/LIST-DEVICE-SAFE-GO-LIVE-PLAN.md`

That includes:

- exact identity gates
- colour hard-blocking
- strict stored-listing validation
- no fuzzy acceptance for risky models
- denylist of unsafe legacy listings
- stronger post-list verification
- single-item live rollout only at first

### Why This Needs Its Own Phase

`list-device.js` is not a normal script-hardening task. It is both:

- a code problem
- a dirty-data containment problem

Treating it like a standard deployment would risk repeating the same failures.

### Exit Criteria

- 5 to 10 successful single-item live runs
- zero critical listing mismatches
- no ambiguous legacy reuse in live mode
- bulk live remains disabled until these pass

---

## Phase 5: Pricing Reference and Sell-Side Controls

### Goal

Establish a clean daily reference loop for sale-side pricing and listing control.

### Scope

- daily price scraper
- retry mechanism for failed scrapes
- listings reconciliation
- sell-side buy-box check

### Runtime Order

The scraper is the reference source and should run first.

Recommended order:

1. scraper
2. reconciliation
3. sell-side buy-box

### Recommended Timing

- scraper: `00:00 UTC`
- reconciliation: after scraper completion, target `00:20-00:30 UTC`
- sell-side buy-box: `01:00 UTC`

### Why This Order Matters

Reconciliation should never race against scraper output.

Buy-box should never run before reconciliation if reconciliation is the safety layer checking whether BM and Monday still agree.

### Exit Criteria

- scraper runs first and retries failures hourly until complete
- reconciliation always runs after scraper
- buy-box runs after reconciliation
- no same-time collision between these services

---

## Phase 6: Buyback Buy-Box Engine

### Goal

Run the buyback bidding engine for profit, with explicit guardrails.

### Scope

- use the rebuilt JS version as the intended successor
- auto-adjust bids with guardrails
- flat `£150` net floor
- use real profitability lookup data as primary decision input

### Strategic Rule

The system is optimizing for:

- maximum profit on arrived orders

It is **not** optimizing for:

- raw order count
- filling all 20/day capacity regardless of return

### Runtime Assumption

The real-data lookup file is a valid strategic input:

- `/home/ricky/builds/data/buyback-profitability-lookup.json`

### Why This Phase Comes After Sale-Side Stabilization

The buyback engine is highly important, but it is also policy-sensitive. It should be activated once:

- profitability rules are locked
- the rebuild already has stable sale-side operations

### Exit Criteria

- no auto-bid moves below the flat `£150` floor
- real-data profitability coverage is used and reported
- engine behavior is auditable

---

## Phase 7: Documentation and Agent Handoff

### Goal

Make the system operable by future agents without rediscovering business rules.

### Scope

- update `backmarket/README.md`
- complete `00-BACK-MARKET-MASTER.md`
- create deployment/runbook docs
- create service map and schedule map
- capture policy in the shared KB

### KB Location

- `/home/ricky/.openclaw/agents/main/workspace/kb`

### KB Topics to Add

- fixed business rules
- sales acceptance policy
- payout rules
- dispatch vs shipping-confirm split
- listing identity rules
- buyback `£150` floor
- runtime schedules
- phase 2 donor-parts strategy

### Why This Matters

Without a strong KB, the system will drift again as agents infer policy from partial code instead of authoritative documentation.

### Exit Criteria

- another agent can read docs and KB and understand:
  - what each service does
  - what the hard rules are
  - what is allowed to auto-run
  - what is documentation-only

---

## Phase 8: Phase 2 Strategy Module

### Goal

Document the Intel donor-parts strategy without forcing it into the first live engine.

### Scope

- document the donor-parts strategy now
- define allowed SKUs
- define hard bid caps
- define future integration path

### Important Constraint

This should remain separate from the phase 1 default resale profitability engine.

### Why

The donor-parts strategy is legitimate, but it changes the economic logic. It should not be mixed into the default `£150` resale-profit system before the base rebuild is stable.

### Exit Criteria

- strategy documented clearly
- not yet merged into the live default buyback bidding logic

---

## Dependency Map

### Hard Dependencies

- Phase 1 blocks all live work
- Phase 2 depends on Phase 1
- Phase 4 should not be broadly activated until core transaction services are stable
- Phase 5 depends on runtime ordering and should follow base service stabilization
- Phase 6 depends on locked profitability policy
- Phase 7 happens throughout, but final handoff is last

### Soft Parallel Work

Some work can proceed in parallel once runtime safety is established:

- Phase 3 can progress alongside Phase 2
- Phase 7 documentation can be updated incrementally during all phases
- Phase 8 donor-parts documentation can be prepared without blocking phase 1 live work

---

## Recommended Build Order

1. Security / ingress hardening
2. Sales, payout, dispatch, shipping
3. Intake support automations
4. `list-device.js` hardening and controlled live rollout
5. Scraper, reconciliation, sell-side buy-box sequencing
6. Buyback buy-box engine with flat `£150` floor
7. Documentation + KB handoff
8. Intel donor-parts phase 2 specification

---

## QA Expectations

This master plan should be QA'd against:

- current SOPs
- current scripts
- legacy/active runtime assumptions
- path and repo ownership issues
- schedule conflicts
- unsafe business-rule ambiguity

QA should focus on:

- missing dependencies
- incorrect assumptions about which scripts are canonical
- sequencing risks
- policy mismatches
- places where "documentation only" is being confused with "in scope for automation"

---

## Final Principle

The rebuild should not fail again because of ambiguous intent.

The operating rule is:

**No more mixed policy and code guessing.**

If a business rule is fixed, document it and build around it.

If a path is unsafe, block it rather than trying to be clever.

If a legacy data source is dirty, treat it as contaminated until proven clean.

That is the correct way to get BackMarket live, profitable, and maintainable.

---

## QA Audit (Code, 24 Mar 2026)

**Auditor:** Code (Claude Code, VPS-verified)
**Scope:** Cross-reference PLAN-BM-REBUILD-MASTER.md against codebase, SOPs, running services, and PLAN-BM-FULL-AUTOMATION.md

### Verdict

Solid strategic framing. Phase ordering is correct. Business-rule-first approach is the right call. Several gaps need closing before execution.

---

### Issue 1: Hugo's buyback-monitor is invisible (HIGH)

Phase 6 references "Buyback Buy-Box Engine" and says to "use the rebuilt JS version as the intended successor." But Hugo's existing Python system (`buyback-monitor/buy_box_monitor.py`) is **actively running** via OpenClaw cron at 05:00 UTC daily. It auto-bumps bids with guardrails (profit ≥ £30, gap ≤ £100).

The plan doesn't acknowledge this system exists, doesn't say whether to keep it running during rebuild, and doesn't define cutover criteria.

**Resolution needed:**
- Acknowledge `buyback-monitor/` exists and is live
- State whether it stays active during Phase 1-5
- Define cutover criteria: when does the JS replacement take over?
- Define decommission: when is the Python version retired?

---

### Issue 2: Two script directories — `backmarket/scripts/` vs `bm-scripts/` (MEDIUM)

`/home/ricky/builds/bm-scripts/` exists with near-identical scripts to `backmarket/scripts/`. Contains: buy-box-check.js, list-device.js, reconcile.js, sale-detection.js, sent-orders.js, shipping.js, trade-in-payout.js, buyback-profitability-builder.js.

The plan doesn't mention `bm-scripts/` at all.

**Resolution needed:**
- Declare `backmarket/scripts/` as canonical (it is — repo reorganisation on 24 Mar moved everything there)
- Flag `bm-scripts/` for deletion or archival
- Confirm no running services reference `bm-scripts/` paths

---

### Issue 3: No JS buyback buy-box script exists yet (MEDIUM)

Phase 5 correctly identifies `buy-box-check.js` as sell-side (SOP 07). Phase 6 says to "use the rebuilt JS version" for buyback. But no JS buyback buy-box script exists. The only buyback buy-box implementation is Hugo's Python `buy_box_monitor.py`.

**Resolution needed:**
- Phase 6 should explicitly state: "Build new JS buyback buy-box service, replacing `buyback-monitor/buy_box_monitor.py`"
- Or: keep Hugo's Python version and refactor it to use the shared profitability formula

---

### Issue 4: Serial number in ship confirmation is undecided (MEDIUM)

Locked Business Rules state: "Shipment confirmation must include: serial number, Royal Mail tracking number."

But SOP 09 (line 229-231) documents that serial is **NOT currently sent** and flags it as an open question for Ricky:
> "Hugo's SOP-S4 specifies sending serial_number in the ship confirmation payload. The current icloud-checker webhook does NOT send serial. Should it?"

The plan treats this as a decided rule. It isn't confirmed.

**Resolution needed:**
- Ricky confirms: does BM sales API accept/require serial in ship confirmation?
- If yes: implement in Phase 2 shipping service
- If no: remove from locked rules

---

### Issue 5: Phase 3 automations have no implementation detail (MEDIUM)

"Arrival notification" and "auto-move from Incoming Future to Today's Repairs" are Phase 3 scope. SOP 03 flags these as missing automations (line 180-182). No code, scripts, or specs exist for either.

The plan says "close the inbound operational gaps" but doesn't specify:
- What triggers arrival notification? (BM API status change to RECEIVED? Monday webhook? Cron poll?)
- What triggers the auto-move? (Same question)
- Which Monday column/status drives each?

**Resolution needed:**
- Define trigger mechanism for each automation
- Specify which BM API state change or Monday column change fires them
- Determine if these are webhooks, cron polls, or Monday native automations

---

### Issue 6: Shared library not mentioned (HIGH)

PLAN-BM-FULL-AUTOMATION.md defines `backmarket/lib/` as a critical Phase 2 deliverable — the shared foundation every service imports:
- `monday.js` — GraphQL queries, status updates, comments
- `bm-api.js` — BM API operations
- `slack.js` — messaging
- `telegram.js` — alerts
- `config.js` — board IDs, column IDs, env loading
- `profitability.js` — margin/profit calculation

The master plan doesn't mention the shared lib. Without it, every service continues duplicating Monday/BM/Slack API code inline — the exact problem that created the monolith.

**Resolution needed:**
- Add shared library build as part of Phase 1 or early Phase 2
- All services in Phases 2-6 must import from `backmarket/lib/`
- This is not optional — it's the foundation

---

### Issue 7: Monolith decomposition mechanics are implicit (MEDIUM)

The master plan assumes Phase 2 delivers separate services for sales detection, payout, dispatch, and shipping. But it doesn't specify:
- Port allocation (8010-8013)
- systemd unit files
- nginx proxy routes
- How icloud-checker is slimmed from 1914 → ~600 lines

PLAN-BM-FULL-AUTOMATION.md has this detail. The master plan should reference it.

**Resolution needed:**
- Either incorporate the implementation detail into Phase 2, or
- Add a note: "Implementation mechanics (ports, systemd, nginx) per PLAN-BM-FULL-AUTOMATION.md"

---

### Issue 8: Relationship between the two plans is undefined (LOW)

Two plans exist:
- `PLAN-BM-REBUILD-MASTER.md` (this plan) — strategy, business rules, phase sequencing, exit criteria
- `PLAN-BM-FULL-AUTOMATION.md` — implementation detail: ports, files, line numbers, systemd units, nginx routes, shared lib spec

They overlap significantly. Neither references the other.

**Resolution needed:**
- Define hierarchy: Master plan = strategy and sequencing authority. Full Automation plan = implementation reference per phase.
- Add a note at the top of both plans clarifying this relationship

---

### Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Hugo's buyback-monitor invisible | HIGH | Needs acknowledgement + cutover plan |
| 2 | Two script directories | MEDIUM | Declare canonical, archive `bm-scripts/` |
| 3 | No JS buyback buy-box script | MEDIUM | Phase 6 must say "build new" or "keep Python" |
| 4 | Serial in ship confirmation | MEDIUM | Ricky decision needed |
| 5 | Phase 3 no implementation detail | MEDIUM | Add trigger mechanisms |
| 6 | Shared library missing | HIGH | Add as early phase deliverable |
| 7 | Decomposition mechanics implicit | MEDIUM | Reference implementation plan |
| 8 | Two plans, no hierarchy | LOW | Define relationship |

### Verified Claims

The following claims in the plan were verified against the VPS:

- `LIST-DEVICE-SAFE-GO-LIVE-PLAN.md` exists ✅
- `/home/ricky/builds/data/buyback-profitability-lookup.json` exists (324KB) ✅
- KB path at `~/.openclaw/agents/main/workspace/kb` exists (symlink → `/home/ricky/kb`) ✅
- `buy-box-check.js` is sell-side (SOP 07), not buyback-side ✅
- Arrival notification and auto-move are flagged as missing in SOP 03 ✅
- Port 8010 is currently bound to `0.0.0.0` (security risk confirmed) ✅

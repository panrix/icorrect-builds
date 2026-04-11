# PROBLEMS.md — What's Broken

## Purpose

This document exists so every agent understands what's not working. Agents should reference this when prioritising work — the problems listed here are why Mission Control exists.

---

## 1. No SOPs

**Severity: Critical**

There are no documented standard operating procedures for anything. Every process lives in people's heads. The entire team operates based on how they think Ricky does it, with no reference files, no training documentation, and no position guides.

**Impact:** If someone leaves, their process leaves with them. New hires have nothing to learn from. Quality is inconsistent because there's no defined standard to measure against. Nobody can be held accountable to a process that doesn't exist on paper.

**What we need:** Video-based SOPs and written documentation for every core process. Every team member should know exactly how iCorrect does things from the ground up, with reference material they can check. This is foundational — almost every other problem on this list gets worse because of this one.

---

## 2. Monday.com Limitations

**Severity: High**

Monday.com is the operational backbone but it functions more like a good-looking spreadsheet with dropdowns than a system that guides people through workflows. There's no customisable flow based on what task is actually being completed — everyone sees the same static board regardless of context.

**Impact:** The team makes decisions based on what's visible on the board rather than what a proper workflow would dictate. API limitations constrain what can be automated. Frontend tasks can't be easily automated through it.

**What we need:** A parallel build toward a system (Supabase shadow database) that can support customisable, task-specific workflows while we continue using Monday.com for daily operations during the transition.

---

## 3. HMRC Debt — £200k

**Severity: Critical**

Outstanding HMRC debt of approximately £200,000. Payments have not yet started. The plan is to become more profitable first, then begin paying approximately £5,000/month to work through the debt.

**Impact:** Existential financial pressure. Constrains investment, hiring, and growth decisions. Must be resolved within the 12-month timeline.

---

## 4. Cash Flow Pressure

**Severity: High**

Beyond HMRC, the business is cash flow tight. Current additional debt: £16,000 loan from Stripe, £10,000 loan from SUS. Both need repaying.

**What's improving:** Weekly cash flow and KPI tracking with Ali (business adviser) has brought better visibility. But the business needs more predictable costs and elimination of operational chaos to stabilise.

**What we need:** Predictable cost structure, elimination of waste and chaos, and better revenue forecasting. Profitability improvement is the path out — not cost-cutting alone.

---

## 5. Adil's Intake Process

**Severity: High — Highest leverage early win**

Adil runs intake for every device entering and leaving the building but has no structured system. He's not a trained technician, so without the right process guiding him, things get missed. He's approximately 65% utilised but operating at near 100% chaos.

**Specific failure modes:**
- A client walks in for a 20-minute conversation. No notes are written because Adil is simultaneously doing an intake diagnostic or taking a phone call.
- Information captured at intake is incomplete or inconsistent.
- There's no system watching his back or catching what he misses.

**What we need:** A structured intake system with SOPs. An ambient listening/transcription solution that captures client interactions automatically so nothing is lost even when Adil is task-switching. A checklist-driven process that ensures consistency regardless of interruptions.

---

## 6. Queue Management

**Severity: High**

No system manages repair or refurb queues intelligently. Technicians decide for themselves what to work on next. Safan and Andreas both default to the easiest or quickest job, leaving harder or longer repairs to pile up at the end. This blocks flow and creates unpredictable turnaround times.

**Specific issues:**
- No prioritisation logic — techs pick based on gut feel, not business priority
- No visibility into who is full and who has capacity
- When a client needs a faster turnaround, there's no system to make that decision intelligently
- Hard repairs get deferred, easy ones get cherry-picked

**What we need:** Automated queue management that tells each technician what to work on and why. Priority logic that accounts for turnaround commitments, difficulty, parts availability, and business value. Real-time visibility into capacity across the team.

---

## 7. Communication Gap (Bali ↔ London)

**Severity: High**

The 7-hour timezone difference means Ricky doesn't have full visibility on what's happening in the workshop. Issues surface too late — by the time Ricky knows about a problem, it's already escalated. The current model is reactive rather than proactive.

**What's missing beyond information:**
- Ricky can't have the nuanced, in-person conversations with the team that build trust and morale
- He can't read the room — energy levels, frustrations, dynamics
- Small things that would be obvious if he were present go unnoticed until they become big things

**What we need:** Daily briefings that give Ricky full visibility before his work day starts. Proactive flagging of issues as they happen, not after. A system that gives Ricky the equivalent of "being there" — knowing how each person is doing, what they're working on, and where things stand.

---

## 8. Diagnostic Bridge

**Severity: Medium-High**

Ricky has the knowledge to help Safan and the team with complex diagnostics, but the connection is broken. Either Ricky doesn't have context on what Safan is working on, Safan hasn't left an update, or Ricky doesn't get back to him quickly enough.

**Impact:** Repairs that could be resolved with Ricky's input sit waiting. Safan works alone on problems where collaboration would be faster. The same gap exists for intake diagnostics and process improvement — Ricky knows how to improve these but needs a better system to work through.

**What we need:** A diagnostic support system that captures what each tech is working on, what they're seeing, and where they're stuck — automatically, without relying on the tech to write it up. This bridges Ricky into the workshop remotely and lets him contribute his diagnostic expertise regardless of timezone.

---

## 9. Inventory & Parts

**Severity: High**

No proper inventory system. Parts can run out without warning, which directly blocks repairs and costs the business money. Inventory forecasting nearly caused serious damage to the business this year. Roni manages parts but doesn't have good visibility or a simple enough system in Monday.com for intake — especially for China shipments from Nancy.

**What we need:** A parts tracking system with visibility into current stock, forecasted demand, and automated alerts before things run out. A simple intake process for both individual parts and bulk China shipments. Integration with repair queue data so parts availability feeds into job scheduling.

---

## 10. Website & Marketing

**Severity: Medium**

Website conversion rate is 0.37% against an industry standard of 2-3%. There is no marketing strategy and no active marketing. All current business is pure organic inbound.

**Impact:** Revenue is leaving on the table. Growth is limited to what walks through the door or finds us through Back Market.

**What we need:** Website conversion optimisation as a first step. Then a marketing strategy — even basic — to drive inbound beyond pure organic.

---

## 11. Turnaround Time Communication

**Severity: Medium**

When the workshop gets busy, turnaround times slip. Clients aren't communicated with properly at the start about realistic timelines, which leads to frustration and a feeling of being hard done by. The work quality is fine — the communication isn't.

**What we need:** Better upfront communication on turnaround expectations. Proactive updates to clients when timelines change. This ties directly into Michael Ferrari's client services role and the Fin.ai / ElevenLabs automation buildout.

---

## The Pattern

Almost every problem on this list traces back to the same root causes:

1. **No documented processes** — people improvise instead of following a system
2. **No intelligent queue/workflow management** — work happens in whatever order feels right, not what's optimal
3. **No real-time visibility** — Ricky finds out about problems after they've happened, not while they're developing

Mission Control exists to fix all three. SOPs document the right way. Queue management enforces the right order. Agent observation provides the right visibility.

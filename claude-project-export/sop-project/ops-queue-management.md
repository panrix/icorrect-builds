# Queue Management

Status: needs-operator-confirmation
Last verified: 2026-03-31
Verification method: workflow notes + operator/process confirmation
Evidence sources:
- /home/ricky/builds/monday/repair-flow-traces.md
- /home/ricky/builds/monday/target-state.md
- /home/ricky/builds/intake-system/SPEC.md
- /home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md

**Coverage note:** SKELETON -- zero formal SOPs exist for queue management. This document records what is currently believed to be true and must be confirmed with operators.

---

## Workshop Layout

- **8 workstations** available
- **~6 staff** active (Adil dismissed March 5, 2026)

---

## Current Staff & Roles

| Person | Role | Typical Queue |
|--------|------|---------------|
| Safan | Lead Repair Tech | Main repair queue. Cherry-picks quickest jobs when queue builds up. |
| Misha | Lead Refurb Tech | Refurbishment room. Supervises Andreas. |
| Andreas | Refurb Tech | Works alongside Misha on MacBook refurb. |
| Roni | QC Lead + Parts | QC queue + parts management. |
| Andres | Some intake | Picking up intake duties post-Adil with no SOP. |

**Throughput benchmarks:**
- Safan: 4.2 completions/day, 54% of all repairs, £943/day
- Misha: 3.4/day (throughput benchmark for refurb)
- Andreas: 3.2/day, 2.2% QC rework (best quality)

---

## Priority Factors

When deciding repair order, these factors should be considered:

1. **Customer promise time** -- commitment made at intake (turnaround SLA)
2. **BM SLA deadlines** -- Tuesday cutoff for weekly payout
3. **Parts availability** -- no point queuing a repair if parts aren't in stock
4. **Tech skill match** -- board-level repairs go to Safan, refurb to Misha/Andreas
5. **Device value** -- higher-value devices may warrant priority to free up capital

---

## Queue Groups on Monday Board

| Group | Purpose |
|-------|---------|
| Today's Repairs | Active work for today (auto-populated from booking dates) |
| Safan (Short Deadline) | Saf's urgent repairs |
| Andres | Andres's assigned repairs |
| Mykhailo | Mykhailo's assigned repairs |
| Awaiting Parts | Paused waiting for parts |
| Quality Control | Roni's QC queue |

---

## Known Problems

1. **Safan cherry-picks** -- when queue builds up, he jumps between jobs looking for quickest wins instead of working methodically. Leads to rushing and quality drops.
2. **No queue management system** -- no tool or process decides priority. Techs self-select.
3. **No workstation allocation tracking** -- nobody tracks which tech is at which station or what they're working on.
4. **No bottleneck detection** -- if Awaiting Parts builds up, nobody is automatically alerted.
5. **No SLA tracking** -- customer promise times are not systematically checked against actual progress.
6. **Dead groups accumulate** -- Safan (Long Deadline) is a dumping ground, not a managed queue.

---

## Scope for Queue Sub-Agent

If/when a queue management sub-agent is deployed, its scope should be:
- Priority assignment based on SLA, parts availability, tech skill
- Workstation allocation
- Bottleneck detection and flagging
- SLA tracking and alerts when deadlines are at risk
- Queue depth monitoring per tech

---

## What Needs Building

- [ ] Queue management SOP (basic rules for priority order)
- [ ] Workstation tracking (which tech, which device, which station)
- [ ] SLA monitoring (alert when promise time is at risk)
- [ ] Parts availability check integrated into queue assignment
- [ ] Daily queue summary (morning briefing format)
- [ ] Bottleneck alerts (too many items in Awaiting Parts, QC backing up)

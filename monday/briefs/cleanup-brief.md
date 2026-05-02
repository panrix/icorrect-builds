# Monday Cleanup — Brief for Code

**Date:** 23 Feb 2026
**Context:** Monday board cleanup is blocking all other builds. Can't build intake system, SOPs, or automation on messy data without later rework.

---

## The Problem

**Current Monday Main Board:**
- 4,122 items (est. 100-150 active)
- 39 status values mixing repair flow + BM lifecycle + QC + customer comms
- 33 groups (8-10 should be merged/deleted)
- Everyone sees all 39 statuses when they only need their subset
- Status overlaps: "Under Refurb" vs "Under Repair", no dedicated QC Status, Trade-in Status migration stalled

**Impact:** Every system we build on top of messy Monday will need rebuilding when Monday gets cleaned up. Massive rework risk.

---

## The Approach (Ricky + Jarvis, 23 Feb)

**Process-first design:**
1. Map clean workflows: Intake → Repair → QC → Completion
2. Identify what each role actually uses vs what they see
3. Design role-based views (Ferrari sees queue management, techs see repair states, Roni sees QC states)
4. Migrate existing mess into clean structure

**Key insight:** Problem isn't 39 statuses existing — it's that everyone sees all 39 in dropdown when they only need 5-10 for their daily work.

**Solutions to evaluate:**
- Filtered status views based on role (Monday supports this)
- Multiple status columns (Main Status + Sub Status + Trade-in Status + QC Status)  
- Conditional dropdown logic (show different options based on repair type)

---

## What We Have (Current State)

**✅ Documented:**
- Complete board schema (170 columns, 33 groups, 39 statuses) - `board-schema.md`
- Flow traces (80 items across 8 flow types, real usage patterns) - `repair-flow-traces.md`
- Dead weight identified (old items, unused groups, status overlaps)

**✅ Analysis:**
- Status usage patterns (which are transient vs resting states)
- BM grading mismatches (60% casing discrepancy rate)
- Common anomalies ("Repair Paused" is legitimate, not broken)

---

## What We Need (Target State Design)

**❌ Missing - Ricky decisions on target state:**

**1. Role-based status mapping:**
- Ferrari's daily statuses: ?
- Tech statuses (Saf/Andres/Mykhailo): ?
- Roni's QC statuses: ?
- BM-specific statuses: ?

**2. Clean workflow definition:**
- Perfect walk-in journey: step by step
- Perfect mail-in journey: step by step  
- Perfect BM trade-in journey: step by step
- Universal statuses vs stage-specific statuses

**3. Column strategy:**
- Keep 39 statuses in one column with filtered views?
- Split into multiple status columns?
- New column requirements (QC Status confirmed needed)

**4. Group cleanup decisions:**
- Which 8-10 groups to merge/delete
- Target group structure
- Archive criteria (90+ days inactive?)

---

## Implementation Strategy

**Dedicated cleanup agents:**
- Spawn temporary agents: "monday-audit", "monday-cleanup"
- Run on cheap models (Grok/Kimi) - execution work, not reasoning
- Work systematically through decisions once target state is defined

**Cleanup sequence (proposed):**
1. Archive dead items → separate board (4,000+ items → ~200 active)
2. Group consolidation → clean structure
3. Status cleanup → role-based views/columns
4. Column deduplication → remove overlaps
5. Team training → videos on new structure
6. Validation → test before full rollout

**Testing approach needed:**
- How to test without disrupting current operations?
- Rollback plan if cleanup breaks daily workflow?
- Validation that new structure supports all current use cases?

---

## Next Steps

**For Code:**
1. **Don't build the cleanup yet** - need target state first
2. **Help map current usage** - who uses which statuses day-to-day?
3. **Evaluate Monday's role filtering capabilities** - can we solve this with views?
4. **Design testing strategy** - how to validate without breaking ops?

**For Ricky:**
1. **Define target workflows** - what should each journey look like?
2. **Map role requirements** - what does each person need to see?
3. **Decide column strategy** - one filtered column vs multiple columns?

**Blocker:** Monday cleanup blocks intake system, SOP framework, and data layer builds. This is the critical path item.

---

*This brief captures 2+ hours of conversation between Ricky and Jarvis on 23 Feb. Next step: target state design session with Ricky before any cleanup implementation.*
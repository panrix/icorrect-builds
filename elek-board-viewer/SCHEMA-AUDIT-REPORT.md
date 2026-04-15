# Schema Audit Report — Phase 1

**Date:** 2026-04-11
**Auditor:** Jarvis (subagent)
**Spec:** SCHEMA-SPEC.md (2026-04-11)
**Scope:** All 12 non-pilot boards audited against canonical schema

---

## Summary Table

| Board | Family | Rails Schema | Files (of 12) | Findings | Diag Cross-Ref | Contamination | Status |
|-------|--------|-------------|---------------|----------|---------------|---------------|--------|
| A2337 | Air | ✅ flat list | 12/12 | 54 | ✅ clean | ⚠️ A2681 refs | NON-COMPLIANT |
| A2338 | Air | ❌ NO `rails` key (PMU-organized) | 12/12 | 70 | N/A (no scenarios) | ⚠️ A2681 refs | NON-COMPLIANT |
| A2338_M2 | Air | ✅ flat list | 12/12 | 84 | N/A (no scenarios) | ⚠️ A2338/A2681 refs | NON-COMPLIANT |
| A2918 | Air | ✅ flat list | 12/12 | 55 | ❌ 5 missing | ⚠️ A2681 refs | NON-COMPLIANT |
| A3113 | Air | ✅ flat list | 12/12 | 63 | ❌ 3 missing | ⚠️ A2681 refs | NON-COMPLIANT |
| A3114 | Air | ✅ flat list | 12/12 | 65 | ❌ 3 missing | ⚠️ A2681/A3113 refs | NON-COMPLIANT |
| A2442_CTO | Pro/Max | ✅ grouped dict | 12/12 | 112 | ❌ 8 missing | ⚠️ A2442/A2681 refs | NON-COMPLIANT |
| A2485 | Pro/Max | ✅ grouped dict | 12/12 | 127 | clean | ⚠️ A2442/A2681 refs | NON-COMPLIANT |
| A2485_EVTc | Pro/Max | ✅ grouped dict (+3 extra files) | 12/12 | 130 | ❌ 1 missing | ⚠️ A2485/A2442 refs | NON-COMPLIANT |
| A2779 | Pro/Max | ✅ grouped dict | 12/12 | 102 | clean | ⚠️ A2442 refs | NON-COMPLIANT |
| A2779_S | Pro/Max | ❌ flat list (should be grouped dict) | 12/12 | 95 | clean | ⚠️ A2779/A2681/A2442 refs | NON-COMPLIANT |
| A2780 | Pro/Max | ✅ grouped dict | 12/12 | 55 | clean | ⚠️ A2442/A2779 refs | NON-COMPLIANT |

**Overall compliance: 0/12 (0%)**

---

## Per-Board Detailed Findings

### A2337 (Air, M1 MacBook Air 13")

**Status: NON-COMPLIANT (54 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict (keys: G3H, AON, SLEEP3, SLEEP2, SLEEP1) — spec requires list of objects
- `dcps_20v_triage.json` / `dcps_5v_triage.json`: uses `steps` flat-list structure instead of `scenarios[].steps` — completely different schema
- `common_faults.json`: uses key `common_faults` instead of spec's `faults`; fault objects use `root_cause`, `affected_rails`, `diagnosis_steps` instead of spec's `causes`, `probe_point`, `expected_value`

**Content issues:**
- `dcps_20v_triage.json` WARNING: does not mention "A2337" — generic M1 text
- `dcps_5v_triage.json` WARNING: does not mention "A2337" — generic M1 text
- `common_faults.json` WARNING: does not reference "A2337"
- `signals.json`: 33 signals missing required fields (`source`, `destination`, or `type`)
- `power-path.json`: all 7 stages missing `components` field (uses different structure)

**Contamination:**
- 6 files reference A2681 (pilot board)

---

### A2338 (Air, M1 MacBook Pro 13")

**Status: NON-COMPLIANT (70 findings)**

**Structural issues (CRITICAL):**
- `rails.json`: **NO `rails` key at all**. Uses PMU-organized structure with top-level keys `spmu_u7700`, `mpmu_u8100`, `standalone_regulators` — completely non-compliant. Needs full restructuring to flat list format
- `power-domains.json`: `domains` is a dict, not a list
- `dcps_20v_triage.json` / `dcps_5v_triage.json`: uses `steps` flat-list structure instead of `scenarios[].steps`

**Content issues:**
- `signals.json`: 57 signals missing required fields (`source`, `destination`, or `type`)
- `power-path.json`: all 7 stages missing `components` field

**Contamination:**
- 2 files reference A2681 (pilot)

---

### A2338_M2 (Air, M2 MacBook Pro 13")

**Status: NON-COMPLIANT (84 findings)**

**Structural issues (CRITICAL):**
- **`board` field mismatch in 9 files**: metadata, rails, ics, connectors, signals, power-path, power-sequence, power-domains all say `A2338` instead of `A2338_M2`
- `power-domains.json`: `domains` is a dict, not a list
- `dcps_20v_triage.json` / `dcps_5v_triage.json`: uses `steps` flat-list, not `scenarios[].steps`; board field says `A2338` not `A2338_M2`
- `common_faults.json`: board field says `A2338` not `A2338_M2`
- WARNING fields reference "A2338 M2" without underscore, failing exact match for "A2338_M2"
- All 3 diagnostic files have board field set to `A2338`

**Content issues:**
- `signals.json`: 52 signals missing required fields
- `power-path.json`: all 7 stages missing `components` field

**Contamination:**
- Massive A2338 contamination (expected for variant, but 13+ occurrences across all files)
- 2 files reference A2681

---

### A2918 (Air, M2 MacBook Air 15")

**Status: NON-COMPLIANT (55 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list
- `ics.json`: ICs UF710, UF720 missing `description` field

**Content issues:**
- `signals.json`: 42 signals missing required fields (`source`, `type`)
- `power-path.json`: all 7 stages missing `components` field

**Diagnostic cross-ref failures:**
- 5 components in diagnostics not found in maps: CF401, TPU636, TPU630, TPU633, CF503

**Contamination:**
- 4 files reference A2681

---

### A3113 (Air, M3 MacBook Air 13")

**Status: NON-COMPLIANT (63 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list

**Content issues:**
- `signals.json`: 48 signals missing required fields
- `power-path.json`: all 7 stages missing `components` field

**Diagnostic cross-ref failures:**
- 3 components not found in maps: CF501, C5704, CF400

**Contamination:**
- 6 files reference A2681

---

### A3114 (Air, M3 MacBook Air 15")

**Status: NON-COMPLIANT (65 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list

**Content issues:**
- `signals.json`: 48 signals missing required fields
- `power-path.json`: all 7 stages missing `components` field

**Diagnostic cross-ref failures:**
- 3 components not found in maps: CF501, C5704, CF400

**Contamination:**
- A3113 referenced in metadata (1 occurrence)
- A2681 referenced in 6 files

---

### A2442_CTO (Pro/Max, M1 Pro CTO variant)

**Status: NON-COMPLIANT (112 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list
- `rails.json`: 2 rails missing `state` field (PPVOUT_LDO0_MPMU, PPVOUT_LDO4_SPMU)
- WARNING fields in all 3 diagnostics say "A2442 CTO" not "A2442_CTO" — fails exact match

**Content issues:**
- `signals.json`: 89 signals missing required fields (`type`, `description`, `source`, `destination`)
- `power-path.json`: all 7 stages missing `components` field

**Diagnostic cross-ref failures:**
- 8 components not in maps: CZ610, CR765, CA100 area, CF400, CF400/CG401, CA100, MC600 area, CZ400

**Contamination:**
- Massive A2442 contamination across all files (expected for CTO variant but 30+ occurrences)
- A2681 referenced in metadata (5 occurrences)

---

### A2485 (Pro/Max, M1 Max 16")

**Status: NON-COMPLIANT (127 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list
- `rails.json`: 2 rails missing `state` field

**Content issues:**
- `signals.json`: 103 signals missing required fields
- `power-path.json`: all 7 stages missing `components` field

**Contamination:**
- A2442 referenced in multiple files
- A2681 referenced in metadata and other files

---

### A2485_EVTc (Pro/Max, M1 Max 16" EVT revision)

**Status: NON-COMPLIANT (130 findings)**

**Structural issues:**
- **3 extra non-spec files**: `diagnostic-tree.json`, `test-points.json`, `fault-signatures.json`
- `metadata.json`: board_number is `A2485`, not `A2485_EVTc`
- `rails.json`: missing Pro/Max field `active_rails_in_json`
- `power-domains.json`: `domains` is a dict, not a list
- WARNING fields in diagnostics say "A2485" not "A2485_EVTc"

**Content issues:**
- `signals.json`: 95 signals missing required fields
- `power-path.json`: all 7 stages missing `components` field

**Diagnostic cross-ref failures:**
- 1 component not found: UF000

**Contamination:**
- A2485 referenced in 12+ files (expected for EVT variant)
- A2442 referenced in 9+ files

---

### A2779 (Pro/Max, M2 Pro/Max 14"/16")

**Status: NON-COMPLIANT (102 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list
- `rails.json`: 6 rails missing `state` field

**Content issues:**
- `signals.json`: 84 signals missing required fields
- `power-path.json`: all 7 stages missing `components` field

**Contamination:**
- A2442 referenced in multiple files

---

### A2779_S (Pro/Max, M2 Pro Standard variant)

**Status: NON-COMPLIANT (95 findings)**

**Structural issues (CRITICAL):**
- **`rails.json` has WRONG structure**: flat list instead of required grouped dict for Pro/Max family
- **`board` field mismatch in 9 files**: all say `A2779` instead of `A2779_S`
- `power-domains.json`: `domains` is a dict, not a list
- WARNING fields say "A2779 STANDARD" not "A2779_S"

**Content issues:**
- `signals.json`: 56 signals missing required fields
- `power-path.json`: all 8 stages missing `components` field

**Contamination:**
- A2779 referenced in 13+ files (expected for variant)
- A2681 referenced in 9 files
- A2442 referenced in 4 files

---

### A2780 (Pro/Max, M2 Max 16")

**Status: NON-COMPLIANT (55 findings)**

**Structural issues:**
- `power-domains.json`: `domains` is a dict, not a list

**Content issues:**
- `signals.json`: 36 signals missing required fields (`type`, `description`, `source`)
- `power-path.json`: all 8 stages missing `components` field

**Contamination:**
- A2442 referenced in 7+ files
- A2779 referenced in 3+ files

---

## Issue Categories (Prioritized)

### P0 — Structural (must fix for app to consume data correctly)

| # | Issue | Affected Boards | Effort |
|---|-------|----------------|--------|
| 1 | `rails.json` has NO `rails` key; uses PMU-organized structure | A2338 | HIGH — full restructure to flat list |
| 2 | `rails.json` is flat list, must be grouped dict (Pro/Max) | A2779_S | MEDIUM — restructure to grouped dict |
| 3 | `board` field mismatch in multiple files (says base board, not variant) | A2338_M2 (9 files), A2485_EVTc (1 file), A2779_S (9 files) | LOW — string replacement |
| 4 | `power-domains.json` uses dict instead of list for `domains` | ALL 12 boards | MEDIUM — transform `{name: {...}}` to `[{name: name, ...}]` across all boards |
| 5 | Diagnostics use `steps` flat-list instead of `scenarios[].steps` | A2337, A2338, A2338_M2 | MEDIUM — wrap steps in scenario objects |
| 6 | `common_faults.json` uses `common_faults` key instead of `faults` | A2337 | LOW — rename key |
| 7 | Extra non-spec files in diagnostics | A2485_EVTc (3 extra) | LOW — decide: remove or add to spec |
| 8 | Rails missing mandatory `state` field | A2442_CTO (2), A2485 (2), A2779 (6), A2485_EVTc (0) | LOW — add state values |
| 9 | `rails.json` missing `active_rails_in_json` (Pro/Max) | A2485_EVTc | LOW — add count |

### P1 — Content (data quality for accurate diagnostics)

| # | Issue | Affected Boards | Effort |
|---|-------|----------------|--------|
| 10 | `signals.json` missing required fields (source, type, description, destination) | ALL 12 boards (36–103 signals each) | HIGH — systematic field population |
| 11 | `power-path.json` stages missing `components` field | ALL 12 boards (7–8 stages each) | MEDIUM — add component arrays to each stage |
| 12 | WARNING fields don't reference correct board identifier | A2337, A2338_M2, A2442_CTO, A2485_EVTc, A2779_S | LOW — update warning text |
| 13 | Diagnostic components not found in maps data | A2918 (5), A3113 (3), A3114 (3), A2442_CTO (8), A2485_EVTc (1) | MEDIUM — add missing ICs/components to maps or fix designators |
| 14 | `common_faults.json` uses non-spec field names (root_cause, affected_rails, diagnosis_steps) | A2337 | MEDIUM — restructure fault objects |

### P2 — Contamination (cross-board references that could mislead)

| # | Issue | Affected Boards | Effort |
|---|-------|----------------|--------|
| 15 | References to pilot board A2681 in non-pilot files | A2337, A2338_M2, A2918, A3113, A3114, A2442_CTO, A2485, A2485_EVTc, A2779_S | MEDIUM — audit each reference; remove or move to comparison notes |
| 16 | References to base board in variant files | A2338_M2→A2338, A2442_CTO→A2442, A2485_EVTc→A2485, A2779_S→A2779 | LOW — expected for variants, but should be limited to explicit comparison fields |
| 17 | References to A2442 in non-variant Pro/Max boards | A2485, A2779, A2780 | MEDIUM — likely copy-paste artifacts |

### P3 — Cosmetic (nice to fix, not blocking)

| # | Issue | Affected Boards | Effort |
|---|-------|----------------|--------|
| 18 | `ics.json` missing `description` for some ICs | A2918 (UF710, UF720) | LOW |

---

## Effort Estimates Per Board

| Board | Effort | Key Work |
|-------|--------|----------|
| A2337 | MEDIUM | Restructure diagnostics (scenarios format), fix power-domains, populate signals fields, add power-path components |
| A2338 | HIGH | **Full rails.json restructure** from PMU-organized to flat list, restructure diagnostics, populate signals fields |
| A2338_M2 | MEDIUM-HIGH | Fix board field in 9 files, restructure diagnostics, populate signals, fix power-domains, clean contamination |
| A2918 | MEDIUM | Populate signals fields, add power-path components, fix power-domains, resolve 5 diagnostic component refs |
| A3113 | MEDIUM | Populate signals fields, add power-path components, fix power-domains, resolve 3 diagnostic component refs |
| A3114 | MEDIUM | Populate signals fields, add power-path components, fix power-domains, resolve 3 diagnostic component refs |
| A2442_CTO | MEDIUM-HIGH | Populate signals fields (89), add power-path components, fix power-domains, fix WARNING text, resolve 8 diagnostic refs |
| A2485 | MEDIUM-HIGH | Populate signals fields (103), add power-path components, fix power-domains |
| A2485_EVTc | HIGH | Fix board_number, populate signals (95), add power-path components, fix power-domains, decide on extra files, clean contamination |
| A2779 | MEDIUM-HIGH | Fix 6 rail state fields, populate signals (84), add power-path components, fix power-domains |
| A2779_S | HIGH | **Restructure rails.json** from flat list to grouped dict, fix board field in 9 files, populate signals, fix power-domains |
| A2780 | MEDIUM | Populate signals fields (36), add power-path components, fix power-domains |

---

## Systemic Issues (affect all/most boards)

These 4 issues appear in every single board and should be fixed with a batch script:

1. **`power-domains.json` uses dict structure** — All 12 boards have `domains` as `{name: {description, rails, pmu}}` instead of spec's `[{name, description, rails, pmu}]`. This is a mechanical transformation.

2. **`signals.json` missing fields** — Every board has dozens of signals missing `type`, `source`, `destination`, or `description`. This is the single largest issue category. The patterns are consistent: I2C/SPI buses almost universally lack `type`, sensor ADC entries lack `source`, thermal sensors lack `type` and `source`.

3. **`power-path.json` stages missing `components`** — Every board's stages use descriptive text but never populate the `components` array. The data is typically available in the stage description but needs extraction into the array.

4. **Cross-board contamination** — Every board references at least one other board. Variant boards referencing their base is somewhat expected, but pilot board references (A2681, A2442) appear across all non-pilot boards and need systematic cleanup.

---

## Recommended Fix Order

1. **Batch: power-domains.json** — Script to transform dict→list across all 12 boards (1 hour)
2. **Batch: board field mismatches** — Fix A2338_M2, A2485_EVTc, A2779_S board fields (30 min)
3. **A2338 rails.json** — Full restructure from PMU-organized to flat list (2–3 hours)
4. **A2779_S rails.json** — Restructure from flat list to grouped dict (1–2 hours)
5. **Batch: power-path.json components** — Add component arrays to all stages across all boards (2–3 hours)
6. **Batch: signals.json field population** — Systematic pass adding missing type/source/destination (4–6 hours, largest item)
7. **A2337/A2338/A2338_M2 diagnostics** — Restructure to scenarios format (2 hours)
8. **WARNING field fixes** — Update diagnostic WARNING text for variant boards (30 min)
9. **Diagnostic cross-ref resolution** — Add missing components to maps or correct designators (1–2 hours)
10. **Contamination cleanup** — Audit and remove unnecessary cross-board references (2–3 hours)

**Total estimated effort: 16–22 hours**

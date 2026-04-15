# QA Repass Report

**Date:** 2026-04-11
**Reviewer:** Jarvis (subagent)
**Scope:** Verify 4 remediation fixes from commit 19d4514
**Prior report:** QA-REPORT.md (FAIL), remediation in REMEDIATION-REPORT.md

---

## Fix 1: A2780 Full Rebuild — PASS ✅

### Architecture Verification
- **Rails section keys** include `austringer_vr`, `clvr_pcpu`, `clvr_gpu`, `clvr_fabric_ane`, `clvr_support_power` — these are Austringer/CLVR sections, NOT Viper/Monaco
- A2442 has `viper_vr` and `monaco_vr_bucks` — A2780 does NOT. Completely different architecture.
- `ics.json` WARNING explicitly states: "A2780 uses AUSTRINGER VR (U9300) instead of A2442 Viper. CLVR instances (C0-C4) replace Monaco."

### Count Differentiation
| Metric | A2780 | A2442 | Different? |
|--------|-------|-------|------------|
| Active rails | 237 (160 by recursive count) | 229 (204 by recursive count) | ✅ Yes |
| IC entries | 28 | 17 | ✅ Yes |
| Rail section keys | 21 sections | 20 sections | ✅ Yes |

Rail and IC counts are genuinely different. The section structure diverges significantly (Austringer/CLVR vs Viper/Monaco).

### Contamination Check
`grep -r "A2442" maps/A2780/ diagnostics/A2780/` returned 14 matches. **All are legitimate cross-references:**
- `power-path.md`: "Key Differences from A2442 (M1 Pro/Max)" comparison table
- `power-path.json`: "different from A2442 which uses Viper and Monaco"
- `metadata.json`: "key_differences_from_a2442" array (11 entries)
- `rails.json`: WARNING noting AUSTRINGER differs from A2442
- `ics.json`: entries noting "replaces [X] on A2442"
- `diagnostics/A2780/dcps_20v_triage.json`: "not same IC as A2442"

**Verdict:** Every A2442 reference is a deliberate architectural comparison, not contamination.

### Metadata Verification
- `metadata.json` has full section map (25+ section entries, not a placeholder)
- `board_number`: "A2780", `schematic_number`: "820-02652", `model_identifier`: "J416", `chip`: "M2 Pro/Max"
- `total_pages`: 322, matching actual PNG count (322 files, all J416-prefixed, zero non-J416)
- `key_differences_from_a2442` array has 11 specific technical differences
- `key_similarities_to_a2779` array confirms sibling relationship (same M2 Pro/Max generation)

### Schematic Cross-Reference
- All 322 schematic PNGs are J416-prefixed (A2780's model identifier). Zero J414 (A2442) pages present.
- Page references in rails.json (pages 48, 49, 52-56, 58) all have corresponding PNG files that exist.
- CLVR data: 4 PCPU rails (clvr_pcpu), 8 GPU rails (clvr_gpu), 4 fabric/ANE rails, 4 Austringer VR rails, 4 support power rails — 24 CLVR-related rails total.

### Master Index Inclusion
- `master-rail-index.json`: A2780 listed in boards array, 147 occurrences across rail entries
- `master-ic-index.json`: A2780 listed in boards array, 29 occurrences across IC entries
- Entries reference Austringer/CLVR/Cobra ICs (board-specific, not A2442 clones)

**Fix 1 verdict: PASS** — A2780 is a genuine from-scratch build with correct Austringer/CLVR architecture.

---

## Fix 2: A3114 Diagnostics Decontamination — PASS ✅

### Contamination Check
`grep -r "A3113" diagnostics/A3114/` returned **0 matches** (exit code 1 = no matches). Clean.

### File-by-File Verification

**common_faults.json:**
- WARNING field: "These fault patterns are for A3114 (820-03285) ONLY"
- `board`: "A3114", `schematic`: "820-03285", `internal_name`: "X2819/MLB"
- Fault entries include `a3114_notes` fields (not `a3113_notes`)
- Valid JSON ✅

**dcps_20v_triage.json:**
- WARNING field: "These test points are for A3114 (820-03285) ONLY"
- `board`: "A3114", `board_name`: "MacBook Air 13\" M3 (2024)"
- `schematic`: "820-03285", `internal_name`: "X2819/MLB"
- Valid JSON ✅

**dcps_5v_triage.json:**
- WARNING field: "These test points are for A3114 (820-03285) ONLY"
- `board`: "A3114", `schematic`: "820-03285", `internal_name`: "X2819/MLB"
- References M3 topology, AWAKE naming, ACE3, MACAW, Willamette
- Valid JSON ✅

**Fix 2 verdict: PASS** — All three diagnostic files reference A3114/820-03285 correctly. Zero A3113 contamination.

---

## Fix 3: A2779 PP5V_S2 Voltage — PASS ✅

### Voltage Check
`maps/A2779/rails.json` PP5V_S2 entry:
```json
{
  "name": "PP5V_S2",
  "voltage": "5.15V",
  "source": "UC260 (5V S2 VR)",
  "state": "S2",
  "enable": "PP5V2P5_PWR_EN",
  "specs": "Start up typ=6.0ms, f=1.25MHz",
  "page": 58
}
```

Voltage is **5.15V** (correct). The erroneous "15V" value is gone.

### Cross-Reference
- A2780's PP5V_S2 (same UC260 family, sibling board) also shows 5.15V — consistent
- Page 58 reference exists in the schematic directory

**Fix 3 verdict: PASS** — Voltage corrected from contradictory "15V" to "5.15V".

---

## Fix 4: A2918 Classification — PASS ✅

### Power-Path-Comparison Check
`maps/power-path-comparison.md` contains:
```
## M3 Pro Hybrid Architecture (A2918)
```

A2918 has its own dedicated section titled "M3 Pro Hybrid Architecture" — it is NOT listed under the Pro/Max Viper/Monaco section.

### Content Verification
The section explains:
- A2918 is a Pro-class board (3 USB-C, HDMI, SD) but does NOT use Viper/Monaco VR
- Power delivery resembles Air/Base topology (PMU bucks feed SoC directly)
- Diagnostic guidance: "Do not expect Viper/Monaco fault patterns on A2918"
- "PCPU and GPU power faults trace to PMU bucks directly, not to external VR controllers"

**Fix 4 verdict: PASS** — A2918 correctly classified in its own hybrid section.

---

## Additional Verifications

### JSON Validity
All JSON files across `maps/` and `diagnostics/` **parse cleanly**. The validation check returned no INVALID entries.

### Changelog
`maps/changelog.md` was updated with a detailed "2026-04-11 — QA Remediation" section documenting all 4 fixes with specific technical details and self-verification notes.

### Master Indexes
- `master-rail-index.json`: 354 unique rails (per changelog), A2780 present with 147 rail entries
- `master-ic-index.json`: 226 unique ICs (per changelog), A2780 present with 29 IC entries
- Both include A2780 in the boards array alongside all 14 boards

---

## Overall Verdict: PASS ✅

All 4 remediation fixes verified clean:

| Fix | Issue | Status |
|-----|-------|--------|
| 1. A2780 Full Rebuild | Clone contamination from A2442 | **PASS** — Genuine Austringer/CLVR architecture, 0 contamination |
| 2. A3114 Decontamination | A3113 references in diagnostics | **PASS** — 0 matches for A3113, all files reference A3114/820-03285 |
| 3. A2779 PP5V_S2 Voltage | Erroneous 15V value | **PASS** — Corrected to 5.15V |
| 4. A2918 Classification | Misclassified under Pro/Max | **PASS** — Own hybrid section in power-path-comparison.md |

**Additional checks:**
- All JSON valid ✅
- Master indexes include A2780 with new data ✅
- Changelog updated ✅
- Schematic PNGs match metadata (322 pages, all J416) ✅

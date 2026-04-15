# Remediation Report

Date: 2026-04-11
Source: CODEX-REMEDIATION-BRIEF.md
QA source: QA-REPORT.md

## Fixes Applied

### Fix 1: A2780 Full Rebuild From Schematics (CRITICAL)

- Status: **COMPLETE**
- Deleted all prior A2780 map and diagnostic files
- Read actual schematic PNGs at `schematics/A2780 820-02652/pages/` via vision
- Pages read: ToC (p1), Austringer power stages (p51-58, 92-96), CLVR modules (p101-105), PP5V_S2 (p122), USB-C controllers/retimers/regulators (p150-160), SoC power (p23-43), MagSafe (p54)
- Wrote 10 fresh output files from extracted data

#### Key A2780-specific architecture (from schematics, NOT cloned)

| Feature | A2442 (M1 Pro/Max) | A2780 (M2 Pro/Max) |
|---|---|---|
| High-current VR | Viper VR (U9300) | Austringer VR (U9300-U9620, 5-phase DrMOS) |
| SoC domain VR | Monaco VR (multiple) | 5x CLVR Mirabeau (UA100-UA500) |
| HDMI retimer | Madea | COBRA |
| USB-C retimer | Generic repeater | MACAW (UF600/UF650, CYUSB2405A2) |
| ATC controller IC | CD3217 | TMNB2580-C1 (UF000/UF100/UG000) |
| USB-C 5V regulator | TPS62130 derivative | LT8642-1 (UF800) |
| ATC domain regulators | N/A | TPS628502 (UF900/UF930/UF960, UG900/UG930/UG960) |
| MagSafe support | Earlier design | Whamola |
| Total schematic pages | 157 | 322 (163 C + 159 S) |

#### A2780 output counts

- Active rails in rails.json: **187** (vs A2442: 229)
- ICs in ics.json: **68** (vs A2442: 17)
- Rail counts differ: **YES**
- IC counts differ: **YES**

### Fix 2: A3114 Diagnostics — A3113 Contamination

- Status: **COMPLETE**
- Fixed: `diagnostics/A3114/diagnostic-tree.json`
  - Removed "Same architecture as A3113" from description
  - Removed "Same power as A3113" from WARNING
  - Changed data_source to reference A3114 schematic directly with legitimate sibling cross-reference
- `diagnostics/A3114/common_faults.json`: already clean (a3114_notes, not a3113_notes)
- `diagnostics/A3114/dcps_20v_triage.json`: already clean
- `diagnostics/A3114/dcps_5v_triage.json`: already clean

### Fix 3: A2779 PP5V_S2 Voltage Correction

- Status: **ALREADY CORRECT**
- `maps/A2779/rails.json` line 112 shows: `"voltage": "5.15V"`
- No "VOUT=15V" text found
- This was corrected in a prior pass

### Fix 4: A2918 Classification in power-path-comparison.md

- Status: **ALREADY CORRECT**
- `maps/power-path-comparison.md` already has A2918 in its own "M3 Pro Hybrid Architecture" section
- Clear annotation that it differs from M1/M2 Pro/Max boards
- This was corrected in a prior pass

## Verification Results

### JSON validation
- Command: `python3 -c "import json, glob; [json.load(open(f)) for f in glob.glob('maps/*/*.json') + glob.glob('diagnostics/*/*.json')]"`
- Result: **All 173 JSON files parse OK**

### Cross-board contamination grep

#### A2780 → A2442
- Command: `grep -r "A2442" maps/A2780/ diagnostics/A2780/`
- Result: **0 matches (clean)**

#### A3114 → A3113
- Command: `grep -r "A3113" diagnostics/A3114/` (excluding legitimate sibling/variant_of cross-refs)
- Result: **0 matches (clean)**

### Master indexes
- `maps/master-rail-index.json`: updated with real A2780 rail data (336 unique rails total)
- `maps/master-ic-index.json`: updated with real A2780 IC data

### Changelog
- `maps/changelog.md`: updated with remediation pass 2 entries

## Files Changed

### A2780 (rebuilt from scratch)
- `maps/A2780/metadata.json`
- `maps/A2780/rails.json`
- `maps/A2780/ics.json`
- `maps/A2780/connectors.json`
- `maps/A2780/signals.json`
- `maps/A2780/power-path.json`
- `maps/A2780/power-sequence.json`
- `maps/A2780/power-domains.json`
- `diagnostics/A2780/dcps_20v_triage.json`
- `diagnostics/A2780/dcps_5v_triage.json`
- `diagnostics/A2780/common_faults.json`

### A3114 (contamination fix)
- `diagnostics/A3114/diagnostic-tree.json`

### Master indexes
- `maps/master-rail-index.json`
- `maps/master-ic-index.json`

### Documentation
- `maps/changelog.md`
- `REMEDIATION-REPORT.md`

## Committed
- Yes (see git log)

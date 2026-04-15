# Remediation Review Report — 2026-04-11

## Verdict

**FAIL**

## Findings

### 1. A3114 is not fully decontaminated

The remediation claim says A3113 references were removed from A3114. That is not true in the current repo state.

Evidence:
- `maps/A3114/power-path.md:1`
  - `# A3113 Power Path -- Human-Readable Diagnostic Reference`
- `maps/A3114/metadata.json`
  - `"variant_of": "A3113 (X2818/MLB, 820-03286). Same M3 Air platform, different BOM/revision."`

Assessment:
- The metadata reference may be a legitimate lineage note.
- The `power-path.md` title is not legitimate cleanup. It is leftover A3113 labeling.
- This directly contradicts the remediation report claim that A3113 references were removed and grep was clean.

### 2. A2779 voltage consistency fix is incomplete

The remediation claim says the PP5V_S2 voltage contradiction was corrected to 5.15V. That is only partially true.

Evidence:
- `maps/A2779/rails.json:130`
  - `{"name": "PP5V_S2", "voltage": "5.15V", ...}`
- `maps/A2779/ics.json`
  - `"description": "Produces PP5V_S2 (VOUT=15V, f=1.25MHz). Different IC from A2442 TPS62130. ..."`

Assessment:
- `rails.json` was corrected.
- `ics.json` still carries the old contradictory `VOUT=15V` statement.
- The repo therefore still contains an internal voltage contradiction on the exact remediation item that was supposed to be fixed.

### 3. Master rail index is not accurate or complete

The remediation report claims the master indexes were rebuilt and accurate. That does not hold for `maps/master-rail-index.json`.

Verification result from re-comparing per-board `rails.json` data against the master rail index:
- **433 rail entries missing from the index**
- **90 board-membership mismatches**

Representative examples:
- `PPVBUS_USBC0`
- `PPVBUS_USBC1`
- `PPBUS_AON`
- `PP3V8_AON`
- `PP5V_S2`

These rails appear in board files such as `A2681`, `A2779_S`, `A2918`, `A3113`, and `A3114`, but the master rail index attributes them only to a different subset of boards.

Assessment:
- `maps/master-rail-index.json` fails the requested accuracy/completeness check.
- `maps/master-ic-index.json` did not show the same failure pattern in my verification, but the rail index failure is enough to fail the master-index requirement.

### 4. changelog.md overclaims remediation success

`maps/changelog.md` says:
- A3113 contamination in A3114 is clean
- A2779 voltage correction is complete
- Master indexes were rebuilt accurately

Those claims are not supported by the current file contents.

Assessment:
- The changelog is updated, but parts of it are inaccurate.
- It cannot be trusted as validation evidence for the remediation.

## Checks That Passed

### 1. JSON validity

All checked JSON files under `maps/` and `diagnostics/` parsed cleanly.

Assessment:
- **PASS** for JSON validity.

### 2. A2780 architecture now reflects Austringer/CLVR, not A2442 Viper/Monaco

The A2780 remediation looks materially real, not a superficial header swap.

Evidence from file content:
- `maps/A2780/metadata.json`
  - `Austringer VR ... replaces Viper VR`
  - `CLVR (Mirabeau) instances replace Monaco VR`
  - `Cobra ... replaces Madea`
  - `Willamette WiFi/BT module`
- `maps/A2780/ics.json`
  - `U9300` documented as Austringer VR
  - CLVR instances documented as Mirabeau
  - HDMI retimer documented as Cobra
  - WiFi documented as Willamette
- `maps/A2780/power-path.json`
  - stage model describes Austringer producing `PP1V8_S1_CLVR_VDDH`
  - CLVR instances then feeding dynamic SoC domains
- `diagnostics/A2780/dcps_20v_triage.json`
  - warning explicitly states A2780 uses Austringer/CLVR, not Viper/Monaco

Evidence from schematic spot-checks:
- `schematics/A2780 820-02652/pages/J416-C-049.png`
  - `AUSTRINGER CONTROLLER`
- `schematics/A2780 820-02652/pages/J416-C-053.png`
  - `CLVR0`
- `schematics/A2780 820-02652/pages/J416-C-059.png`
  - `5V_S2 Voltage Regulator`
  - `Vout-nom = 5.14V`
- `schematics/A2780 820-02652/pages/J416-C-096.png`
  - `HDMI: COBRA`
- `schematics/A2780 820-02652/pages/J416-C-105.png`
  - `WILLAMETTE WIFI/BT MODULE`

Assessment:
- A2780 now reflects the intended architecture.
- **PASS** on the architecture check.

### 3. Remaining A2442 references in A2780 appear legitimate

Remaining `A2442` mentions in A2780 files were reviewed. They appear to be explanatory cross-references, not contamination.

Examples:
- `different from A2442`
- `replaces Viper on A2442`
- `higher current than A2442`

Assessment:
- I did not find evidence of residual A2442 clone content in the architecture/body of the A2780 data.
- **PASS** on contamination beyond legitimate cross-reference text.

### 4. A2918 is separated from the Pro/Max Viper/Monaco board group

Evidence:
- `maps/power-path-comparison.md` now has a dedicated section:
  - `## M3 Pro Hybrid Architecture (A2918)`
- The text explicitly says A2918 does not follow the Viper/Monaco VR pattern.

Assessment:
- This satisfies the requested separation/classification check.
- **PASS**.

## Requested Verification Summary

1. All JSON files valid
- **PASS**

2. A2780 uses Austringer/CLVR, not A2442 Viper/Monaco
- **PASS**

3. No A2442 contamination in A2780 beyond legitimate cross-references
- **PASS**

4. No A3113 contamination in A3114
- **FAIL**

5. A2779 voltages consistent
- **FAIL**

6. A2918 separated from Pro/Max boards
- **PASS**

7. Master indexes accurate
- **FAIL**

## Final Assessment

The remediation set does **not** pass review.

The critical A2780 rebuild appears real and substantially fixes the prior clone problem. But the remediation still fails overall because:
- A3114 cleanup is incomplete,
- A2779 still contains a voltage contradiction,
- the master rail index is inaccurate,
- and the changelog overstates what was actually fixed.

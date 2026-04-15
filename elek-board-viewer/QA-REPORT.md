# QA Report

## Overall verdict: FAIL

## Findings first

1. **A2780 is effectively an A2442 clone, not a board-specific extraction.**
   - `maps/A2780/rails.json`, `ics.json`, `power-domains.json`, `power-sequence.json`, `signals.json`, and `connectors.json` are all >99.7% similar to A2442, with only token substitutions like board number / schematic number.
   - Example: `maps/A2442/rails.json` and `maps/A2780/rails.json` differ at the header only for the first diff hunk, while retaining the same `total_pp_rails_in_schematic: 340`, `active_rails_in_json: 229`, and A2442-era descriptions.
   - `maps/A2780/metadata.json` also does not preserve the pilot-style section map. Its `sections` object is reduced to a single note instead of a per-page section index.
   - This is a hard fail on both schema compliance and cross-board contamination.

2. **A3114 diagnostics still contain A3113-specific content.**
   - `diagnostics/A3114/common_faults.json` opens with: `These fault patterns are for A3113 (820-03285) ONLY`.
   - The file continues with `a3113_notes` fields throughout.
   - That is direct cross-board contamination in a diagnostic artifact.

3. **A2779 contains a verified voltage-description error on PP5V_S2.**
   - `maps/A2779/rails.json` says: `"PP5V_S2", "voltage": "5V (VOUT=15V noted on schematic, actual ~5V)"`.
   - Spot-checking schematic page 58 shows UC260 on the `5V_S2 VR` page with `Vout=5.15V`, not 15V.
   - The JSON rail voltage string is therefore internally contradictory and partly false.

4. **`maps/power-path-comparison.md` is inconsistent with the project’s own board grouping.**
   - The QA brief classifies `A2918` under Air/base boards using the A2681 schema.
   - `maps/power-path-comparison.md` instead lists `A2918` under `Pro/Max Boards`.
   - That inconsistency matters because the review instructions explicitly depend on board family.

## What I checked

- Read pilot outputs first: `maps/A2681/*`, `maps/A2442/*`, `diagnostics/A2681/*`, `diagnostics/A2442/*`
- Parsed every non-pilot JSON file in `maps/*` and `diagnostics/*`
- Verified page references against available schematic PNG page counts for all reviewed boards
- Spot-checked actual schematic PNGs for 3 boards:
  - Air: **A3114**
  - Pro/Max: **A2485_EVTc**
  - Pro/Max: **A2779**
- Reviewed master indexes and repass targets

## Per-board status

### Air/base boards
- **A2337: PASS**
  - JSON parses cleanly.
  - Page refs in range.
  - No hard failure found in this pass.

- **A2338: PASS**
  - JSON parses cleanly.
  - Page refs in range.
  - No hard failure found in this pass.

- **A2338_M2: PASS**
  - JSON parses cleanly.
  - Page refs in range.
  - No hard failure found in this pass.

- **A2918: PASS WITH NOTES**
  - JSON parses cleanly.
  - Page refs in range.
  - Metadata is board-specific and internally coherent.
  - Note: family classification is inconsistent in `maps/power-path-comparison.md`.

- **A3113: PASS WITH NOTES**
  - JSON parses cleanly.
  - Page refs in range.
  - Repass check passed: orphan rail `PP3V3_S2SM_CIO` is **not present** in A3113 outputs.

- **A3114: FAIL**
  - JSON parses cleanly and spot-check pages match major map claims:
    - page 51: UC300, `PP5V_S2`, `Vout=5.15V`
    - page 53: UC710, `3V3_S2 VR`, `VOUT=3.3V`
    - page 69: UF400 ATC0
    - page 70: UF500 ATC1
    - page 33: U5500 / ACE3 MagSafe controller page
  - But `diagnostics/A3114/common_faults.json` is still mislabeled and A3113-specific.

### Pro/Max boards
- **A2442_CTO: PASS WITH NOTES**
  - JSON parses cleanly.
  - Page refs in range.
  - Metadata is board-specific.

- **A2485: PASS**
  - JSON parses cleanly.
  - Page refs in range.
  - No hard failure found in this pass.

- **A2485_EVTc: PASS**
  - JSON parses cleanly.
  - Required diagnostic files exist: `diagnostic-tree.json`, `fault-signatures.json`, `test-points.json`.
  - Spot-checks matched schematic PNGs:
    - page 83: UG400 ATC2 controller
    - page 91: HDMI `MADEA` / UH700 page
    - page 94: `GL9755` SD card controller page
  - Repass item for EVTc diagnostics is satisfied.

- **A2779: FAIL**
  - JSON parses cleanly.
  - Page refs in range.
  - Spot-checks matched the expected architecture:
    - page 52: `CLVR0`
    - page 77: `UF400` ATC0
    - page 94: HDMI `COBRA`
    - page 122: `CARLOW B0 SILICON`
  - But the `PP5V_S2` voltage text in `maps/A2779/rails.json` is wrong, as noted above.

- **A2779_S: PASS**
  - JSON parses cleanly.
  - Page refs in range.
  - Repass check passed: malformed JSON issue appears fixed.

- **A2780: FAIL**
  - JSON parses cleanly.
  - Page refs are technically in range, but the content is not trustworthy.
  - Multiple core map files are near-identical to A2442 and do not read as A2780-specific extraction.
  - `metadata.json` also weakens the schema by collapsing the section map to a placeholder note.

## Schema compliance summary

- **Parsing:** all reviewed non-pilot JSON files parsed successfully.
- **Page references:** all referenced pages were within available PNG page ranges.
- **Board-family schema quality:** mixed.
  - A3114 and A2485_EVTc preserve strong board-specific metadata/maps.
  - **A2780 does not**. Its metadata does not match the pilot-style section map, and the map payloads are effectively cloned from A2442.
- Result: **schema compliance overall = FAIL** because at least one non-pilot board materially breaks the expected board-specific structure.

## PNG spot-check findings

### A3114
Verified against pages 33, 51, 53, 69, 70.
- Page 51 confirms UC300 on `5V_S2 voltage regulator` with `Vout=5.15V`.
- Page 53 confirms UC710 on `3V3_S2 VR` with `VOUT=3.3V`.
- Page 69 confirms UF400 on `USB-C: Port Controller ATC0`.
- Page 70 confirms UF500 on `USB-C: Port Controller ATC1`.
- Page 33 confirms ACE3 MagSafe controller page.
- Mapping quality looked good for sampled pages.

### A2485_EVTc
Verified against pages 74, 83, 91, 94, 122.
- Page 83 confirms UG400 on `USB-C: Port Controller ATC2`.
- Page 91 confirms `MADEA` HDMI controller page.
- Page 94 confirms `GL9755` SD card controller page.
- Sampled map/IC claims aligned with the schematic.

### A2779
Verified against pages 52, 58, 77, 94, 122.
- Page 52 confirms `CLVR0` page.
- Page 77 confirms UF400 ATC0 page.
- Page 94 confirms `COBRA` HDMI page.
- Page 122 confirms `CARLOW B0 SILICON` codec page.
- Page 58 confirms the `5V_S2 VR` page shows `Vout=5.15V`, which contradicts the `VOUT=15V` text embedded in `maps/A2779/rails.json`.

## Master index completeness

- **`maps/master-rail-index.json`: PASS**
  - Lists all 14 boards.
  - `total_boards` = 14 and board list matches the project inventory.

- **`maps/master-ic-index.json`: PASS**
  - Covers all 14 boards.

- **`maps/power-path-comparison.md`: FAIL**
  - Board-family grouping is inconsistent for A2918.

- **`maps/common-power-faults.md`: PASS WITH NOTES**
  - Fault patterns are generally plausible and refer to real power-path elements.
  - I did not fully re-verify every generic probe designator across all 14 boards, so residual risk remains.

## Repass fix verification

- **A3113 orphan rail removal:** PASS
  - `PP3V3_S2SM_CIO` is absent from A3113 outputs.

- **A2779_S malformed JSON fix:** PASS
  - All `maps/A2779_S/*.json` and `diagnostics/A2779_S/*.json` parse successfully.

- **A2485_EVTc diagnostics present and usable:** PASS
  - `diagnostic-tree.json`, `fault-signatures.json`, `test-points.json` all exist and parse cleanly.

## Residual risk

- I verified only 3 boards directly against PNGs, per the brief. Unspot-checked boards still carry moderate risk where files look heavily templated.
- A2780 contamination is severe enough that I would not trust downstream indexes or fault docs that ingest its data without rebuilding that board from source pages.

# Canonical Schema Specification — Schematic Extraction

**Date:** 2026-04-11
**Purpose:** Lock the exact JSON structure every board must follow. No deviations.
**Authority:** Derived from verified pilot outputs (A2681 for Air, A2442 for Pro/Max).

---

## File Inventory Per Board

Every board MUST have exactly these files in `maps/{board}/`:

1. `metadata.json`
2. `rails.json`
3. `ics.json`
4. `connectors.json`
5. `signals.json`
6. `power-path.json`
7. `power-path.md` (human-readable companion)
8. `power-sequence.json`
9. `power-domains.json`

And in `diagnostics/{board}/`:

10. `dcps_20v_triage.json`
11. `dcps_5v_triage.json`
12. `common_faults.json`

---

## Schema: metadata.json

```json
{
  "board_number": "string — e.g. A2681",
  "schematic_number": "string — e.g. 820-02536",
  "internal_name": "string — e.g. PJM-MLB",
  "model_identifier": "string — e.g. MacBook Air 13\" M2",
  "apple_part_number": "string — e.g. 051-08811",
  "chip": "string — e.g. M2",
  "form_factor": "string — MacBook Air | MacBook Pro",
  "screen_size": "string — e.g. 13.6\"",
  "year": "number — e.g. 2022",
  "revision": "string — e.g. DVT-1",
  "total_pages": "number — total schematic pages",
  "sections": {
    "section_name": "number|[number,number] — page or page range"
  }
}
```

**Required fields:** board_number, schematic_number, chip, form_factor, total_pages, sections.
**`sections` must be a real per-page section map, not a placeholder string.**

Pro/Max boards MAY add: `pro_max_variants`, `key_differences_from_a2681`.

---

## Schema: rails.json

**TWO valid structures depending on board family.**

### Air/Base family (A2337, A2338, A2338_M2, A2681, A2918, A3113, A3114)

```json
{
  "board": "string",
  "schematic": "string",
  "extraction_notes": "string — methodology notes",
  "rails": [
    {
      "name": "string — exact rail name from schematic, e.g. PPVBUS_USBC0",
      "voltage": "string — e.g. 5V, 3.8V, 1.05V",
      "state": "string — power state: G3H, AON, S2, S1, AWAKE etc",
      "source": "string — IC designator and name, e.g. UF400 (CD3217 ATC0)",
      "description": "string — what this rail does",
      "page": "number|[number] — schematic page(s)"
    }
  ]
}
```

Section headers as `{"section": "=== SECTION NAME ==="}` are ALLOWED for grouping but NOT REQUIRED. If present, they must not contain rail fields.

### Pro/Max family (A2442, A2442_CTO, A2485, A2485_EVTc, A2779, A2779_S, A2780)

```json
{
  "board": "string",
  "schematic": "string",
  "total_pp_rails_in_schematic": "number|string — approximate count",
  "active_rails_in_json": "number — rails actually extracted",
  "filtering_criteria": { "...": "what was included/excluded" },
  "nc_ldos": { "...": "LDOs confirmed not connected" },
  "rails": {
    "group_name": [
      {
        "name": "string — exact rail name from schematic",
        "voltage": "string",
        "source": "string — IC designator and name",
        "state": "string — power state",
        "page": "number|[number]",
        "enable": "string — optional, enable signal name",
        "description": "string — optional"
      }
    ]
  }
}
```

**Mandatory rail fields:** name, voltage, source, state, page.
**Every rail name MUST be copied exactly from the schematic. No guessing, no interpolation.**

---

## Schema: ics.json

```json
{
  "board": "string",
  "schematic": "string",
  "extraction_notes": "string — optional",
  "ics": [
    {
      "designator": "string — e.g. U5200, UC300",
      "function": "string — e.g. Charger IC",
      "description": "string — detailed description",
      "pages": "[number] — all schematic pages this IC appears on"
    }
  ]
}
```

**Every IC designator MUST match the schematic exactly.**

---

## Schema: connectors.json

```json
{
  "board": "string",
  "schematic": "string",
  "connectors": [
    {
      "designator": "string — e.g. J5150, or descriptive if no designator on schematic",
      "type": "string — USB-C, MagSafe, Display, Battery, SSD, etc",
      "controller": "string — associated controller IC",
      "position": "string — physical position",
      "signals": {
        "signal_type": "string — signal/rail name"
      }
    }
  ]
}
```

---

## Schema: signals.json

```json
{
  "board": "string",
  "schematic": "string",
  "signals": {
    "category_name": [
      {
        "name": "string — exact signal name from schematic",
        "type": "string — enable, reset, interrupt, data, clock, etc",
        "description": "string — what this signal does",
        "source": "string — originating IC/block",
        "destination": "string — target IC/block",
        "page": "number|[number]"
      }
    ]
  }
}
```

**Categories:** power_enables, resets, clocks, interrupts, i2c_spi, usb, display, audio, debug, misc.

---

## Schema: power-path.json

```json
{
  "board": "string",
  "schematic": "string",
  "description": "string — overview of the power delivery chain",
  "stages": [
    {
      "stage": "number",
      "name": "string — e.g. USB-C Input",
      "description": "string",
      "components": ["string — IC designators"],
      "input_rails": ["string — rail names"],
      "output_rails": ["string — rail names"],
      "page": "number|[number]"
    }
  ]
}
```

---

## Schema: power-sequence.json

```json
{
  "board": "string",
  "schematic": "string",
  "description": "string",
  "sequence": [
    {
      "step": "number",
      "rail_or_event": "string",
      "description": "string",
      "enable_signal": "string — optional",
      "depends_on": "string|[string] — optional, previous step(s)"
    }
  ]
}
```

---

## Schema: power-domains.json

```json
{
  "board": "string",
  "schematic": "string",
  "description": "string",
  "domains": [
    {
      "name": "string — e.g. AON, S2, S1, AWAKE",
      "description": "string — when this domain is active",
      "rails": ["string — rail names in this domain"],
      "pmu": "string — which PMU/VR controls this domain"
    }
  ]
}
```

---

## Schema: dcps_20v_triage.json / dcps_5v_triage.json

```json
{
  "board": "string",
  "schematic": "string",
  "WARNING": "string — board-specific, must name THIS board",
  "scenarios": [
    {
      "range": "string — current draw range, e.g. 0-0.05A",
      "meaning": "string — what this current draw indicates",
      "steps": [
        {
          "step": "number",
          "action": "string — what to do",
          "measure": "string — what to probe and where",
          "component": "string — specific component designator to probe",
          "expected": "string — expected measurement value",
          "if_missing": "string — what it means if not present",
          "next_if_ok": "number — next step if measurement is correct"
        }
      ]
    }
  ]
}
```

**Every component designator in diagnostic steps MUST exist in that board's ics.json or rails.json.**
**Every WARNING field MUST name the correct board number and schematic number.**

---

## Schema: common_faults.json

```json
{
  "board": "string",
  "schematic": "string",
  "WARNING": "string — board-specific",
  "faults": [
    {
      "name": "string — fault name",
      "symptom": "string",
      "probe_point": "string — specific component to measure",
      "expected_value": "string",
      "causes": ["string"],
      "fix": "string",
      "board_specific_notes": "string — optional, notes for THIS board only"
    }
  ]
}
```

---

## Validation Rules

1. All JSON must parse cleanly
2. `board` field in every file must match the directory name
3. `schematic` field must match the board's actual schematic number
4. WARNING fields in diagnostics must reference the correct board
5. All page references must be within the board's `total_pages` from metadata.json
6. No cross-board contamination: grep for other board numbers should return 0 (except legitimate comparison notes in power-path.md)
7. Rail names must follow Apple conventions: `PP` prefix for power, uppercase, underscores
8. IC designators must follow Apple conventions: single letter prefix (U, C, R, L, J, D, Q, F) + numbers
9. Every diagnostic step component must be traceable to the board's maps data

---

## Quality Bar

**95% verified:** For each board, at least 95% of rails and ICs must be confirmed against actual schematic PNG pages. The remaining 5% may be flagged as "ambiguous due to PNG readability" but must not be fabricated.

**Zero fabrication:** If a value can't be read from the schematic, mark it as "UNREADABLE" rather than guessing.

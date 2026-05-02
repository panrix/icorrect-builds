# Project State — iCorrect Diagnostic System

**Last updated:** 2026-04-18 (Ricky + Claude Code session)
**Repo root:** `/home/ricky/builds/elek-board-viewer`

This file is the **single source of truth for project status**. Update it whenever a phase completes or a significant decision is made. Any Claude session or new collaborator should read this first to understand where things stand.

---

## What this project is

An end-to-end diagnostic system for Apple Silicon MacBook logic board repair at iCorrect. Built on top of the FlexBV headless board viewer, this system gives techs (primarily Saf) verified, schematic-derived step-by-step triage flows for every active repair.

**Why it exists:** Saf's diagnostic time is too long because flows aren't mapped. He sees the same faults repeatedly but no documented playbook exists. Every repair re-invents the diagnostic. The system fixes this by producing reusable, schematic-verified flows.

**Longer-term vision** (see `diagnostics_complete_exploration (1).md`): intake → diagnostics → repair → post-test → QC pipeline with software L1/L2/L3 layers, hardware test jigs, AOI, eventually robotics. This project is the **Level 0 foundation** (process documentation for logic board triage) that everything else stacks on.

---

## Current state (snapshot)

### ✅ Completed

1. **FlexBV Headless Board Viewer** — components/pins lookup via `scripts/board_lookup.py`, runs under Xvfb on the VPS
2. **18 schematic-derived diagnostic flow files** across 10 Apple Silicon board families (A2337, A2338, A2442, A2485, A2681, A2779, A2780, A2918, A3113, A3114)
3. **MASTER-TRIAGE-FLOW.json** — universal triage with forced-start bypass, comparator lookup per board, 10 diagnostic shortcuts
4. **ERROR-CODE-MAP.json** — DFU restore error codes mapped to subsystems
5. **V3 Infrastructure** (committed `9d91de5`, 2026-04-17):
   - Schematic text extraction: 49 → **54,146 components** + **12,216 nets** across all 19 board revisions
   - BRD net extraction: cracked FlexBV's encrypted BRD format via process memory read. **92–100% pin-level net coverage** across all 17 boards. Every pin now has a real net name.
   - Script: `scripts/extract_nets_from_flexbv.py`
6. **Phase 0 triage briefs** (committed `57a05e2`, 2026-04-17) — 6 final briefs posted to Saf on Monday on 2026-04-18:
   - Sion Bola (A2681, 4010 + 3.2A short)
   - BM 1488 (A2338, boots to Diagnostics — waiting on IRP Apple config)
   - Raj Huque (A2442, 5V stuck, Ricky's friend)
   - Nicola Aaron BM (A3113, hall sensor dead since Feb)
   - BM 443 (A2442, 4010 at 10% install)
   - A2442 Diagnostic (7802334790, DFU no-link, parked since May 2025)
7. **Flow file QA pass** (2026-04-17) — identified 128 phantom components, 281 phantom nets, 15 wrong net assignments across existing flow files. Documented in `diagnostics/FLOW-QA-REPORT.md`.
8. **Canonical reference output** — per-board ground truth JSON + MD in `data/board_reference/` (all 17 boards committed). These are the outputs; the generator script that produced them was LOST (see section below).
9. **Saf reference sheet** — `diagnostics/templates/SAF-REFERENCE-SHEET.md`. Two 5-line templates (Ready to Quote, In Progress) + phrase sheet to replace Saf's shorthand with full sentences. Rule: every note starts with ammeter reading.

### ⚠️ Lost work (needs rebuilding)

Between the 2026-04-17 commits and the 2026-04-22 session, the working tree reset — the session had produced work that was never committed and got wiped:

- **A2681 flow file pilot rewrite** (4 files: `dcps_20v_triage.json`, `dcps_5v_triage.json`, `common_faults.json`, `diagnostic-tree.json`) — rewritten from BRD-verified net data, verified clean. REVERTED to pre-rewrite state on disk.
- **`scripts/build_board_reference.py`** — generator for the canonical references. Outputs survived in `data/board_reference/` but the generator itself was lost. Reconstructable from the output format.
- **`scripts/qa_flow_files.py`** — flow file QA tool that found 128 phantom components / 281 phantom nets / 15 wrong assignments in the pre-rewrite flows.
- **`scripts/verify_flow_claims.py`** — claim verifier that walks flow files and cross-checks every `{component, side, rail}` tuple against parser_cache.
- **`diagnostics/FLOW-QA-REPORT.md`** — auto-generated report of phantom components/nets per board.

**Rule learned:** commit often, don't let session work live on uncommitted disk. The canonical references survived because they're outputs of a generator and weren't overwritten.

### 💡 Key architecture discoveries from the lost A2681 pilot (preserved in this doc so they're not lost)

- **U8100 is MPMU on A2681, U7700 is SPMU** — previous flow files had this backwards. Canonical: U8100 has `MPMU_*` nets, U7700 has `SPMU_*` nets.
- **A2681 has no discrete PMU_VDD_HI comparator** — M1's U8110 doesn't exist on M2. A2681 uses U5910 summing amplifier integrated with UV warning signals (`MPMU_VDDMAIN_UVWARN_L`, `SPMU_VDDMAIN_UVWARN_L`, `PMU_VDDHI_UVWARN_L`).
- **A2681 has no discrete NAND fuses** — FL4000/FL4001 don't exist on A2681; those are A2442-specific. NAND rails sourced directly from U7700 SPMU.
- **M1 → M2 net rename**: `_MAME_*` (M1 Pro codename) → `_AWAKE_*` (M2 codename). Voltage differences too: `PP3V8_MAME_NAND_VDDL` (3.8V on M1 Pro) → `PP0V88_AWAKE_NAND_VDD` (0.88V on M2).
- **A2681 NAND rails confirmed**: `CN010` pin 1 = `PP0V88_AWAKE_NAND_VDD` (BOTTOM). `CN032` pin 1 = `PP1V25_AWAKE_NAND_VCCQ` (BOTTOM). `CN020` pin 1 = `PP2V58_AWAKE_NAND_VCC` (TOP). `RP002` = `PMU_SYS_ALIVE ↔ NAND0_PFN_L` (TOP).
- **Board-side corrections from the pilot** (human-verified, worth repeating on re-do): UF500 is TOP (not BOTTOM). UR600/UR630/UR700/UR730 speaker amps are BOTTOM (not TOP). UL000 WiFi module is BOTTOM. UN000 is BOTTOM, UN100 is TOP. CL005 is BOTTOM.

### 🔄 In progress

- **User review of A2681 pilot** — Ricky has the 4 rewritten files and needs to verify content before we scale to other boards
- **Saf working through the 5 posted briefs** — BM 1488 separately blocked waiting on IRP friend's Apple config availability

### ⏳ Planned

- **Option C scaling**: rewrite flow files for the 13 remaining board revisions using the A2681 pilot as template. Delegate to Codex with canonical reference as ground truth + automated QA verification via `verify_flow_claims.py`.
- **Phase 1 queue batch**: tackle the remaining 12 flow-covered queue items (we did 6 in Phase 0, left ~12 more in Saf's short/long deadline queues on flow-covered boards)
- **Enrichment script**: automated matching of Monday repair items → diagnostic flows (original goal from start of conversation). Depends on Phase 1 learnings.
- **Feedback loop**: capture Saf's outcomes per brief (which step found the fault, time taken, actual fix) and append to `common_faults.json` per board. Closes the loop between theory (flow files) and reality (real repairs).

---

## Key decisions made

| Decision | Date | Rationale |
|---|---|---|
| Option C (full rewrite with verified data) over A (auto-fix M1→M2 only) or B (Codex semantic search) | 2026-04-18 | Ricky prioritised quality over speed. Diagnostic system is foundational, must be accurate. |
| A2681 as pilot board before scaling | 2026-04-18 | Most active diagnostic board (Sion Bola + future M2 MBA repairs). If pilot works, pattern is proven. |
| Inject canonical reference first, rewrite flows second | 2026-04-18 | Grounds every rewrite in verified BRD data. Prevents hallucinations. |
| Post diagnostics as Ricky's user (not Jarvis bot) | 2026-04-18 | No separate Jarvis Monday token exists. Posts come from Ricky, which is what Saf expects anyway. |
| Living PROJECT-STATE.md | 2026-04-18 | Context windows exhaust; the repo must carry state. This file is the durable memory. |

---

## Known issues / backlog

- **Flow file contamination (most boards):** M1 Pro naming (`_MAME_*`) copy-pasted into M2/M3/M4 flow files. See `diagnostics/FLOW-QA-BACKLOG.md` for specific issues, `diagnostics/FLOW-QA-REPORT.md` for the automated run output. A2681 now fixed; 13 other boards still need rewrite.
- **BRD net coverage incomplete on some boards:** A2338 (92.6%), A2338_M2 (92.2%), A2918 (81.7%). Not critical for any of the active briefs but worth revisiting when we get to those boards.
- **QA tool false positives:** `scripts/qa_flow_files.py` regex flags component/net names mentioned in `revision_history` / `architecture_note` text as phantom references. Harmless but noisy. Can be tightened later.
- **BM 1488 blocked externally** — waiting for Ricky's IRP friend to confirm Apple config availability for A2338 logic board activation.

---

## Repo map (where things live)

```
/home/ricky/builds/elek-board-viewer/
├── PROJECT-STATE.md              ← this file — read first
├── diagnostics/
│   ├── MASTER-TRIAGE-FLOW.json   ← universal triage, forced-start bypass
│   ├── ERROR-CODE-MAP.json       ← DFU error codes
│   ├── FLOW-QA-BACKLOG.md        ← known issues in flow files
│   ├── FLOW-QA-REPORT.md         ← automated QA run output
│   ├── <BOARD>/                  ← per-board flow files
│   │   ├── diagnostic-tree.json  ← master narrative, power-on sequence
│   │   ├── dcps_20v_triage.json  ← 20V ammeter scenarios → steps
│   │   ├── dcps_5v_triage.json   ← 5V ammeter scenarios → steps
│   │   ├── common_faults.json    ← known fault patterns
│   │   └── ...
│   ├── triage-briefs/            ← per-case diagnostic briefs for Saf
│   │   └── <date>-<case>-<board>.md
│   └── templates/
│       └── SAF-REFERENCE-SHEET.md ← Saf's note template + phrase sheet
├── data/
│   ├── board_index.json          ← board model → BRD path
│   ├── schematic_index.json      ← 54K components mapped to pages (V3)
│   ├── board_reference/          ← canonical ground truth per board (V3)
│   ├── nets/                     ← per-board net exports (V3)
│   ├── parser_cache/             ← BRD parser output with net data (V3)
│   └── safan_diagnostics_enriched.json  ← Monday repair history
├── schematics/
│   └── <A-number> <820-...>/     ← per-board PDFs + PNG pages + BRD
└── scripts/
    ├── board_lookup.py           ← CLI: lookup component by designator
    ├── brd_parser.py             ← parse BRD via FlexBV debug output
    ├── extract_nets_from_flexbv.py ← V3: net extraction from process memory
    ├── build_board_reference.py  ← V3: generate per-board canonical reference
    ├── build_schematic_index.py  ← V3: pdftotext schematic index
    ├── qa_flow_files.py          ← V3: automated flow file QA
    └── verify_flow_claims.py     ← V3: verify every component/side/rail claim
```

---

## How to continue this project

**If you're a fresh Claude session picking this up:**

1. Read this file top to bottom
2. Read the vision doc: `diagnostics_complete_exploration (1).md`
3. Check `git log --oneline | head -10` to see recent work
4. Run `python3 scripts/verify_flow_claims.py` to see current flow health per board
5. Check the Ricky/Saf Diagnostics group on Monday (board_id 349212843, group `group_mm2hf32e`) for active Saf work

**Next concrete actions** (as of 2026-04-22):

1. **Rebuild the lost scripts** (in order):
   - `scripts/build_board_reference.py` — reverse-engineer from the output format in `data/board_reference/*.json`
   - `scripts/verify_flow_claims.py` — walks flow file JSON, extracts every `{component, side, rail}` triplet, cross-checks against `data/parser_cache/<BOARD>.json`. KD-tree or direct dict lookup. Should output colour-coded PASS/FAIL per file.
   - `scripts/qa_flow_files.py` — walks flow file text with regex, extracts component designators and net names, reports phantoms (references not on board) and wrong assignments (component claimed on a net it doesn't carry). Known issue: false positives from `revision_history` / `architecture_note` text.

2. **Redo A2681 pilot rewrite** using `data/board_reference/A2681_820-02536.{json,md}` as ground truth. Use the preserved architecture discoveries (see ⚠️ Lost work section) as the starting correction list. Verify with `verify_flow_claims.py` after.

3. **Saf's Monday diagnostics** — wait for replies. He has 5 cases to work through (posted 2026-04-18).

4. **Adebiyi Aderinoye (A2918)** — diagnostic analysis done 2026-04-22 in conversation but not saved as a file. Board has hidden fault (2.2A normal boot current, forced DFU works, normal DFU + display + keyboard + trackpad all fail). Ricky posted short version to Monday directly. Worth writing up as a proper brief if it comes back as a learning case.

5. After pilot is clean, **scale to 13 remaining board revisions** using same pattern.

**To run the V3 build end-to-end on a new board** (once scripts are rebuilt):
```bash
# 1. Extract net data from BRD via FlexBV memory read (one board or --all)
python3 scripts/extract_nets_from_flexbv.py

# 2. Generate canonical reference (script needs rebuilding)
python3 scripts/build_board_reference.py

# 3. After flow files are rewritten, verify claims (script needs rebuilding)
python3 scripts/verify_flow_claims.py <BOARD>

# 4. Find phantom components/nets in flow files (script needs rebuilding)
python3 scripts/qa_flow_files.py
```

---

## Reminders

- **Single phase at a time.** Per `CLAUDE.md`, don't compress multi-phase work into one session.
- **Honesty over completion.** Output a COMPROMISES section at the end of significant builds.
- **Verify infrastructure.** After any flow file edit, run `verify_flow_claims.py` before committing.
- **This file is the handoff contract.** Update it when phases complete.

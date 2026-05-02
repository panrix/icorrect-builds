# Codex Brief: V3 Infrastructure — Schematic Text Extraction + BRD Net Extraction

**Project:** /home/ricky/builds/elek-board-viewer
**Date:** 2026-04-16
**Owner:** Ricky via Claude Code
**Priority:** CRITICAL — blocks the entire diagnostic system

---

## Why this is urgent

We are building a diagnostic triage system for Apple Silicon MacBook logic board repair. We have 18 board-specific diagnostic flow files, a MASTER-TRIAGE-FLOW, and an ERROR-CODE-MAP. Technicians follow these flows to diagnose faults.

**The flows are currently broken in two ways:**

1. **Component designators can't be verified.** Flows reference specific components (e.g. "probe CN032 for PP1V25_MAME_NAND_VCC") but we can't confirm what net a component is on because the BRD parser returns `"net": null` for every pin. Today we wrote a triage brief that incorrectly identified UP700 as the NAND PMIC when it's actually display power — because we had no net data to check.

2. **Schematic page references are incomplete.** The current `schematic_index.json` only indexes **49 components total** across all 17 boards. Most components can't be mapped to their schematic page. When we need to find which page shows a specific IC, we're guessing.

Both problems are addressed by PLAN-V3. The plan exists at `/home/ricky/builds/elek-board-viewer/PLAN-V3.md` — **read it fully before starting.** It contains detailed implementation steps, file paths, validation criteria, and investigation approaches. However, **Task 1 needs a different approach than the plan describes** — see below.

---

## What to build

### Task 1: Schematic Text Extraction via OCR (PLAN-V3 Phase 2 — REVISED APPROACH)

**Goal:** Extract every component designator and net/signal name from every page of every schematic, build a comprehensive index.

**CRITICAL: `pdftotext` DOES NOT WORK on these PDFs.** We tested it — output is garbage. The PDFs are:
- Encrypted with RC4 (`copy:no` flag set)
- Created by Allegro Design Publisher
- Contain no extractable text layer — they are image-only PDFs

**The existing schematic PNGs are already rendered at 300 DPI (10359x6774 pixels per page).** These are high-quality images suitable for OCR.

**Implementation — try in this order:**

**Step 1: Attempt PDF decryption (15 minutes)**

Install `qpdf` and try to strip the copy protection:
```bash
sudo apt-get install -y qpdf
qpdf --decrypt "schematics/A2681 820-02536/A2681_Schematic.pdf" /tmp/A2681_decrypted.pdf
pdftotext -f 25 -l 25 /tmp/A2681_decrypted.pdf -
```
If this produces readable text (component designators like U5200, net names like PPBUS_AON), use `qpdf --decrypt` + `pdftotext` for all boards. This is the fastest path.

If the output is still garbage after decryption, the PDFs genuinely have no text layer. Move to Step 2.

**Step 2: OCR the existing 300 DPI PNGs**

Install Tesseract:
```bash
sudo apt-get install -y tesseract-ocr
```

Run OCR on each schematic page PNG:
```bash
tesseract "schematics/A2681 820-02536/pages/A2681_Schematic-025.png" stdout 2>/dev/null
```

Test on 5 pages from different boards and sections (a power page, an SoC page, an SSD page, a BOM page, an alias page). Evaluate:
- Are component designators readable? (U5200, C8430, R1234, CN032)
- Are net names readable? (PPBUS_AON, PP3V8_AON_VDDMAIN, NAND0_OCARINA_PGOOD)
- Are pin labels readable? (smaller text — may struggle)

If component designators and net names are consistently extracted at 300 DPI, proceed with full OCR. If OCR accuracy is poor (>10% miss rate on spot checks), move to Step 3.

**Step 3: Re-render PDFs at 600 DPI and re-OCR (if Step 2 accuracy is poor)**

Use `pdftoppm` (already installed via poppler-utils) to render at higher resolution:
```bash
pdftoppm -png -r 600 -f 25 -l 25 "schematics/A2681 820-02536/A2681_Schematic.pdf" /tmp/A2681_600dpi
```

This produces ~20000x13000 pixel images. Re-run Tesseract on the 600 DPI renders.

If 600 DPI OCR works well:
- Re-render ALL schematic pages at 600 DPI into a `pages_600dpi/` subdirectory per schematic folder
- Use these for OCR extraction
- Keep the existing `pages/` directory (300 DPI) for board viewer display — 600 DPI is too large for quick viewing
- Store both paths in the index: `"images_300dpi"` and `"images_600dpi"`

**Step 4: Build the comprehensive index from OCR output**

For each page's OCR text:
1. Extract component designators using regex: `[UCRLJDQTF][A-Z]?\d{2,5}[A-Z]?` and also the broader Apple pattern including `CN`, `CF`, `RP`, `UP`, `UC`, `UR`, `FL`, `TP`, `UN` prefixes: `(?:CN|CF|RP|UP|UC|UR|FL|TP|UN|CD)\d{2,5}[A-Z]?`
2. Extract net/signal names matching Apple conventions: `PP[A-Z0-9_]+`, `PPBUS_[A-Z0-9_]+`, `GND`, `VCC`, net names containing `_AON`, `_S2`, `_S3`, `_PGOOD`, `_PFN`, `_SYS_ALIVE`, `_NAND`, `_MAME`, `_OCARINA`
3. Map each to `{component_or_net: {pages: [int], images: [path]}}`
4. Merge with existing `page_index.md` data (don't discard it — it has curated section descriptions)

**Step 5: Handle multi-PDF boards**

Some boards have multiple schematic PDFs (A2780 has Pro and Max variants). Track which PDF each page came from.

**Step 6: Integrate into board_lookup.py**

The existing code already checks `schematic_index.json` and returns `schematic_pages` and `schematic_images`. After rebuilding the index with full coverage, these fields will automatically populate for most components.

Add a new `--schematic-net` flag:
```bash
python3 scripts/board_lookup.py A2681 --schematic-net PPBUS_AON
# Returns pages where PPBUS_AON appears in the schematic text
```

**Input:**
- 20 schematic directories in `schematics/*/`
- Each contains: one or more PDFs, a `pages/` directory with 300 DPI PNGs, a `page_index.md`
- Existing `data/schematic_index.json` (49 components, sparse)
- `poppler-utils` installed (`pdftoppm`, `pdftotext`, `pdfinfo`)

**Output:**
- Rebuilt `data/schematic_index.json` with 500–2000+ components AND net names per board
- If 600 DPI re-renders are needed: `pages_600dpi/` subdirectories per schematic folder

**Validation:**
- `U5200` on A2681 should appear on pages 25–26 (charger circuit)
- `U0600` (SoC) should appear on many pages (5–22 range)
- `PPBUS_AON` should appear on pages 25–26 and power alias pages (92–95)
- Search for any `*_PGOOD` or `*OCARINA*` strings on A2681 — report what's found and which pages
- Total indexed components per board should be 500+
- Cross-check 10 known components from `page_index.md` entries — OCR results must agree

**Files to modify/create:**

| File | Action |
|---|---|
| `scripts/build_schematic_index.py` | Extend with OCR extraction (qpdf+pdftotext fallback, or Tesseract) |
| `scripts/ocr_schematic.py` (new, optional) | Standalone OCR module if extraction logic is complex |
| `data/schematic_index.json` | Regenerate with full coverage |
| `scripts/board_lookup.py` | Add `--schematic-net` flag |

---

### Task 2: BRD Net Extraction (PLAN-V3 Phase 3)

**Goal:** Extract net names from BRD binary files so that every component pin has a populated `"net"` field.

**Input:**
- `.brd` files in each `schematics/*/` directory (one per board revision)
- Existing `scripts/brd_parser.py` which already parses components and pins but returns `"net": null`
- `/opt/flexbv/fbvpdf` (39.2MB, untested — may export net-annotated PDFs)
- OpenBoardView source at https://github.com/OpenBoardView/OpenBoardView — check `src/openboardview/FileFormats/` for BRD format documentation
- **Ground truth:** A2337 has a `.bvr` file (`schematics/A2337 820-02016/820-02016_V1.0.bvr`) WITH net names. Use this to validate any extraction approach — BVR net names must match BRD-extracted net names for the same components.

**Output:**
- Net names populated for every pin: `{"pin": "1", "x": 3718.0, "y": 534.0, "net": "PP3V8_AON"}`
- New `--net` query mode in `board_lookup.py`: `python3 scripts/board_lookup.py A2681 --net PPBUS_AON` returns all components on that net
- Per-board net data cached (bump `CACHE_VERSION` in `scripts/common.py`)

**Investigation approach (follow PLAN-V3 Phase 3 exactly):**

Try these in order, time-boxed:

1. **fbvpdf export (30 min)** — run `/opt/flexbv/fbvpdf` on a BRD file, see if it produces net-annotated output
2. **FlexBV debug flags (30 min)** — check if `flexbv -d` has additional verbose/net flags: `strings /opt/flexbv/flexbv | grep -i 'net\|debug\|verbose\|dump\|export'`
3. **BRD binary parsing (2–4 hours)** — search for net name strings in the binary, reverse-engineer the structure. Start with: `python3 -c "data=open('PJM-MLB.brd','rb').read(); [print(data[max(0,i-16):i+len(b'PPBUS_AON')+16]) for i in range(len(data)) if data[i:i+9]==b'PPBUS_AON']"`. Cross-reference with OpenBoardView's format parsers at `src/openboardview/FileFormats/`.
4. **Check if the BRD files are actually BVR-compatible** — the A2337 BVR file has net names. Try renaming a .brd to .bvr and opening it, or compare binary headers between the A2337 .bvr and .brd files.
5. **FlexBV GUI automation (last resort, 1–2 hours)** — use xdotool to click components and read status bar text

**IMPORTANT:** The BRD files in this repo may be XOR-encoded. The existing `brd_parser.py` already handles this — check its `_decode()` method and reuse that logic. Do NOT skip the decode step when searching for strings — you may need to decode first.

**Also check:** The `.brd` file at `schematics/A2681 820-02536/PJM-MLB.brd` returned no net name strings via `strings`. But the file may be XOR-encoded. After decoding, try `strings` again. The decode key/method is in `brd_parser.py`.

**Validation:**
- A2337: Compare BRD-extracted nets against BVR net names. Must match for at least 95% of components.
- A2681 `C8430` must return a net name (verify against schematic)
- A2681 `--net PPBUS_AON` must return multiple components including U5200, C5704
- At least 3 boards must have full net coverage
- Run against ALL boards and report coverage percentage per board

**Files to modify/create:**

| File | Action |
|---|---|
| `scripts/brd_parser.py` | Add net extraction to `BoardData` |
| `scripts/brd_net_parser.py` (new) | Standalone net parser if approach requires separate module |
| `scripts/board_lookup.py` | Add `--net` flag, populate `nets` in JSON output |
| `scripts/common.py` | Bump `CACHE_VERSION` |

---

## Critical constraints

1. **Do not break the existing board_lookup.py interface.** All existing JSON output fields must remain. Net data and schematic net data are additive.
2. **Do not modify any diagnostic flow files** (`diagnostics/*/`). This task is infrastructure only.
3. **Cache invalidation:** After net extraction is working, bump `CACHE_VERSION` in `scripts/common.py` so old caches are regenerated.
4. **Test on A2681 first** (our most active diagnostic board), then expand to all boards.
5. **If BRD net parsing fails for all approaches**, document what was tried and why it failed. Do not silently skip — we need to know what's impossible vs. what wasn't attempted.
6. **Install packages as needed.** You have sudo access. `qpdf`, `tesseract-ocr`, and any Python OCR libraries (pytesseract, etc.) can be installed.
7. **Existing 300 DPI PNGs must be preserved.** If you render 600 DPI versions, put them in a separate `pages_600dpi/` directory. Do not overwrite the existing `pages/` directory.

---

## Environment

- **OS:** Ubuntu 22.04 (Linux 6.8.0-107-generic)
- **Python:** 3.12
- **poppler-utils:** installed (`pdftotext` v24.02.0, `pdftoppm`, `pdfinfo`)
- **qpdf:** NOT installed — install with `sudo apt-get install -y qpdf`
- **tesseract-ocr:** NOT installed — install with `sudo apt-get install -y tesseract-ocr`
- **FlexBV:** `/opt/flexbv/flexbv` and `/opt/flexbv/fbvpdf`
- **Project root:** `/home/ricky/builds/elek-board-viewer`
- **Schematics:** `schematics/*/` (20 directories, one per board revision)
- **BRD files:** one `.brd` per schematic directory
- **BVR file (ground truth):** `schematics/A2337 820-02016/820-02016_V1.0.bvr` — has net names
- **PNG pages:** pre-rendered at 300 DPI (10359x6774) in `schematics/*/pages/`
- **PDF properties:** Encrypted (RC4, copy:no), created by Allegro Design Publisher, image-only (no text layer)
- **Existing board index:** `data/board_index.json`
- **Existing schematic index:** `data/schematic_index.json` (49 components total, sparse)

---

## Definition of done

1. `python3 scripts/board_lookup.py A2681 C8430 --info-only` returns populated net names (not `null`)
2. `python3 scripts/board_lookup.py A2681 --net PPBUS_AON` returns a list of components on that net
3. `data/schematic_index.json` has 500+ components per board with page mappings
4. Schematic index includes net/signal name → page mappings (specifically: report all `*_PGOOD` signals found on A2681)
5. All 13 Apple Silicon boards have net coverage (report percentage per board)
6. No regressions in existing smoke tests: `python3 scripts/qa_smoke_test.py` passes
7. COMPROMISES section at the end of the work documenting any shortcuts, skips, or fragile areas
8. If 600 DPI re-renders were needed: document which boards needed them and why

---

## Build order

```
Task 1 and Task 2 can run in parallel — they have no dependencies on each other.

Task 1: Schematic Text Extraction (~3-6 hours)
  Step 1: Try qpdf --decrypt + pdftotext (15 min)
  Step 2: If no text layer → install Tesseract, test OCR at 300 DPI (30 min)
  Step 3: If OCR accuracy poor → re-render at 600 DPI, re-test (1 hour)
  Step 4: Full OCR extraction across all 2,501 pages (1-2 hours compute)
  Step 5: Build comprehensive schematic_index.json
  Step 6: Validate coverage + integrate into board_lookup.py

Task 2: BRD Net Extraction (~4-8 hours, research-dependent)
  Step 1: Investigation — try approaches 1-5 above (2 hours max)
  Step 2: Implement viable approach
  Step 3: Integrate into brd_parser.py
  Step 4: Add --net query mode to board_lookup.py
  Step 5: Validate against A2337 BVR ground truth
  Step 6: Run across all boards, report coverage
```

---

## What this unblocks

Once these two tasks are complete:
- Every triage brief can be **verified** — we can confirm which net a test point is on before telling a tech to probe it
- We can identify the NAND PMIC on any board by searching for components on `PP1V25_MAME_NAND_VCC` or equivalent
- We can find PGOOD signals by searching for `*_PGOOD` nets
- We can trace power paths programmatically (rail → all components on that rail)
- The diagnostic flow files can be automatically validated (every component reference checked against BRD data)
- Schematic pages for ANY component can be found instantly instead of guessing
- The full diagnostic system vision (intake → triage → repair → verification) becomes feasible

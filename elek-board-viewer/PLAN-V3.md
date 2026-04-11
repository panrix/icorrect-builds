# Board Viewer V3 — Resolution, Schematic Coverage, Net Extraction

**Owner:** Elek (diagnostics agent)
**Executor:** Codex
**Project root:** `/home/ricky/builds/elek-board-viewer`
**Depends on:** PLAN-V2 (completed)

## Vision

V2 gave us correct annotation placement and three zoom levels. V3 fixes the blurry closeups, fills the schematic index from 49 to thousands of components, and — the big unlock — extracts net data from BRD files so we can answer "what does this component connect to?" without clicking anything in FlexBV.

---

## Phase 1: High-Resolution Capture

### Problem

The 3/3 closeup is blurry. We crop ~80x80 pixels from a 1600x900 screenshot and upscale it. That's digital zoom on a low-res source.

### Fix

Increase the Xvfb and FlexBV rendering resolution. More pixels in the base capture = cleaner crops at all zoom levels.

### Implementation

**Step 1 — Increase Xvfb resolution:**

The headless display service runs at `1920x1080x24` (see `flexbv_session.sh` and `brd_parser.py:77`).

Update to `3840x2160x24` (4K):
- `scripts/flexbv_session.sh` — change Xvfb `-screen 0` argument
- `systemd/flexbv-headless.service` — if resolution is specified there too

**Step 2 — Increase FlexBV window size:**

`common.py:34-35` defines `WINDOW_WIDTH = 1600` and `WINDOW_HEIGHT = 900`.

Update to `3200x1800` (or match Xvfb at `3840x2160` if FlexBV handles it):
- `scripts/common.py` — update `WINDOW_WIDTH` and `WINDOW_HEIGHT`
- The `-x` and `-y` flags in `flexbv_controller.py:173` and `brd_parser.py:83` use these values

**Step 3 — Update viewport detection:**

`flexbv_controller.py` caches viewport rects based on the screenshot dimensions. After resolution change:
- Clear the viewport cache (delete `data/boardview_state/runtime.json` or bump a cache key)
- The viewport detection should auto-adapt since it scans the actual image, but verify
- `ROW_DARK_PIXEL_THRESHOLD` in the viewport detector may need scaling (currently 600 for 1600px width — scale proportionally to new width)

**Step 4 — Update Pillow crop sizing:**

The crop window sizes for `region` and `closeup` are currently tuned for 1600x900. At 4x the resolution:
- The crop windows should be ~4x larger in pixels to capture the same board area
- Or keep the same board-area coverage but now have 4x the pixel density in each crop
- Recommendation: keep the same board-area coverage. The closeup that was 80x80 pixels becomes 320x320 pixels — much cleaner.

**Step 5 — Output image sizing:**

The final output images don't need to be 3840x2160 for Telegram delivery. After cropping:
- Overview: resize to 1600x900 for delivery (full detail preserved from the high-res source)
- Region: resize to 1200x1200 or similar
- Closeup: resize to 800x800 or similar
- This keeps file sizes reasonable for Telegram while preserving the detail gained from high-res capture

**Step 6 — Restart the headless service:**

```bash
systemctl --user restart flexbv-headless.service
```

### Validation

- Run `scripts/boardview A2681 C8430` and visually compare the 3/3 closeup against V2's closeup
- Component labels and pad outlines should be legible at closeup level
- File sizes should be reasonable (<500KB per image for Telegram)

### Risk

- FlexBV may not render well at 4K (it's a Windows app via Wine). If it doesn't scale its UI, the board content area might be the same pixel count with more chrome. Test with 3200x1800 first, fall back to 2560x1440 if needed.
- Memory usage increases. 4K screenshots are ~25MB uncompressed vs ~5MB at 1080p. The VPS has enough RAM but watch for swap.

### Files to modify

- `scripts/flexbv_session.sh` — Xvfb resolution
- `scripts/common.py` — `WINDOW_WIDTH`, `WINDOW_HEIGHT`, `ROW_DARK_PIXEL_THRESHOLD` (if exists here)
- `scripts/flexbv_controller.py` — viewport cache clearing, crop sizing, output resize
- `scripts/brd_parser.py` — temp Xvfb for parser also uses resolution values (line 77)
- `systemd/flexbv-headless.service` — if resolution is hardcoded there

---

## Phase 2: Full Schematic Indexing via pdftotext

### Problem

The schematic index has 49 components across 13 boards. That's <5% coverage. Most component lookups return empty `schematic_pages`.

### Root cause

The current index is built from hand-written `page_index.md` files which only list major ICs per schematic section.

### Fix

Extract component references from every page of every schematic PDF using `pdftotext`, then build a comprehensive index.

### Implementation

**Step 1 — Extract text from PDFs:**

```bash
# For each PDF, extract text per page
pdftotext -layout "schematic.pdf" - | ...
# Or per-page extraction:
pdftotext -f <page> -l <page> "schematic.pdf" -
```

`pdftotext` is installed at `/usr/bin/pdftotext` (v24.02.0). Apple schematic PDFs have searchable text layers.

**Step 2 — Regex for component references:**

Pattern: `[UCRLJDQTF]\d{3,5}[A-Z]?`

This catches:
- `U5200` (ICs)
- `C8430` (capacitors)
- `R1234` (resistors)
- `L5820` (inductors)
- `J5150` (connectors)
- `D2300` (diodes)
- `Q3200` (transistors)
- `T400` (transformers)
- `F7000` (fuses)

Edge cases:
- Some pages are block diagrams or title pages with no components — skip gracefully
- Component refs may appear in net names (e.g. a signal called `U5200_RESET`) — the regex should match the component ref portion, but we should handle duplicates
- Multi-page components: an IC like U0600 appears on many pages. That's correct — index all pages.

**Step 3 — Build the index:**

Structure:
```json
{
  "A2681": {
    "820-02536": {
      "pdf_files": ["A2681_Schematic.pdf"],
      "components": {
        "U5200": {
          "pages": [30, 31, 42],
          "images": [
            "/path/to/pages/A2681_Schematic-030.png",
            "/path/to/pages/A2681_Schematic-031.png",
            "/path/to/pages/A2681_Schematic-042.png"
          ]
        }
      }
    }
  }
}
```

**Step 4 — Merge with existing page_index.md data:**

The existing `build_schematic_index.py` already parses `page_index.md`. Extend it:
1. Run the existing `page_index.md` parser first
2. Run `pdftotext` extraction on all PDFs
3. Merge results — pdftotext data fills gaps, page_index.md provides any section/context info

**Step 5 — Handle multi-PDF boards:**

Some boards have multiple schematic PDFs:
- A2780 has `J416-C.pdf` (Max) and `J416-S.pdf` (Pro) sharing one board
- A2337 has two revisions

The index should track which PDF each page came from.

**Step 6 — Integrate into board_lookup.py:**

The current code already checks `schematic_index.json` and returns `schematic_pages` and `schematic_images`. Just need to rebuild the index with full coverage.

### Validation

- Count total indexed components per board (expect 500-2000+ per board)
- Spot-check: `U5200` on A2681 should appear on the charger schematic pages
- Spot-check: `U0600` (SoC) should appear on many pages
- Spot-check: a small passive like `C8430` should appear on the PMU page

### Files to modify/create

- `scripts/build_schematic_index.py` — add pdftotext extraction alongside existing page_index.md parser
- `data/schematic_index.json` — regenerated with full coverage

### Dependencies

- `pdftotext` (installed at `/usr/bin/pdftotext`)
- PDF files in `schematics/*/` directories
- PNG pages already rendered in `schematics/*/pages/`

---

## Phase 3: BRD Net Extraction

### Problem

Every pin returns `"net": null`. Without net data, we can't answer:
- "What does C8430 connect to?"
- "Show me all components on PPBUS_AON"
- "Trace the power path from U5200 output to U8100 input"

This is the single most valuable capability gap. Net data turns the board viewer from a location tool into a diagnostic tool.

### What we're trying to replicate

When you click a component in FlexBV on your Mac, it:
1. Highlights the component
2. Draws lines from each pin to every other component connected via the same net
3. Shows the net name
4. Lets you click a net to see ALL components on that net

We want this data without the GUI interaction. If we parse it from the BRD file, we can:
- Return net names for every pin on any component
- Render net connection overlays on board images (draw lines between connected components)
- Search by net name to find all related components
- Build complete power rail maps programmatically

### Investigation approach (time-boxed)

This is research. We don't know if the BRD format is parseable for nets until we try. Time-box each approach.

**Approach 1: fbvpdf export (30 minutes)**

`/opt/flexbv/fbvpdf` exists (39.2MB binary). It may export board data to PDF with net annotations.

```bash
# Try it on one board
/opt/flexbv/fbvpdf --help 2>&1
/opt/flexbv/fbvpdf /path/to/PJM-MLB.brd /tmp/test-output.pdf
```

If the PDF contains net annotations, we can parse them with `pdftotext` or a PDF parser. This would be the easiest path.

**Approach 2: FlexBV debug output deep-dive (30 minutes)**

The current parser uses `flexbv -d` (debug mode). Check if there are additional flags:

```bash
/opt/flexbv/flexbv --help 2>&1
/opt/flexbv/flexbv -h 2>&1
strings /opt/flexbv/flexbv | grep -i 'net\|debug\|verbose\|dump\|export'
```

Maybe there's a `-v` verbose flag, or an environment variable that enables net output in the debug dump.

**Approach 3: BRD binary reverse engineering (2-4 hours)**

If approaches 1 and 2 fail, parse the BRD file directly.

Step 1 — Find net name strings:
```bash
strings PJM-MLB.brd | grep -E 'PP[A-Z0-9_]+|GND|VCC|VBUS' | head -50
```

If Apple net names (PPBUS_AON, PP3V8_AON, etc.) are visible as plain strings, the format stores them in a parseable way.

Step 2 — Analyse structure:
```bash
xxd PJM-MLB.brd | head -100  # File header
python3 -c "
data = open('PJM-MLB.brd', 'rb').read()
# Find known net name, look at surrounding bytes for structure
idx = data.find(b'PPBUS_AON')
if idx >= 0:
    print(f'Found at offset {idx}')
    print(data[idx-32:idx+48].hex())
"
```

Step 3 — Map net names to pin/component records:

The BRD format likely has:
- A net name table (list of all net names with IDs)
- Pin records that reference net IDs
- Component records that contain pin lists

The pin records are already partially parsed (we get positions). The net ID field is probably adjacent to or within the pin data structure but not being extracted.

Step 4 — Look at OpenBoardView (open-source BRD viewer):

OpenBoardView parses many BRD formats. Its source code documents the binary structure:
- https://github.com/OpenBoardView/OpenBoardView
- Check `src/openboardview/FileFormats/` for BRD parsers
- The FlexBV BRD format may match one of these

This is the most promising research shortcut — don't reverse-engineer from scratch if someone else has already documented the format.

**Approach 4: FlexBV GUI automation for net query (1-2 hours)**

Last resort. Use xdotool to:
1. Click a component in FlexBV
2. Read the status bar text (which shows net info for selected component)
3. Parse net names from the status bar

This is fragile but could work as a per-component query mechanism. Slower than binary parsing (one FlexBV interaction per component) but doesn't require format knowledge.

### Implementation (after research identifies the viable approach)

**If BRD binary parsing works:**

Create `scripts/brd_net_parser.py`:
- Parse net name table from BRD binary
- Map net IDs to pin records
- Integrate with existing `brd_parser.py` — extend `BoardData` to include net mappings
- Bump `CACHE_VERSION`

**If fbvpdf works:**

Create `scripts/fbvpdf_net_extractor.py`:
- Run fbvpdf to generate PDF
- Parse PDF for net annotations
- Build net-to-component mapping
- Cache results per board

**Output format (regardless of approach):**

Component lookup gains populated net data:
```json
{
  "component": "C8430",
  "pins": [
    {"pin": "1", "x": 3718.0, "y": 534.0, "net": "PP3V8_AON"},
    {"pin": "2", "x": 3718.0, "y": 503.0, "net": "GND"}
  ],
  "nets": ["PP3V8_AON", "GND"]
}
```

New `--net` query mode:
```bash
scripts/boardview A2681 --net PPBUS_AON
# Returns:
{
  "status": "ok",
  "net": "PPBUS_AON",
  "components": [
    {"component": "U5200", "pins": ["1", "3"], "center": {"x": ..., "y": ...}},
    {"component": "C5201", "pins": ["1"], "center": {"x": ..., "y": ...}},
    ...
  ],
  "screenshots": {
    "overview": "/path/with/all/components/highlighted.png"
  }
}
```

### Net connection rendering

Once we have net data, we can draw connection lines on board images — similar to what FlexBV shows when you click a component:
- Highlight the target component
- Draw lines from it to every other component on the same net(s)
- Label each connected component
- This turns a static board image into a connection map

This is the visual equivalent of clicking a component in FlexBV.

### Files to create/modify

- New: `scripts/brd_net_parser.py` (or `scripts/fbvpdf_net_extractor.py`)
- Modify: `scripts/brd_parser.py` — integrate net data into `BoardData`
- Modify: `scripts/board_lookup.py` — add `--net` flag, populate `nets` in output
- Modify: `scripts/flexbv_controller.py` — add net connection line rendering
- Modify: `scripts/common.py` — bump `CACHE_VERSION`

---

## Build Order

```
Phase 1: High-res capture (quick win, immediate visual improvement)
  - Update Xvfb + FlexBV resolution
  - Update crop sizing and output resize
  - Restart service, validate closeup quality

Phase 2: Schematic indexing (quick win, fills coverage gap)
  - Add pdftotext extraction to build_schematic_index.py
  - Rebuild index
  - Validate coverage

Phase 3: Net extraction (research project, biggest value unlock)
  Step 1: Time-boxed investigation (2 hours max)
    - Try fbvpdf
    - Try FlexBV debug flags
    - Try BRD binary string search
    - Check OpenBoardView source
  Step 2: Implement the viable approach
  Step 3: Add --net query mode
  Step 4: Net connection rendering on images
```

Phases 1 and 2 are independent and can run in parallel. Phase 3 is sequential and research-dependent.

## Testing

### Phase 1 validation
- Compare V2 closeup vs V3 closeup side-by-side (same component)
- Component labels should be legible at closeup level
- File sizes under 500KB per image
- All 7 smoke test components pass

### Phase 2 validation
- Total indexed components per board (expect 500+)
- Spot-check 5 components across 3 boards against known schematic pages
- No duplicate page entries for same component

### Phase 3 validation
- At least one board (A2681) has full net data for all parsed components
- `C8430` returns net names that match the schematic (verify against PDF)
- `--net PPBUS_AON` returns multiple components
- Net connection rendering produces a readable image

## Environment Notes

- **Xvfb current resolution:** 1920x1080x24
- **FlexBV window:** 1600x900
- **pdftotext:** `/usr/bin/pdftotext` v24.02.0
- **fbvpdf:** `/opt/flexbv/fbvpdf` (39.2MB, untested)
- **OpenBoardView source:** https://github.com/OpenBoardView/OpenBoardView
- **VPS RAM:** sufficient for 4K framebuffer
- **Schematic PDFs:** 20 files, 2,501 pages total
- **Schematic PNGs:** pre-rendered at 300 DPI in `pages/` subdirectories

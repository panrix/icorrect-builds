# Board Reference — Codename & Chip Mapping

**Purpose:** Codex uses this to populate `board_index.json` with correct chip, codename, and default revision data.

**Source:** VPS-verified scan of `/home/ricky/builds/elek-board-viewer/schematics/`

## Correction from QA-of-QA

The earlier QA report claimed A2681 had two revisions (820-02536 and 820-02862). **This was wrong.** A2681 has one revision only. There are 17 board directories, not 18.

## Complete Board Inventory

### Single-Revision Models (11 boards)

| Folder | Board # | Codename | .brd File | Chip | Notes |
|--------|---------|----------|-----------|------|-------|
| A2179 820-01958 | 820-01958 | — | 820-01958.brd | Intel | MacBook Air 13" 2020 |
| A2251 820-01949-A | 820-01949-A | — | 820-01949-A.brd | Intel | MacBook Pro 13" 2020 (4-port) |
| A2289 820-01987 | 820-01987 | — | 820-01987.brd | Intel | MacBook Pro 13" 2020 (2-port) |
| A2337 820-02016 | 820-02016 | — | 820-02016.brd | M1 | MacBook Air 13" M1 |
| A2338 820-02020 | 820-02020 | — | 820-02020.brd | M1 | MacBook Pro 13" M1 |
| A2681 820-02536 | 820-02536 | PJM-MLB | PJM-MLB.brd | M2 | MacBook Air 13" M2 |
| A2780 820-02652 | 820-02652 | J416 | J416.brd | M3 Pro/Max | MacBook Pro 16" M3 (shared board) |
| A2918 820-02757 | 820-02757 | — | 820-02757.brd | M3 | MacBook Air 15" M3 |
| A3113 820-03286 | 820-03286 | — | 820-03286.brd | M4 | MacBook Pro 14" M4 (base) |
| A3114 820-03285 | 820-03285 | — | 820-03285.brd | M4 Pro | MacBook Pro 14" M4 Pro |

**A2780 note:** Single .brd (J416) but TWO PDF schematics: `J416-C.pdf` (Max) and `J416-S.pdf` (Pro). The board layout is shared — only the SoC differs. Both PDFs should be indexed.

### Multi-Revision Models (3 models, 7 boards)

#### A2338 — MacBook Pro 13" (M1 / M2)

| Folder | Board # | Codename | Chip | Default |
|--------|---------|----------|------|---------|
| A2338 820-02020 | 820-02020 | — | M1 | |
| A2338 M2 820-02773 | 820-02773 | — | M2 | **Yes** (Ricky annotated) |

Different generations, not Pro/Max. Ricky already tagged the M2 folder.

#### A2442 — MacBook Pro 14" 2021 (M1 Pro / M1 Max)

| Folder | Board # | Codename | Chip | Default |
|--------|---------|----------|------|---------|
| A2442 820-02098 | 820-02098 | J314-BTR | M1 Pro | **Yes** (more common) |
| A2442 820-02443 | 820-02443 | J314-CTO | M1 Max | |

- **BTR** = Base Tier = M1 Pro
- **CTO** = Configure To Order = M1 Max
- CTO board is 10% larger (1,079,775 vs 977,582 bytes) — extra Max SoC routing

#### A2485 — MacBook Pro 16" 2021 (M1 Pro / M1 Max)

| Folder | Board # | Codename | Chip | Default |
|--------|---------|----------|------|---------|
| A2485 820-02100 | 820-02100 | J316-EVTs | M1 Pro | **Yes** (more common) |
| A2485 820-02382 | 820-02382 | J316-EVTc | M1 Max | |

- **EVTs** = EVT Standard = M1 Pro
- **EVTc** = EVT Custom = M1 Max
- Same pattern: custom/CTO = Max

#### A2779 — MacBook Pro 14" 2023 (M3 Pro / M3 Max)

| Folder | Board # | Codename | Chip | Default |
|--------|---------|----------|------|---------|
| A2779 820-02841 | 820-02841 | J414-S | M3 Pro | **Yes** (more common) |
| A2779 820-02655 | 820-02655 | J414-C | M3 Max | |

- **S** = Standard = M3 Pro
- **C** = Custom = M3 Max

## Codename Suffix Convention

Apple uses a consistent pattern across all multi-board models:

| Suffix | Meaning | Chip |
|--------|---------|------|
| BTR / s / S | Base Tier / Standard | Pro |
| CTO / c / C | Configure To Order / Custom | Max |

**Rule for `build_board_index.py`:** If a .brd codename ends in `-BTR`, `-S`, `-EVTs` → tag as Pro. If `-CTO`, `-C`, `-EVTc` → tag as Max. Boards without codename suffixes (820-XXXXX format) are single-chip models.

## Default Revision Strategy

For multi-revision models, default to the **Pro / standard / base** variant:
- It's the higher-volume board (more units sold = more repairs)
- Techs encounter it more often
- Elek can still target Max with explicit revision syntax

Exception: A2338 defaults to M2 (820-02773) per Ricky's annotation — the M1 version is legacy.

## Aliases for board_index.json

Each board should be findable by:
1. Model number: `A2442`
2. Board number: `820-02098`
3. Codename (if it has one): `J314-BTR`, `PJM-MLB`, `J416`

Alias collisions between models are hard failures. Collisions between revisions of the same model are expected and resolve to the default revision.

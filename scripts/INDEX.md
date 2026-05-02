# scripts

**State:** dormant (last activity: 2026-03-28)
**Owner:** operations
**Purpose:** Loose utility script bundle — Monday flow tracing, BM price history loader, and a PDF-to-images helper. Not a service, not a build target; a small toolkit.
**Last updated:** 2026-05-02

## Current state

Dormant. Last meaningful change: 2026-03-28 (`pdf-to-images.sh` created). The Python scripts (Monday flow traces, BM price history) date 2026-03-27.

**Phase 7c review candidate:** assess whether these scripts belong here, in `~/builds/backmarket/scripts/` (BM price history), in `~/builds/operations-system/` (Monday flow traces), or as one-off helpers in a fleet utilities folder. Note: `bm-price-history-load.py` may overlap with BM-domain tooling.

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.
- `scripts/` — three utility scripts (project-specific subdir, classified as code per rubric).

## Key documents

- [`scripts/bm-price-history-load.py`](scripts/bm-price-history-load.py) — pulls sold items from Monday BM board, enriches with BM API sale prices, normalizes canonical spec keys, inserts into Supabase.
- [`scripts/monday-repair-flow-traces.py`](scripts/monday-repair-flow-traces.py) — pulls completed items from Monday main board, categorises by flow type, fetches activity logs for status changes, writes structured output.
- [`scripts/pdf-to-images.sh`](scripts/pdf-to-images.sh) — converts PDF pages to PNG images for agent viewing (uses pdftoppm).

## Open questions

- Does this folder still earn its keep, or should the three scripts move to their domain owners (BM script → `backmarket/`, Monday script → `operations-system/`, PDF helper → fleet utilities)?

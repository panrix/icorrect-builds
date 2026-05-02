# backmarket-seller-support

**State:** active
**Owner:** backmarket
**Purpose:** Read-only extracted snapshot of the Back Market Seller Support Center knowledge base, including discovery notes, raw article JSON, and a content catalog. Used as a reference snapshot of BM's seller-facing docs.
**Last updated:** 2026-05-02 UTC (Phase 7a folder-standard rollout)

## Current state

### In flight
- Snapshot freshness: last extract 2026-04-30. Idea `8728b392` (re-run weekly + diff `lastPublishedDate`) is captured in idea-inventory.

### Recently shipped
- 2026-04-30: discovery + raw articles + content catalog extract committed

### Next up
- Idea `5f7c0ac3`: build the recommended read-only extraction skill for the Seller Support Center
- Idea `8728b392`: re-run the extract weekly and diff `lastPublishedDate`

## Structure

- `briefs/` — empty (gitkeep)
- `decisions/` — empty (gitkeep)
- `docs/` — `discovery.md` (extraction discovery notes)
- `archive/` — empty (gitkeep)
- `scratch/` — empty (gitkeep)
- `articles/` — extracted seller-support articles (kept as-is — large set)
- `data/` — `api-inventory.json`, `bm-ssc-raw-articles.json`, `content-catalog.json` (moved from root in Phase 7a — runtime data per rubric)

## Key documents

- [`docs/discovery.md`](docs/discovery.md) — extraction discovery notes (moved from root; referenced in idea-inventory lines 234, 237)
- [`data/api-inventory.json`](data/api-inventory.json) — moved from root (runtime data)
- [`data/bm-ssc-raw-articles.json`](data/bm-ssc-raw-articles.json) — moved from root (1.9 MB raw extract)
- [`data/content-catalog.json`](data/content-catalog.json) — moved from root (content catalog)

## Inbound references (paths changed)

- `~/builds/agent-rebuild/idea-inventory.md` lines 234, 237 reference `discovery.md` — now at `docs/discovery.md`

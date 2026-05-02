# icloud-checker

**State:** active
**Owner:** backmarket
**Purpose:** Live Express webhook service for Back Market trade-in intake. Checks iCloud lock + Apple specs from a serial; runs counter-offers and grade checks on incoming BM trade-ins. Service binds port 8010.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- AUDIT-AND-DECOMPOSITION proposes splitting the 8010 monolith into separate services (extracted shared libs in `lib/`, separate routes). See `docs/audits/AUDIT-AND-DECOMPOSITION.md`.

### Recently shipped
- `src/index.js` (May 2) and `src/apple-specs.js` (Apr 23) are the live versions. Older root copies (now in `archive/2026-05-02-superseded-by-src/`) were superseded.
- `batch-spec-check.js` utility (Apr 27) moved to `scripts/`.

### Next up
- Confirm which Monday webhooks and Slack interactivity URLs are wired to live 8010 endpoints (idea inventory P-unranked).
- Decompose 8010 monolith into discrete services (idea inventory P2, partial-built).

## Structure

- `briefs/` — original BRIEF.md (intake brief).
- `decisions/` — empty; backfill in Phase 7c if useful.
- `docs/` — SOP for BM trade-in checks; `audits/` holds the AUDIT-AND-DECOMPOSITION + BACKMARKET-FULL-AUDIT reports; `assets/` holds debug.png.
- `archive/` — `2026-05-02-superseded-by-src/` holds the older root `apple-specs.js` and `index.js` that were replaced by `src/` versions (per the systemd unit which ExecStarts `src/index.js`).
- `scratch/` — TODO notes (APPLE-SPECS-TODO, SLACK-SETUP-TODO).
- `src/` — live service code (entrypoint `src/index.js`).
- `lib/` — shared helpers (bm-listings-cache, colour-map, counter-offer, grade-map, profitability).
- `scripts/` — `batch-spec-check.js` utility.
- `data/` — runtime state JSONs (recheck-state, serial-check-state, specs-cache, BM listings caches, counter-offer-log).

## Key documents

- [briefs/BRIEF.md](briefs/BRIEF.md) — original intake brief.
- [docs/SOP-BM-TRADEIN-CHECK.md](docs/SOP-BM-TRADEIN-CHECK.md) — operating procedure for BM trade-in checks.
- [docs/audits/AUDIT-AND-DECOMPOSITION.md](docs/audits/AUDIT-AND-DECOMPOSITION.md) — split-into-services proposal.
- [docs/audits/BACKMARKET-FULL-AUDIT.md](docs/audits/BACKMARKET-FULL-AUDIT.md) — BM-side audit.
- README.md (root) — operational entry (deploy / restart / health).

## Open questions

- Plaintext credential / basic-auth material flagged in folder-inventory security row — needs Phase 7c rotation pass.
- Decomposition of the 8010 monolith — not yet sequenced.

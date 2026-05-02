# quote-wizard

**State:** dormant (last activity: 2026-03-18)
**Owner:** arlo-website
**Purpose:** Node script + generated JSON for rebuilding Shopify quote-wizard navigation menus from collection data. Groups iPad / iPhone / MacBook / Watch model collections into nested wizard menus.
**Last updated:** 2026-05-02 (Phase 7a folder-standard rollout)

## Current state

Dormant since 2026-03-18. Reason for dormancy: unknown — likely superseded by quote-wizard work in `icorrect-shopify-theme/briefs/quote-wizard-architecture-v2.md` and related plans. Needs review.

**Phase 7c review candidate:** assess whether this menu-rebuild script is still needed or whether the v2 quote-wizard in `icorrect-shopify-theme` replaces it. If still useful, fold into `icorrect-shopify-theme/scripts/`.

## Structure

- `briefs/` — empty
- `decisions/` — empty
- `docs/` — empty
- `archive/` — empty
- `scratch/` — empty
- `scripts/` — `rebuild-wizard-menus.js` (the menu rebuild Node script)
- `data/` — generated wizard JSON (`wizard-{ipad,iphone,macbook,watch}-models.json`)
- `node_modules/` — Node deps (left as-is, gitignore-territory)

## Key documents

- [`README.md`](README.md) — operational README for the script
- [`scripts/rebuild-wizard-menus.js`](scripts/rebuild-wizard-menus.js) — menu rebuild script (uses `dotenv`)
- `data/wizard-ipad-models.json`, `data/wizard-iphone-models.json`, `data/wizard-macbook-models.json`, `data/wizard-watch-models.json` — generated model groupings
- `package.json` / `package-lock.json` — Node manifest (kept at root)

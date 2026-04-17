# BackMarket Operations

BackMarket is iCorrect's largest revenue channel (~60% of total, ~£31k/mo). This directory contains all automation scripts, SOPs, analysis tools, and documentation for the BM trade-in and sell-side operations.

## Directory Structure

```
backmarket/
├── CHANGELOG.md    # Deploy record for the rebuild (Phase 0 onwards)
├── sops/           # Standard Operating Procedures (SOPs 01-12) — SOURCE OF TRUTH
├── scripts/        # Node.js automation scripts + lib/
│   └── lib/        # Shared modules (monday.js, bm-api.js, logger.js, profitability.js, slack.js, dates.js, v7-scraper.js, resolver-truth.js)
├── services/       # Deployed webhook services (bm-grade-check, bm-payout, bm-shipping)
├── data/           # Generated data (catalog, registry, lookups, reports, labels)
├── docs/           # Active: rebuild plan + rollback log. /historical/ holds dated archives (audits, analysis scripts, QA, staged plans, legacy scripts, reconciliation snapshots)
├── knowledge/      # Product ID mappings, BM knowledge docs
└── pricing/        # Pricing module (parked — reference docs only)
```

**Current rebuild plan:** `docs/PLAN-BM-REBUILD-2026-04-17.md` (v5, APPROVED FOR EXECUTION)
**Workspace cleaned 2026-04-17:** `/audit/`, `/analysis/`, `/qa/`, and `/docs/staged/` moved into `/docs/historical/` subdirectories by category + date. 6 legacy scripts archived. Stale caches and CSV exports deleted. See CHANGELOG.md for details.

## SOPs — Start Here

The SOPs are the single source of truth. Each SOP has been QA'd against its script/service.

| SOP | File | Script/Service | Status |
|-----|------|---------------|--------|
| 01 | `sops/01-trade-in-purchase.md` | `scripts/sent-orders.js` | QA'd |
| 02 | `sops/02-intake-receiving.md` | `icloud-checker` service (8010) | QA'd |
| 03 | `sops/03-diagnostic.md` | `bm-grade-check` service (8011) | QA'd |
| 03b | `sops/03b-trade-in-payout.md` | `bm-payout` service (8012) | QA'd |
| 04 | `sops/04-repair-refurb.md` | Manual process | QA'd |
| 06 | `sops/06-listing.md` | `scripts/list-device.js` | QA'd v2.1 |
| 06.5 | `sops/06.5-listings-reconciliation.md` | `scripts/reconcile-listings.js` | QA'd (on-demand; no live cron) |
| 07 | `sops/07-buy-box-management.md` | `scripts/buy-box-check.js` | QA'd (on-demand; no live cron) |
| 08 | `sops/08-sale-detection.md` | `scripts/sale-detection.js` | QA'd + live cron |
| 09 | `sops/09-shipping.md` | `dispatch.js` | QA'd + weekday dispatch cron |
| 09.5 | `sops/09.5-shipment-confirmation.md` | `bm-shipping` (8013) | QA'd + webhook-driven |
| 10 | `sops/10-payment-reconciliation.md` | Manual process | QA'd |
| 11 | `sops/11-tuesday-cutoff.md` | Not built | QA'd |
| 12 | `sops/12-returns-aftercare.md` | Manual + counter-offer buttons | QA'd |

## Key Data Files

| File | Purpose |
|------|---------|
| `data/bm-catalog.json` | Canonical product catalog (309 variants, single product resolver) |
| `data/listings-registry.json` | 261 verified listing slots (SKU → listing_id) |
| `data/product-id-lookup.json` | Historical product_id lookup (279 entries) |
| `data/order-history-product-ids.json` | BM order history (234 entries) |
| `data/listings-colour-map.json` | Colour extracted from listing SKUs (157 entries) |

## Scripts

All scripts are at `backmarket/scripts/`. Shared library at `scripts/lib/`.

| Script | SOP | Usage |
|--------|-----|-------|
| `list-device.js` | 06 | `node scripts/list-device.js --dry-run --item <id>` |
| `buy-box-check.js` | 07 | `node scripts/buy-box-check.js --auto-bump` |
| `reconcile-listings.js` | 06.5 | `node scripts/reconcile-listings.js` |
| `sent-orders.js` | 01 | `node scripts/sent-orders.js --live` |
| `sale-detection.js` | 08 | `node scripts/sale-detection.js --dry-run` |
| `build-listings-registry.js` | — | `node scripts/build-listings-registry.js --dry-run` |

## Services (Live on VPS)

| Service | Port | Route | SOP |
|---------|------|-------|-----|
| icloud-checker | 8010 | `/webhook/icloud-check` | 02 |
| bm-grade-check | 8011 | `/webhook/bm/grade-check` | 03 |
| bm-payout | 8012 | `/webhook/bm/payout` | 03b |
| bm-shipping | 8013 | `/webhook/bm/shipping-confirmed` | 09.5 |

All services behind nginx at `mc.icorrect.co.uk`. Port 8010 not exposed publicly.

## Environment

All scripts/services load env from `/home/ricky/config/.env` or `/home/ricky/config/api-keys/.env`.

| Variable | Used By |
|----------|---------|
| `BACKMARKET_API_AUTH` / `BM_AUTH` | BM API calls |
| `MONDAY_APP_TOKEN` | Monday.com GraphQL |
| `TELEGRAM_BOT_TOKEN` | Telegram alerts |
| `BM_TELEGRAM_CHAT` | BM Telegram group ID |

## V7 Scraper

Weekly price scraper at `buyback-monitor/sell_price_scraper_v7.js`. Runs Monday 05:00 UTC via `run-weekly.sh`. Extracts grade prices, picker data, and product_ids from BM product pages.

## Boards

| Board | ID |
|-------|----|
| Main Board | 349212843 |
| BM Devices Board | 3892194968 |

Column reference: `docs/VERIFIED-COLUMN-REFERENCE.md`

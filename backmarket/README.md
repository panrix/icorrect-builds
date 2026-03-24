# BackMarket Operations

BackMarket is iCorrect's largest revenue channel (~60% of total, ~£31k/mo). This directory contains all automation scripts, SOPs, analysis tools, and documentation for the BM trade-in and sell-side operations.

## Directory Structure

```
backmarket/
├── sops/           # Standard Operating Procedures (12 SOPs)
├── scripts/        # Standalone Node.js automation scripts
├── analysis/       # Python analysis & pricing scripts
├── scraper/        # Price scraper tools
├── docs/           # Strategy docs, column reference
├── qa/             # QA issues, task trackers
├── knowledge/      # Product ID mappings
├── pricing/        # Pricing module (parked)
├── audit/          # Historical audit reports (markdown)
└── data/           # Generated outputs — gitignored
    ├── cache/      # JSON data caches
    ├── reports/    # Generated markdown reports
    ├── logs/       # Execution logs
    └── exports/    # CSV exports from BM/Monday
```

## Script → SOP Mapping

### Node.js Automation Scripts (`scripts/`)

| Script | SOP | What It Does | Trigger | Status |
|--------|-----|-------------|---------|--------|
| `sent-orders.js` | 01 | Creates Monday items for new BM trade-in orders | Manual/cron | QA: product name extraction broken |
| — | 02 | Intake/iCloud check | Webhook | Lives in `icloud-checker/` monolith |
| — | 03 | Diagnostic/grade check | Webhook | Lives in `icloud-checker/` monolith |
| `trade-in-payout.js` | 03b | Validates and pays out trade-ins via BM API | Manual/cron | QA: working |
| `list-device.js` | 06 | Lists devices on BM (qty bump or reactivation) | Manual/cron | QA: 7 bugs (see qa/TASK-QA-LIST-DEVICE.md) |
| `reconcile-listings.js` | 06.5 | Cross-checks BM listings vs Monday board | Manual/cron | QA: needs review |
| `buy-box-check.js` | 07 | Monitors buy box position, auto-bumps price | Manual/cron | QA: working |
| `sale-detection.js` | 08 | Detects new BM sales, updates Monday | Manual/cron | QA: working |
| `shipping.js` | 09 | Confirms shipping with tracking to BM | Manual/cron | QA: processes full backlog (needs date filter) |
| `buyback-profitability-builder.js` | — | Builds profitability data from Monday + BM | Manual | Supporting tool |
| `listings-audit.js` | — | Read-only audit of BM listings | Manual | Analysis only |

**Note:** Scripts import `./lib/monday`, `./lib/bm-api`, `./lib/logger` which **do not exist yet**. API calls are inlined — scripts work standalone but have duplicated code. Building the shared lib is a separate project.

### Python Analysis Scripts (`analysis/`)

| Script | Category | What It Does | Touches Live API? |
|--------|----------|-------------|-------------------|
| `bm_utils.py` | Shared | Utility module (Monday API, BM API, env loading) | Read only |
| `bm-repair-analysis.py` | Data collection | Master data aggregation (BM API + Monday) | Read only |
| `bm-crossref.py` | Analysis | Financial cross-reference (715 orders) | Read only |
| `bm-listing-optimizer.py` | Decision engine | Classifies listings as KEEP/REPRICE/DELIST | Read only |
| `bm-reprice.py` | **LIVE** | **Pushes price changes to BM API** | **YES — writes** |
| `bm-bid-bump.py` | **LIVE** | **Adjusts prices to win buy box** | **YES — writes** |
| `bm-buybox-audit.py` | Analysis | Buy box performance per SKU | Read only |
| `bm-sku-audit.py` | Analysis | SKU performance breakdown | Read only |
| `bm-reconcile.py` | Analysis | Gap analysis (orders missing from Monday) | Read only |
| `bm-returns-forensic.py` | Forensic | Return order analysis | Read only |
| `bm-saf-diagnostics.py` | Forensic | Spec mismatch diagnostics | Read only |
| `bm-pricing-report.py` | Reporting | Markdown summary from decisions | Read only |
| `bm-profit-by-shipdate.py` | Reporting | Net profit by ship date | Read only |
| `bm-profit-by-solddate.py` | Reporting | Net profit by sold date | Read only |
| `bm-full-chain.py` | Analysis | Trade-in → Repair → Sale → Profit chain | Read only |
| `bm-nfu-analysis.py` | Analysis | Devices we shouldn't bid on | Read only |
| `bm-post-reprice-audit.py` | Verification | Validates reprice results | Read only |
| `bm-reconcile-check.py` | Debugging | Deep-dive into specific missing BM IDs | Read only |
| `bm-reconcile-detail.py` | Debugging | Status of stuck orders | Read only |

### Analysis Run Order

When running a full pricing review cycle:

1. `bm-repair-analysis.py` — collect latest data from BM API + Monday
2. `bm-crossref.py` — cross-reference financials
3. `bm-listing-optimizer.py` — make KEEP/REPRICE/DELIST decisions
4. `bm-pricing-report.py` — generate human-readable report
5. `bm-reprice.py --dry-run` — preview price changes
6. `bm-reprice.py --execute` — apply to BM API (after review)
7. `bm-bid-bump.py` — recover lost buy boxes

## The Monolith (`icloud-checker/`)

The Express server at `icloud-checker/src/index.js` (1914 lines) handles:

- **SOP 02**: iCloud lock checking (intake webhook)
- **SOP 02**: Counter-offer flow (Slack interactions)
- **SOP 03**: Grade check / profitability alert
- **SOP 03b**: Payout processing (duplicate of `trade-in-payout.js`)
- **SOP 09**: Shipping confirmation (duplicate of `shipping.js`)
- **SOP 06**: Listing automation (DISABLED — returns 410)

Runs as systemd service on port 8010. See `icloud-checker/AUDIT-AND-DECOMPOSITION.md` for full breakdown and decomposition plan.

## Environment Variables

All scripts read from `/home/ricky/config/.env`:

| Variable | Used By |
|----------|---------|
| `BM_AUTH` / `BACKMARKET_API_AUTH` | BM API calls |
| `MONDAY_APP_TOKEN` | Monday.com GraphQL |
| `SLACK_BOT_TOKEN` | Slack messaging |
| `SLACK_AUTOMATIONS_BOT_TOKEN` | Slack automations |
| `SICKW_API_KEY` | iCloud checking |
| `TELEGRAM_BOT_TOKEN` | Telegram alerts |

## Monday Boards

| Board | ID | Used By |
|-------|-----|---------|
| Main Board | 349212843 | All scripts |
| BM Devices Board | 3892194968 | All scripts |

Column reference: `docs/VERIFIED-COLUMN-REFERENCE.md`

## Known Bugs

See `qa/QA-ISSUES.md` for current list. Key issues:
- `sent-orders.js`: product name/price showing "Unknown" / "£?"
- `shipping.js`: processes entire historical backlog (needs date filter)
- `list-device.js`: 7 open bugs (wrong parts cost column, safety gate bypass, etc.)

## What's Next

1. **Monolith decomposition** — extract payout, shipping, grade-check into standalone services
2. **Shared lib modules** — build `lib/monday.js`, `lib/bm-api.js`, `lib/logger.js`
3. **Deploy standalone scripts** — systemd units for scripts replacing monolith endpoints
4. **Security** — bind port 8010 to localhost, add webhook auth

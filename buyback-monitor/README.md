# Buy Box Monitor

Automated buy box monitoring and price management for BackMarket buyback listings. Scans all live listings, checks competitor positions via API, calculates profit at current and win prices, generates actionable reports, and optionally auto-bumps losing listings that are profitable to win.

## What It Does

- Fetches all online GB buyback listings from BackMarket's API
- Checks the competitor/buy box endpoint for each listing
- Identifies whether we're winning or losing the buy box
- Calculates profit at current price AND at the price needed to win
- Detects overbidding on winning listings (where we're paying more than needed)
- Generates a markdown summary with BUMP / CONSIDER / LEAVE recommendations
- Auto-bumps losing listings where winning is profitable (opt-in)

## How It Works

```
1. Load historical sell prices     (local JSON, no API call)
2. Fetch all buyback listings      (GET /ws/buyback/v1/listings, paginated)
3. Filter to online GB listings    (must have GB market + price > 0)
4. Check competitors per listing   (GET /ws/buyback/v1/competitors/{id}, 2s delay)
5. Calculate profit at current     (using profit model below)
   and at price-to-win
6. Save full JSON results          (data/buyback/buy-box-YYYY-MM-DD.json)
7. Generate markdown summary       (data/buyback/buy-box-YYYY-MM-DD-summary.md)
8. Auto-bump losing listings       (PUT /ws/buyback/v1/listings/{id}, if --auto-bump)
9. Save bump log                   (data/buyback/bumps-YYYY-MM-DD.json)
```

Progress is saved every 100 listings to `buy-box-progress.json`. If interrupted, the next run resumes automatically. Use `--no-resume` to start fresh.

## Profit Model

```
Profit = Sale - Buy - BM Buy Fee - BM Sell Fee - Parts - Labour - Shipping - Tax

Where:
  BM Buy Fee   = Buy Price × 10%
  BM Sell Fee  = Sell Price × 10%
  Labour       = 2.6 hrs × £25/hr = £65
  Shipping     = £15 flat
  Tax          = 16.67% of gross profit (Sale - Buy), if positive
```

### Parts Costs by Grade

| Grade | Code | Parts Cost | What's Needed |
|-------|------|-----------|---------------|
| Functional Cracked | FUNC_CRACK | £120 | Screen replacement |
| Non-Functional Used | NONFUNC_USED | £50 | Board work, no screen |
| Non-Functional Cracked | NONFUNC_CRACK | £170 | Screen + board work |
| Other/Unknown | - | £100 | Default estimate |

Sell prices are looked up from a local `profit-summary.json` file (historical averages by model). Falls back to £500 if unavailable.

## CLI Usage

```bash
# Full scan of all listings
python3 buy_box_monitor.py

# Quick test: random sample of 100 listings
python3 buy_box_monitor.py --quick

# Filter to a specific model family
python3 buy_box_monitor.py --model MBP14

# Full scan with auto-bump enabled
python3 buy_box_monitor.py --auto-bump

# Auto-bump with custom thresholds
python3 buy_box_monitor.py --auto-bump --bump-min-profit 50 --bump-max-gap 80

# Preview what would be bumped (no changes made)
python3 buy_box_monitor.py --auto-bump --dry-run

# Fresh start (ignore saved progress)
python3 buy_box_monitor.py --no-resume
```

### CLI Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--quick` | off | Check random sample of 100 listings only |
| `--model MODEL` | all | Filter to a specific model family (e.g. MBA13, MBP14, MBP16) |
| `--no-resume` | off | Don't resume from progress file; start fresh |
| `--auto-bump` | off | Auto-bump losing listings that are profitable to win |
| `--bump-min-profit` | £30 | Minimum profit at win price required to auto-bump |
| `--bump-max-gap` | £100 | Maximum price gap to bump (safety cap) |
| `--dry-run` | off | Show what would be bumped without making any API changes |

## Auto-Bump Logic

When `--auto-bump` is enabled, the script automatically raises prices on losing listings to win the buy box.

### Eligibility Criteria

A listing is bumped only if ALL conditions are met:

1. **Losing the buy box** (not currently winning)
2. **Profit >= £30** at the price needed to win (configurable via `--bump-min-profit`)
3. **Gap <= £100** between current price and win price (configurable via `--bump-max-gap`)
4. **Known model family** (SKU must map to a recognised model like MBA13, MBP14, etc.)

### Execution

- New price is set to `price_to_win + £1` buffer (ensures we're just above the threshold)
- Candidates are sorted by profit descending (most profitable bumps go first)
- 1 second rate limit between API updates
- Each price update retries up to 3 times on 429 (rate limit) responses

## Safety Controls

| Control | Detail |
|---------|--------|
| Profit floor | Only bumps if profit >= £30 at win price (configurable) |
| Max gap cap | Won't bump if gap exceeds £100 (configurable safety ceiling) |
| Model validation | Skips listings with UNKNOWN model family |
| Consecutive failure abort | Stops all bumps after 5 consecutive API failures |
| Rate limiting | 1s delay between price update API calls |
| 429 retry with backoff | Respects Retry-After headers; backs off 30s/60s/90s |
| Dry run mode | `--dry-run` shows all planned changes without executing |
| Progress persistence | Saves every 100 listings; safe to interrupt and resume |
| Bump logging | Every bump (success and failure) is logged to `bumps-YYYY-MM-DD.json` |

## Output Files

All output goes to `~/.openclaw/agents/main/workspace/data/buyback/`:

| File | Contents |
|------|----------|
| `buy-box-YYYY-MM-DD.json` | Full results: every listing with prices, profit, win/loss status |
| `buy-box-YYYY-MM-DD-summary.md` | Markdown report with losing listings, overbid analysis, action summary |
| `buy-box-YYYY-MM-DD-quick.json` | Quick mode results (100 sample) |
| `buy-box-YYYY-MM-DD-quick-summary.md` | Quick mode summary |
| `bumps-YYYY-MM-DD.json` | Bump log: every price change attempted, old/new price, success/failure |
| `buy-box-progress.json` | Resume checkpoint (deleted on completion) |

### Report Sections

The markdown summary includes:

- **Overview**: total listings, win/loss count and percentage
- **Comparison**: delta vs previous run (if available)
- **Losing listings**: grouped by model family, sorted by gap, with profit and recommendation
- **Action summary**: counts of BUMP (£30+), CONSIDER (£0-30), LEAVE (unprofitable)
- **Overbid analysis**: winning listings paying more than necessary, with reduction recommendations

### Recommendation Key

- 🟢 **BUMP**: Profit >= £30 if we win. Raise price.
- 🟡 **CONSIDER**: Marginal profit (£0-30). Evaluate individually.
- 🔴 **LEAVE**: Unprofitable even at win price. Don't chase.

## Daily Cron

Runs at 05:00 UTC via OpenClaw cron with auto-bump enabled:

```
Schedule: 0 5 * * * (daily at 05:00 UTC)
Command:  python3 /home/ricky/builds/buyback-monitor/buy_box_monitor.py --auto-bump
```

After completion, the cron sends a Telegram summary to the BackMarket agent group.

## API Endpoints Used

All requests go to `https://www.backmarket.co.uk` with Basic auth.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/ws/buyback/v1/listings?page_size=100` | Fetch all buyback listings (paginated) |
| GET | `/ws/buyback/v1/competitors/{listing_id}` | Get competitor prices and buy box status |
| PUT | `/ws/buyback/v1/listings/{listing_id}` | Update listing price (auto-bump) |

Rate limiting: 2s delay between competitor checks. 1s delay between price updates. Retries with exponential backoff on 429 responses (respects Retry-After header).

## Dependencies

- Python 3.8+
- `requests` (HTTP client)

No other external dependencies.

## SKU Model Mapping

The script maps BackMarket SKU prefixes to Apple model numbers for profit lookups:

| SKU Prefix | Apple Model |
|-----------|-------------|
| MBA13.2020.M1 | A2337 |
| MBA13.2022.M2 / MBA13.2024.M3 | A2681 |
| MBA15.2023.M2 | A2941 |
| MBP13.2020.M1 / MBP13.2022.M2 | A2338 |
| MBP14.2021.M1PRO/MAX | A2442 |
| MBP14.2023.M2PRO/MAX / M3/PRO/MAX | A2779 / A2992 |
| MBP14.2024.M4/PRO/MAX | A2918 |
| MBP16.2021.M1PRO/MAX | A2485 |
| MBP16.2023.M3PRO | A2780 |
| MBP16.2023.M3MAX | A2991 |
| MBP16.2024.M4PRO | A2780 |
| MBP16.2024.M4MAX | A2991 |

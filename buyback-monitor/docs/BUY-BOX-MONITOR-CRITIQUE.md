# Buy Box Monitor: Critique and Proposed Changes

**Date:** 2026-03-19
**Author:** Jarvis
**File:** `/home/ricky/builds/buyback-monitor/buy_box_monitor.py` (955 lines)

## What It Does

Runs daily at 05:00 UTC. Fetches all ~2,600 buyback listings from BM API, checks competitor pricing via the BackBox endpoint for each, calculates profitability, identifies buy box wins/losses, and auto-bumps losing listings where it's profitable to do so. Posts summary to Ricky's Telegram DMs.

## What It Does Well

- **Solid pipeline:** fetch → check competitors → calculate → bump → report
- **Rate limit handling:** retries with backoff on 429, respects Retry-After header
- **Resume on crash:** progress file saves every 100 listings so a crash at listing 2,000 doesn't restart from zero
- **Auto-bump safety:** min profit threshold (£30), max bump cap (£100), consecutive failure abort (5)
- **Day-over-day comparison:** loads previous run to show delta in win rate, bumps, etc.
- **Model family extraction:** parses SKUs into readable labels for reporting

## Problems Found

### CRITICAL: Profit Formula is Wrong

```python
def calc_profit(buy_price, sell_price, parts_cost, labour_hrs=2.6):
    bm_buy_fee = buy_price * 0.10      # ← WRONG: BM doesn't charge 10% on purchase
    bm_sell_fee = sell_price * 0.10
    labour = labour_hrs * 25            # ← WRONG: should be £24/hr
    shipping = 15
    gross = sell_price - buy_price
    tax = gross * 0.1667 if gross > 0 else 0
    return sell_price - buy_price - bm_buy_fee - bm_sell_fee - parts_cost - labour - shipping - tax
```

**~~Issue 1: Double BM fee.~~** CORRECTION: BM DOES charge 10% on both the trade-in purchase AND the resale. The original formula is correct on this point. Both fees stay.

**Issue 2: Labour rate £25/hr.** Ricky confirmed £24/hr on Mar 15. Small but compounds.

**Issue 3: Default 2.6 hours labour.** No basis for this number. Different grades need different labour: FC ~2hrs, NFU ~4hrs.

### CRITICAL: Sell Price Fallback

```python
DEFAULT_SELL_PRICE = 500
```

When the scraper fails (dead for 4 days), most listings fall back to this £500 default. The auto-bumper then makes bump/no-bump decisions using fictional sell prices. A £500 default on a device that actually sells for £350 makes it look profitable when it isn't. A £500 default on a device that sells for £1,200 makes it look unprofitable when it is.

The scraper uses the old Massive/ClawPod Python scraper which has a 63% failure rate and has produced zero data since Mar 15. The V6 stealth Playwright scraper (built Mar 18) works at 100% success rate, no external service, ~2 min runtime.

### HIGH: Hardcoded BM API Credentials

```python
HEADERS = {
    "Authorization": "Basic MWI1NjJiZDg5ZjE2ZjdlODZmZTQ2Nz...",
    ...
}
```

Same base64 token hardcoded in the source file. Should read from `.env` like every other script now does.

### HIGH: Parts Cost is Guesswork

```python
PARTS_COST = {
    "FUNC_CRACK": 120,
    "NONFUNC_USED": 50,
    "NONFUNC_CRACK": 170,
}
DEFAULT_PARTS_COST = 100
```

Static estimates per grade. The real parts cost data lives on Monday's Parts Board (985177480) in the `supply_price` column. A device might need a £40 screen or a £200 screen depending on the model. Hardcoding £120 for all FUNC_CRACK devices is wrong for most of them.

### MEDIUM: 90-Minute Runtime

2-second delay between competitor API calls across 2,600+ listings = ~87 minutes. The cron has a 9,000 second (2.5 hour) timeout to accommodate this. Not necessarily fixable (BM rate limits are real) but worth noting.

### MEDIUM: No Separation of Concerns

One 955-line file does everything: API calls, profit math, SKU parsing, auto-bumping, report generation, progress management. If the profit formula needs fixing, you're editing the same file that handles API retries.

## Proposed Changes

### 1. Fix profit formula
- Keep both BM fees (10% on purchase + 10% on resale). Original was correct.
- Change labour rate from £25 to £24/hr.
- Add grade-based labour defaults: FC=2hrs, NFU=4hrs, NFC=1.5hrs, FU/FG/FE=1hr.

### 2. Switch to V6 scraper output
- Read sell prices from `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`
- Match by product_id from listing (the scraper stores UUIDs per model)
- Fall back to grade-based pricing from scraper pickers (Fair/Good/Excellent prices per model)
- If scraper data is stale (>24hrs): log warning but still use it (stale data > £500 default)
- If no scraper data at all: use historical as before, but flag in report

### 3. Remove hardcoded credentials
- Read `BM_AUTH` and `BM_UA` from `.env`
- Fail fast at startup if env vars missing

### 4. Improve parts cost resolution
- Try Monday Parts Board first (via linked items on Main Board)
- Fall back to the current grade-based estimates only when Monday data unavailable
- Log which method was used per listing

### 5. Fix labour hours
- Map grade to default labour hours:
  - FUNC_CRACK (FC): 2.0 hrs (screen replacement)
  - FUNC_USED/FUNC_GOOD/FUNC_EXCELLENT (FU/FG/FE): 1.0 hrs (clean + test)
  - NONFUNC_USED (NFU): 4.0 hrs (board repair)
  - NONFUNC_CRACK (NFC): 1.5 hrs (screen + basic repair)

### Not Changing
- Pipeline structure (fetch → check → calculate → bump → report): solid
- Auto-bump logic and safety caps: working correctly
- Resume/progress mechanism: necessary for 90-min runs
- Report format and day-over-day comparison: useful
- 2-second competitor delay: BM rate limit, can't reduce

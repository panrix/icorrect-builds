# Brief: V6 Scraper Hardening

**Date:** 27 Mar 2026
**From:** Code (orchestrator)
**For:** Codex build agent
**Priority:** HIGH — success rate degrading, catalog freshness depends on this

---

## Objective

Make the V6 BM sell price scraper reliable enough to sustain >90% success rate on weekly runs. Currently degrading from 100% to 58% over 10 days due to Cloudflare detection.

---

## File to Modify

```
/home/ricky/builds/buyback-monitor/sell_price_scraper_v6.js
```

This is the primary scraper. 19 MacBook models in the default catalogue. ~450 lines of Node.js using Playwright + puppeteer-extra-plugin-stealth.

Also update the pipeline script comment:
```
/home/ricky/builds/buyback-monitor/run-daily.sh
```

---

## Success Rate History (Last 10 Days)

| Date | Success | Total | Rate |
|------|---------|-------|------|
| Mar 18 | 16 | 16 | 100% |
| Mar 19 | 16 | 16 | 100% |
| Mar 20 | 15 | 16 | 94% |
| Mar 21 | 15 | 16 | 94% |
| Mar 22 | 18 | 19 | 95% |
| Mar 23 | 18 | 19 | 95% |
| Mar 24 | 17 | 19 | 89% |
| Mar 25 | 16 | 19 | 84% |
| Mar 26 | 16 | 19 | 84% |
| Mar 27 | 11 | 19 | 58% |

All failures are `cloudflare_blocked`. The stealth plugin alone is no longer sufficient.

---

## Current Anti-Detection (Already In Place)

- `puppeteer-extra-plugin-stealth` registered on Chromium
- Homepage warmup visit before scraping (sets cookies, passes initial CF challenge)
- 3-second wait after each page load
- 5-second delay between retry attempts
- 2 attempts per model (retry on Cloudflare block or missing NUXT data)
- Realistic user agent (Chrome 131 on macOS), viewport (1440×900), locale (en-GB), timezone (Europe/London)

---

## What to Add

### 1. Request Jitter

Add a random delay of 3-8 seconds between model scrapes in the main loop.

Currently models are scraped back-to-back. The only delays are the 3s page-load wait and 5s retry delay. Add an inter-model pause after each scrape completes, before starting the next model.

```
// After scrapeUrl() returns and result is stored:
const jitter = 3000 + Math.random() * 5000;
console.log(`  Waiting ${(jitter/1000).toFixed(1)}s before next model...`);
await new Promise(r => setTimeout(r, jitter));
```

### 2. Browser Context Rotation

Create a fresh browser context every 4-5 models. This gives each batch a new fingerprint and cookie set.

Implementation:
- Track model count per context
- After every 4-5 models, close current context
- Create a new context with the same options (locale, UA, viewport, timezone)
- Do a fresh homepage warmup on the new context
- Log when rotation happens: `"Rotating browser context (batch N)..."`

The browser instance itself stays open — only the context rotates.

### 3. Backfill Retry Pass

After the main scrape loop completes, collect all failed models and run a second pass.

Implementation:
- After the main loop, filter results for entries with `error` or `scraped: false` (excluding `unavailable` and `pending_derivation` entries)
- If there are failures:
  - Log `"Starting backfill pass for N failed models..."`
  - Create a completely fresh browser context with homepage warmup
  - Add extra jitter (5-12 seconds) between backfill attempts
  - Retry each failed model
  - Update the results dict with any successful backfill scrapes
  - Log `"Backfill complete: N recovered, M still failed"`

### 4. Success Rate Alerting

After scraping completes (including backfill), if success rate is below 90%, send a Telegram alert.

Implementation:
- Load env from `/home/ricky/config/.env`:
  - `TELEGRAM_BOT_TOKEN` — the bot token
  - `BM_TELEGRAM_CHAT` — the chat ID for BM alerts
- Use Node.js built-in `https` module (no new dependencies)
- POST to `https://api.telegram.org/bot${token}/sendMessage`
- Body: `{ chat_id, text, parse_mode: "Markdown" }`
- Message: `` ⚠️ *V6 Scraper Alert*\n${scrapedOk}/${total} models scraped (${percent}%)\nFailed: ${failedModelNames.join(", ")} ``
- Only send if success rate < 90%
- If the Telegram call fails, log the error but don't crash the scraper

### 5. Pipeline Script Comment

Add a comment to the top of `run-daily.sh`:

```bash
# Schedule note: recommended move from daily (0 5 * * *) to weekly
# (0 5 * * 1) to reduce Cloudflare detection risk.
# The downstream catalog merge (bm-catalog-merge.py) works with
# weekly data. Update crontab when ready.
```

Do NOT modify the actual crontab.

---

## What NOT to Change

- Core scraping logic (NUXT extraction, picker parsing, categorisation)
- Output format (downstream consumers depend on it: buy_box_monitor.py, sync_to_sheet.py, bm-catalog-merge.py)
- CLI flags: `--dry-run`, `--model`, `--iphone-ipad`, `--all` must keep working
- Config files (`scrape-urls.json`, `scrape-urls-iphone-ipad.json`)
- No new npm dependencies

---

## Env File

All env vars are in `/home/ricky/config/.env`. The scraper currently doesn't load this file (it doesn't need API keys). For the Telegram alerting feature, you'll need to read these two vars from it:

```
TELEGRAM_BOT_TOKEN=...
BM_TELEGRAM_CHAT=...
```

Use a simple line-by-line parser or `dotenv` (already in `node_modules/` — check `buyback-monitor/node_modules/dotenv`).

---

## Verification

After changes:

1. `node sell_price_scraper_v6.js --dry-run` — confirm catalogue display still works
2. `node sell_price_scraper_v6.js --model "Air 13" --dry-run` — confirm model filter works
3. Show the full diff of changes
4. Do NOT run a full live scrape during QA — we don't want to trigger more Cloudflare blocks. The live test should be the next scheduled cron run.

---

## Expected Outcome

With jitter + context rotation + backfill:
- Cloudflare sees 4-5 requests per fingerprint instead of 19
- Random timing makes the pattern less bot-like
- Failed models get a second chance with a clean fingerprint
- If it's still below 90% after these changes, the Telegram alert tells us immediately

This should recover to >90% success rate. If Cloudflare escalates further (Turnstile, full bot management), the next step would be proxy rotation or a cloud browser service — but that's a separate decision.

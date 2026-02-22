# Marketing Intelligence (mi.icorrect.co.uk) — Build Brief

## What This Is

A self-hosted marketing intelligence platform replacing £5-20k/year of SaaS tools. Automated data collection for SEO rankings, site health, competitive intelligence, and social analytics for iCorrect (Apple repair business, London).

**Live URL:** https://mi.icorrect.co.uk (behind Nginx basic auth: `ricky` / `iCorrect2026`)

---

## Current State (as of 2026-02-12)

### What's Deployed
- **Backend:** FastAPI (Python 3.12) on port 8001 via systemd
- **Database:** SQLite at `data/intelligence.db` (13 completed scans)
- **Dashboard:** Single static HTML file (Tailwind CDN + Chart.js) — **NOT the React app the spec called for**
- **Scrapers:** 5 built (Google Maps local, Google organic, YouTube, TikTok, site health) using Playwright
- **Hosting:** Nginx reverse proxy + SSL (certbot auto-renews)
- **Auth:** Nginx basic auth (added 2026-02-12)
- **Backups:** Daily 3am UTC to `/home/ricky/data/backups/intelligence/` (fixed 2026-02-12, was `/tmp/`)

### What Works
- API endpoints return data: `/health`, `/api/v1/rankings/local`, `/api/v1/rankings/organic`, `/api/v1/rankings/youtube`, `/api/v1/health/site`, `/api/v1/scans`, `/api/v1/agent/briefing`
- Scrapers can run manually via `python3 scheduler/coordinator.py --scan <type>`
- Database has schema for all 4 phases (rank tracking, competitive intel, content/social, brand monitoring)
- Only Phase 1 tables have any data (13 scans)
- Backup script runs daily, 30-day local retention

### What Was Fixed on 2026-02-12
1. **SQL injection** — All `.format(days)` replaced with parameterized queries
2. **CORS** — Changed from `allow_origins=["*"]` to `allow_origins=["https://mi.icorrect.co.uk"]`
3. **Auth** — Nginx basic auth added (was completely open before)
4. **Backups** — Moved from `/tmp/` to `/home/ricky/data/backups/intelligence/`

### What's Broken / Missing
1. **Dashboard is static HTML, not React** — The spec called for a React app but got a single `index.html` with CDN Tailwind and Chart.js. Needs a proper rebuild.
2. **Only Phase 1 built** — Schema exists for Phase 2 (competitive intel), Phase 3 (content/social), Phase 4 (brand monitoring), but no scrapers, no API endpoints, no UI for any of them.
3. **TikTok scraper disabled** — Requires manual cookie auth setup
4. **No scan scheduling UI** — Scans run via cron (OpenClaw cron, not system crontab) but there's no way to trigger or monitor them from the dashboard
5. **API service was in a restart loop** — Had 15,458 restart attempts from a stale port lock. Fixed on 2026-02-12 by killing the orphan process.
6. **README is out of date** — Still references `/tmp/intelligence-backups/` for backups and system-level systemd commands (should be `--user`)

### File Locations (on VPS: ricky@46.225.53.159)

```
~/.openclaw/agents/marketing/workspace/intelligence/
├── api/
│   ├── main.py                    # FastAPI app (fixed 2026-02-12)
│   ├── requirements.txt           # fastapi + uvicorn only
│   ├── routes/                    # Empty __init__.py
│   └── services/                  # Empty __init__.py
├── scrapers/
│   ├── base.py                    # Abstract base (rate limiting, checkpoints, retries)
│   ├── google_maps_local.py       # 7x7 geo-grid local rank tracker
│   ├── google_organic.py          # SERP position tracker
│   ├── youtube_rank.py            # YouTube search rank tracker
│   ├── tiktok_rank.py             # TikTok (disabled, needs cookies)
│   └── site_health.py             # Site crawler via sitemap.xml
├── scheduler/
│   └── coordinator.py             # CLI entry point for all scans
├── database/
│   ├── db.py                      # SQLite connection manager
│   └── schema.sql                 # Full schema (Phase 1-4)
├── config/
│   ├── settings.py                # Keywords, grid config, rate limits
│   └── alerts.yaml                # Alert rules
├── utils/
│   ├── browser_session.py         # Playwright headless browser wrapper
│   ├── rate_limiter.py            # Random delay rate limiter
│   ├── alerts.py                  # Rank drop / site health alerting
│   └── supabase_client.py         # Supabase integration for alerts
├── dashboard/
│   └── index.html                 # Static HTML dashboard (needs React rebuild)
├── data/
│   └── intelligence.db            # SQLite database (13 scans)
├── scripts/
│   ├── backup.sh                  # Daily backup (fixed 2026-02-12)
│   ├── init_db.py                 # DB initialization
│   ├── init_db.sh                 # DB init wrapper
│   └── test_scraper.sh            # Scraper test script
├── logs/                          # Daily scan logs
├── marketing-intelligence-api.service  # systemd unit file (reference copy)
├── nginx-config.conf              # Nginx config (reference copy)
└── README.md                      # Documentation (partially outdated)
```

### Systemd Service
```
/etc/systemd/system/marketing-intelligence-api.service
# NOTE: This is a SYSTEM service (not user service despite README saying otherwise)
# Runs as user ricky, WorkingDirectory is the intelligence folder
# ExecStart: python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8001
```

### Nginx Config
`/etc/nginx/sites-available/marketing-intel` — reverse proxy + SSL + basic auth

---

## Database Schema Summary

Phase 1 (has data):
- `scans` — scan metadata (13 completed)
- `local_rank_scans` — Google Maps geo-grid rankings
- `organic_rank_scans` — Google organic SERP positions
- `youtube_rank_scans` — YouTube search positions
- `tiktok_rank_scans` — TikTok (empty, scraper disabled)
- `site_crawls` — Page-level health data
- `broken_links` — Broken link records

Phase 2 (schema only, no data):
- `competitors`, `competitor_snapshots`, `ad_intelligence`, `citation_scans`

Phase 3 (schema only, no data):
- `social_account_snapshots`, `social_posts`, `content_opportunities`, `reviews`, `review_summaries`

Phase 4 (schema only, no data):
- `brand_mentions`, `market_scans`

System:
- `alert_history`, `schema_version`, `config_overrides`

---

## Scraper Architecture

All scrapers inherit from `base.py` which provides:
- Rate limiting (3-10 second random delays)
- Checkpointing (resume interrupted scans)
- Retry logic
- Logging

Browser automation uses Playwright Python (`utils/browser_session.py`), NOT the `agent-browser` CLI. Each scan gets its own browser instance with anti-detection features (hidden webdriver, user agent rotation, consent page handling).

### Scan Keywords (from config/settings.py)
- **Local (10):** MacBook repair, MacBook repair London, Apple repair London, MacBook screen repair, MacBook logic board repair, iPhone repair London, iPad repair London, liquid damage MacBook, MacBook data recovery, Apple Watch repair London
- **Organic (15):** Above + MacBook repair UK, MacBook liquid damage repair, can liquid damaged MacBook be fixed, MacBook not turning on repair, MacBook keyboard repair London, iCorrect reviews
- **YouTube (10):** MacBook repair, MacBook logic board repair, MacBook liquid damage repair, iPhone repair, MacBook screen repair, Apple repair, MacBook flexgate repair, MacBook data recovery, board level repair MacBook, Apple Watch battery replacement

### Scan Schedule (OpenClaw cron, NOT system crontab)
- Local rank: Monday 6:00 UTC (~55 min)
- Organic rank: Monday 6:30 UTC (~10 min)
- YouTube: Tuesday 6:00 UTC (~5 min)
- TikTok: Disabled
- Site health: 1st of month 6:00 UTC (~1 min)

---

## Known Landmines

- **Do NOT use `agent-browser` CLI for scraping** — it's a shared singleton, other processes will kill the session. Use Playwright Python directly.
- **Google CAPTCHA** — The VPS IP can get CAPTCHAd after too many rapid requests. Weekly scans are fine; don't run all scrapers back-to-back.
- **The systemd service is system-level** (`/etc/systemd/system/`), not user-level — need `sudo` for restart
- **Port 8001 can get stuck** — if the service fails to start, check `sudo fuser 8001/tcp` and kill the orphan
- **SQLite locking** — Only one write at a time. Don't run multiple scrapers simultaneously.
- **Playwright binary** is at `~/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome` — if it disappears, run `python3 -m playwright install chromium`
- **Do NOT edit files in `~/.openclaw/shared/`** without approval — changes propagate to all 11 agents

---

## What Ricky Cares About

- Automated weekly visibility into Google Maps rankings (how does iCorrect rank in a 5km radius?)
- Competitor tracking (who's outranking him, ad intelligence)
- Site health monitoring (broken links, slow pages, missing meta)
- All of this self-hosted and free, replacing expensive SaaS tools
- A proper React dashboard, not a static HTML page
- Eventually: competitive intelligence, social analytics, review aggregation, brand monitoring

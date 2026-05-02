# Marketing Intelligence Platform Revival Fix Report

Date: 2026-04-06  
Workspace checked: `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/`  
Method: read-only verification only. No scraper `scrape()` runs and no live-service scraping was performed.

## 1. Scraper verification

Constructor-level initialization was tested with:
- real code imports
- real `data/intelligence.db` path
- `config.settings.get_config(test_mode=True)`
- no browser opened
- no network calls made

| Scraper file | Import | Init | Notes | Current status |
|---|---|---:|---|---|
| `scrapers/google_maps_local.py` | PASS | PASS | `LocalRankScraper` initializes cleanly; browser is lazy-created later | Working for scheduler use |
| `scrapers/google_organic.py` | PASS | PASS | `OrganicRankScraper` initializes cleanly; browser is lazy-created later | Imports/init OK, but not preferred for cron due Google CAPTCHA/DOM drift risk |
| `scrapers/gsc_organic.py` | PASS | N/A | Script module imports cleanly; no scraper class to instantiate | Viable replacement for browser organic scan |
| `scrapers/youtube_rank.py` | PASS | PASS | `YouTubeRankScraper` initializes cleanly | Working for scheduler use |
| `scrapers/tiktok_rank.py` | PASS | PASS | `TikTokRankScraper` initializes cleanly, but cookie dependency is unmet | Not cron-ready |
| `scrapers/site_health.py` | PASS | PASS | `SiteHealthScraper` initializes cleanly | Working for scheduler use |

### Blocking prerequisites found

- `scrapers/tiktok_rank.py` depends on `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/data/sessions/tiktok_cookies.json`
- That cookie file is currently missing
- `scrapers/gsc_organic.py` requires:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `EDGE_GOOGLE_REFRESH_TOKEN`
- All three GSC env vars are present in `/home/ricky/config/api-keys/.env`

### Practical judgement

- Safe to schedule now:
  - `local-rank`
  - `youtube`
  - `site-health`
  - `gsc_organic.py` direct script
- Do not schedule now:
  - `tiktok`
- Not recommended as the production organic job:
  - `organic-rank` via `scrapers/google_organic.py`

## 2. Database file check

### Files present

| DB file | Size | Tables/data | Verdict |
|---|---:|---|---|
| `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/marketing.db` | 0 bytes | no tables | Empty |
| `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/data/intelligence.db` | 1,204,224 bytes | real schema and real rows | Primary live DB |
| `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/data/marketing_intel.db` | 0 bytes | no tables | Empty |
| `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/data/mi.db` | 0 bytes | no tables | Empty |
| `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/data/scans.db` | 0 bytes | no tables | Empty |

### Row counts in the live DB

| Table | Rows |
|---|---:|
| `scans` | 32 |
| `local_rank_scans` | 1342 |
| `organic_rank_scans` | 110 |
| `gsc_rank_history` | 24 |
| `youtube_rank_scans` | 18 |
| `tiktok_rank_scans` | 0 |
| `site_crawls` | 8 |
| `broken_links` | 0 |
| `alert_history` | 0 |

Result: `data/intelligence.db` is the only DB file with actual platform data.

## 3. API verification

### Code-level startup

The FastAPI app imports and starts successfully under `TestClient`.

Verified responses:
- `GET /` → `200`
- `GET /health` → `200`
- `GET /api/v1/health` → `200`
- `GET /api/v1/config` → `200`
- `GET /api/v1/reports/weekly` → `500` with `no such table: site_health`

### VPS live service state on 2026-04-06

- `systemctl is-active marketing-intelligence-api.service` → `active`
- `systemctl is-enabled marketing-intelligence-api.service` → `enabled`
- `curl http://127.0.0.1:8001/health` → `{"status":"healthy","database":"connected","total_scans":32}`
- `curl http://127.0.0.1:8001/api/v1/reports/weekly` → `500` with `{"detail":"no such table: site_health"}`

### API conclusion

The API can start and is already running on the VPS. The current breakage is not startup failure; it is endpoint/schema drift. The confirmed runtime bug is the weekly report endpoint querying `site_health`, while the DB contains `site_crawls`.

## 4. `requirements.txt` completeness

File checked:
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/requirements.txt`

Current contents:
- `fastapi==0.115.0`
- `uvicorn[standard]==0.32.0`

### Coverage assessment

This file is sufficient for the API import/start path only.

It is not complete for the full marketing intelligence platform. Direct imports used elsewhere in the repo require additional packages:
- `playwright`
- `requests`
- `supabase`

### Current VPS package state

These packages are already installed in the current environment:
- `fastapi`
- `uvicorn`
- `playwright`
- `requests`
- `supabase`

### Conclusion

`api/requirements.txt` is incomplete as a platform requirements file. It does not fully describe the dependencies needed by the scheduler, scrapers, or alert-sync utilities.

## 5. Crontab proposal for working scrapers

Current user crontab does not contain any marketing intelligence jobs.

These are the exact entries I would add for the currently workable scan set:

```cron
# Marketing intelligence local rank scan — Monday 06:00 UTC
0 6 * * 1 cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scheduler/coordinator.py --scan local-rank --force >> /home/ricky/logs/cron/marketing-intel-local-rank.log 2>&1

# Marketing intelligence GSC organic scan — Monday 06:30 UTC
30 6 * * 1 cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && set -a && . /home/ricky/config/api-keys/.env && set +a && /usr/bin/python3 scrapers/gsc_organic.py >> /home/ricky/logs/cron/marketing-intel-gsc-organic.log 2>&1

# Marketing intelligence YouTube scan — Tuesday 06:00 UTC
0 6 * * 2 cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scheduler/coordinator.py --scan youtube --force >> /home/ricky/logs/cron/marketing-intel-youtube.log 2>&1

# Marketing intelligence site health scan — 1st of month 06:00 UTC
0 6 1 * * cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scheduler/coordinator.py --scan site-health --force >> /home/ricky/logs/cron/marketing-intel-site-health.log 2>&1
```

### Explicit exclusions

Do not add this yet:
- TikTok scan, because `data/sessions/tiktok_cookies.json` is missing

Do not use this as the main organic cron:
- `scheduler/coordinator.py --scan organic-rank`

Reason:
- the current coordinator still routes organic scans to the browser scraper
- the GSC script is present and better suited for cron
- the GSC script is not wired into `scheduler/coordinator.py`, so cron must call `scrapers/gsc_organic.py` directly unless the coordinator is updated later

## 6. Net fix position

As of 2026-04-06, the platform does not need a rebuild to come back to life:
- the live DB is present and populated
- the API is already running
- the scraper modules all import and initialize
- the immediate gaps are scheduler wiring, incomplete dependency declaration, one broken API endpoint, and TikTok auth state

The highest-signal revival path is:
- keep `data/intelligence.db`
- keep the existing FastAPI service
- schedule cron directly from user crontab
- use `gsc_organic.py` instead of the browser organic scan
- leave TikTok disabled until cookies are provisioned

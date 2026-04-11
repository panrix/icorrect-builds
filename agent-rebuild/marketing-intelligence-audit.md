# Marketing Intelligence Platform Audit

Date: 2026-04-04  
Scope: `~/.openclaw/agents/marketing/workspace/intelligence/`, related marketing docs, service wiring, DB state, and cron state  
Method: read-only research only; no existing files modified

---

## 1. Platform architecture summary

## Executive answer

The platform is **not dead code**. It is a **partially working, partially drifted system** with:
- real scraper code
- a real database schema
- a real populated SQLite database
- a real FastAPI backend
- a real static dashboard
- a real systemd unit file
- a planned OpenClaw cron schedule

But it is currently broken operationally because:
- the **API service is inactive (`dead`)**
- the original **OpenClaw cron jobs were never properly live in the current scheduler**
- the cron plan uses **`delivery.mode: "silent"`**, which is not valid in current OpenClaw cron semantics and matches the earlier “delivery target missing” failure pattern
- parts of the API/router layer are ahead of the README, while other parts are incomplete or inconsistent
- some scrapers are usable now, but some are fragile or blocked by authentication / CAPTCHA / scale issues

### Bottom-line judgement

This should be treated as a **revive-and-rationalise** project, not a total rebuild.

The correct move is:
1. keep the **database**
2. keep the **scheduler entrypoint**
3. keep the **working scrapers**
4. keep the **API shell**
5. keep the **dashboard only as a temporary MVP**
6. move scan execution to **plain crontab or system cron-style shell jobs**, not agent-turn OpenClaw cron jobs
7. optionally replace the browser-based organic scraper with the existing **GSC-based script** for production stability

---

## 2. Full platform inventory

## 2.1 Top-level structure

Observed under `~/.openclaw/agents/marketing/workspace/intelligence/`:

- `README.md`
- `DASHBOARD_SPEC.md`
- `TEST_RESULTS.md`
- `openclaw-cron-jobs.json`
- `marketing-intelligence-api.service`
- `nginx-config.conf`
- `marketing.db`
- `api/`
- `config/`
- `dashboard/`
- `dashboard-old-static/`
- `database/`
- `data/`
- `logs/`
- `reports/`
- `scheduler/`
- `scrapers/`
- `scripts/`
- `utils/`

### High-level architecture actually present

| Layer | What exists | Status |
|---|---|---|
| Scraping layer | 6 scraper files + base class | Real, partially working |
| Scheduler | `scheduler/coordinator.py` | Real, usable |
| DB schema | `database/schema.sql` + DB helpers | Real, usable |
| Storage | `data/intelligence.db` populated | Real, partially populated |
| API | FastAPI app + routers | Real, but incomplete in places |
| Dashboard | static HTML dashboard | Real but basic |
| Product-grade dashboard plan | `DASHBOARD_SPEC.md` | Spec only |
| Service wiring | systemd unit + nginx config file in repo | Real files exist; live service inactive |
| Alerting | local alert logic + Supabase client | Partially real |
| Cron plan | OpenClaw cron JSON plan | Planned, not properly live |

---

## 2.2 README vs reality

The README describes a healthy deployed platform:
- dashboard live
- API running
- nginx configured
- OpenClaw cron imported
- backup cron active

That is no longer fully true.

### What the README still gets right
- directory architecture is broadly correct
- Playwright is the intended browser stack
- scheduler/coordinator is the right execution entrypoint
- scrapers and schema are real
- API and dashboard design are directionally correct

### What the README gets wrong or is now stale
- API is **not** currently running
- OpenClaw cron jobs are **not** present in current `openclaw cron list`
- the DB is **not empty** despite the brief’s assumption; `data/intelligence.db` has real tables and rows
- there are multiple DB files, but only one is meaningful

---

## 2.3 Scheduler

### File
- `scheduler/coordinator.py`

### What it does
This is the central CLI entrypoint and is the correct orchestrator for scan runs.

It:
- parses `--scan`
- supports `--force`
- supports `--test-mode`
- loads config via `config.settings.get_config()`
- points scans at `data/intelligence.db`
- prevents duplicate scans within 12 hours unless forced
- instantiates the appropriate scraper class
- executes it
- triggers post-scan alert checks
- exits non-zero on failure

### Supported scan types
Mapped in code:
- `local-rank`
- `organic-rank`
- `youtube`
- `tiktok`
- `site-health`

### Assessment
**Good enough to keep.**  
This is the right surface to call from crontab.

---

## 2.4 Scrapers directory

Observed files:
- `base.py`
- `google_maps_local.py`
- `google_organic.py`
- `gsc_organic.py`
- `youtube_rank.py`
- `tiktok_rank.py`
- `site_health.py`

Important note:
- `gsc_organic.py` exists but is **not wired into** `scheduler/coordinator.py`
- current coordinator still routes organic scans to the **browser-based** `google_organic.py`

---

## 2.5 API layer

### Core files
- `api/main.py`
- `api/db.py`
- routers:
  - `routers/rankings.py`
  - `routers/health.py`
  - `routers/scans.py`
  - `routers/agent.py`
  - `routers/alerts.py`
  - `routers/competitors.py`
  - `routers/config.py`
- `api/requirements.txt`

### What exists
The API is a real FastAPI app with router structure and versioned endpoints.

It includes:
- rankings endpoints
- health endpoints
- scan-history endpoints
- agent briefing endpoint
- partial competitors endpoints
- partial config/report endpoints
- root + health checks

### Main API problem
The API surface is **inconsistently mature**:
- some endpoints are real and query valid tables
- some endpoints are stubs
- some endpoints reference schema that does not exist
- some endpoints assume later phases that were never actually built

Examples:
- `alerts.py` is effectively a stub returning empty data
- `config.py` falls back to hardcoded defaults rather than the real `config/settings.py`
- `config.py` weekly report references a `site_health` table with Lighthouse-style scores, but the actual schema has `site_crawls`, not `site_health`

### Assessment
**Keep the API, but audit each endpoint before trusting it.**

---

## 2.6 Dashboard layer

### Files
- `dashboard/index.html`
- `dashboard-old-static/index.html`
- `DASHBOARD_SPEC.md`

### Current dashboard tech stack
The live dashboard file is:
- plain static HTML
- Tailwind via CDN
- Chart.js via CDN
- inline JavaScript fetch calls to `/api/v1/*`

It is **not** the React/Vite product-grade dashboard described in:
- `DASHBOARD_SPEC.md`
- parts of `KNOWLEDGE-BASE.md`

### Current dashboard behaviour
It tries to render:
- local rankings summary
- organic rankings table
- site health summary
- last scan freshness

### Assessment
- current static dashboard is a **usable MVP shell**
- the React/Vite dashboard described in docs is **not present in this intelligence directory**
- revive the current static dashboard only if the API comes back up
- do **not** invest heavily in this version if the long-term intent is product-grade UI

---

## 2.7 Database layer

### Files
- `database/schema.sql`
- `database/db.py`
- `api/db.py`
- DB files present:
  - `marketing.db`
  - `data/intelligence.db`
  - `data/marketing_intel.db`
  - `data/mi.db`
  - `data/scans.db`

### Which DB matters?
Only **`data/intelligence.db`** currently matters.

Observed state:
- `marketing.db` → empty
- `data/marketing_intel.db` → empty
- `data/mi.db` → empty
- `data/scans.db` → empty
- `data/intelligence.db` → real schema + real data

### Current live data in `data/intelligence.db`
Observed tables include:
- `scans`
- `local_rank_scans`
- `organic_rank_scans`
- `youtube_rank_scans`
- `tiktok_rank_scans`
- `site_crawls`
- `broken_links`
- plus many Phase 2–4 tables, mostly empty

Observed row counts:
- `scans` → **32**
- `local_rank_scans` → **1342**
- `organic_rank_scans` → **110**
- `gsc_rank_history` → **24**
- `site_crawls` → **8**
- most Phase 2–4 tables → **0**

### Assessment
The database is **not dead**.  
Phase 1 data exists and is enough to justify keeping the DB.

---

## 2.8 Config

### Files
- `config/settings.py`
- `config/alerts.yaml`

### What business config exists
`settings.py` contains:
- business identity
- domain
- center coordinates
- local keywords
- organic keywords
- YouTube keywords
- grid settings
- rate-limit settings
- test-mode reduced scope

### Alert config
`alerts.yaml` defines intended rules for:
- rank drops
- rank improvements
- site health issues
- competitor ads
- negative reviews
- viral content
- negative brand mentions

### Assessment
Config is simple and sufficient for Phase 1.

---

## 2.9 Scripts

### Files
- `scripts/init_db.py`
- `scripts/init_db.sh`
- `scripts/backup.sh`
- `scripts/test_scraper.sh`

### What they do
- `init_db.py` initializes `data/intelligence.db` from schema
- `backup.sh` compresses `data/intelligence.db` to `/home/ricky/data/backups/intelligence`
- `test_scraper.sh` runs coordinator in `--test-mode` for the main scan types

### Assessment
Useful support scripts. Keep all three.

---

## 2.10 Utils

### Files
- `utils/browser_session.py`
- `utils/rate_limiter.py`
- `utils/alerts.py`
- `utils/supabase_client.py`

### What they do
- `browser_session.py` → Playwright headless Chromium wrapper with stealth-ish settings and consent handling
- `rate_limiter.py` → randomized delay helper
- `alerts.py` → post-scan alert comparison + local alert history + Supabase sync
- `supabase_client.py` → Supabase activity logging helper

### Assessment
These are real utilities, not scaffolding only.

---

## 3. Per-scraper detail

---

## 3.1 `google_maps_local.py`

### What it does
- generates a geo-grid around the business center
- defaults to **7×7** = 49 points
- searches Google Maps for each keyword at each point
- extracts visible businesses from the DOM
- records rank position for iCorrect
- stores competitor names/positions

### Input/config
Uses:
- `BUSINESS`
- `GRID_CONFIG`
- `LOCAL_KEYWORDS`
- rate-limit settings

### Dependencies
Imports/use imply:
- Playwright via `BrowserSession`
- Chromium installed via Playwright
- SQLite
- Google Maps DOM structure

### Standalone capability
Yes, via:
```bash
python3 scheduler/coordinator.py --scan local-rank --force
```

### Test mode
Yes:
```bash
python3 scheduler/coordinator.py --scan local-rank --test-mode
```
This reduces to:
- 3×3 grid
- 1 keyword

### Output
Writes to:
- `scans`
- `local_rank_scans`
- logs in `logs/YYYY-MM-DD.log`
- alerts via `utils/alerts.py`

### Practical cron form
```bash
cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && \
python3 scheduler/coordinator.py --scan local-rank --force
```

### Assessment
**Usable, but heavy.**  
This is the biggest runtime job and the most likely to time out or trigger Google friction.

---

## 3.2 `google_organic.py`

### What it does
- searches Google web search for each keyword
- extracts organic results from DOM
- detects ranking position for the iCorrect domain
- tries pagination out to page 5 (up to top 50-ish / 100-ish depending layout)
- stores device-tagged results for mobile + desktop

### Input/config
Uses:
- `ORGANIC_KEYWORDS`
- `BUSINESS.domain`

### Dependencies
- Playwright / Chromium
- Google web SERP DOM structure
- SQLite

### Standalone capability
Yes, via:
```bash
python3 scheduler/coordinator.py --scan organic-rank --force
```

### Output
Writes to:
- `scans`
- `organic_rank_scans`

### Main issue
This is the scraper most exposed to:
- CAPTCHA
- Google anti-automation friction
- DOM drift

### Assessment
**Technically standalone, but not the best production choice.**

---

## 3.3 `gsc_organic.py`

### What it does
This is a different organic-rank approach using **Google Search Console API** instead of browser scraping.

It:
- pulls query/page/position data from GSC
- tracks a hardcoded keyword set
- writes to `gsc_rank_history`
- prints a report

### Input/config
Requires env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EDGE_GOOGLE_REFRESH_TOKEN`

### Dependencies
- Google OAuth refresh flow
- Search Console API access
- SQLite
- no Playwright needed

### Standalone capability
Yes, directly:
```bash
python3 scrapers/gsc_organic.py
```

### Output
Writes to:
- `gsc_rank_history`

### Assessment
**Best candidate to replace `google_organic.py` in production.**

It is:
- more stable
- cheaper
- less likely to break
- not CAPTCHA-prone

But it is currently **not wired into coordinator**.

---

## 3.4 `youtube_rank.py`

### What it does
- searches YouTube for configured keywords
- scrolls to load more results
- parses `ytd-video-renderer`
- finds videos where channel name matches `iCorrect`
- stores rank, title, video ID, and views

### Input/config
Uses:
- `YOUTUBE_KEYWORDS`
- `BUSINESS.name`

### Dependencies
- Playwright / Chromium
- YouTube DOM structure
- SQLite

### Standalone capability
Yes:
```bash
python3 scheduler/coordinator.py --scan youtube --force
```

### Output
Writes to:
- `youtube_rank_scans`

### Assessment
**Reasonably standalone and cron-friendly**, though DOM drift risk exists.

---

## 3.5 `tiktok_rank.py`

### What it does
- searches TikTok for configured keywords
- uses saved cookies from `data/sessions/tiktok_cookies.json`
- tries to parse results from an accessibility snapshot
- stores matching iCorrect video positions and metrics

### Input/config
Uses:
- `YOUTUBE_KEYWORDS` (reused, likely intentionally but slightly messy)
- cookies file under `data/sessions/`

### Dependencies
- Playwright / Chromium
- valid TikTok session cookies
- TikTok DOM/accessibility structure
- SQLite

### Standalone capability
Yes, but only after cookie setup:
```bash
python3 scheduler/coordinator.py --scan tiktok --force
```

There is also manual cookie bootstrap via:
```bash
python3 scrapers/tiktok_rank.py
```
which prompts for cookie values.

### Output
Writes to:
- `tiktok_rank_scans`

### Assessment
**Blocked and fragile.**  
Do not schedule until cookies and reliability are confirmed.

---

## 3.6 `site_health.py`

### What it does
- fetches sitemap(s)
- discovers URLs
- opens each page
- extracts title, meta description, H1, word count, image alt counts, internal/external links, load time
- stores page metrics
- supports broken link table, but actual broken-link checking is still essentially stubbed/minimal

### Input/config
Uses:
- `BUSINESS.domain`

### Dependencies
- `requests`
- `xml.etree.ElementTree`
- Playwright / Chromium
- SQLite

### Standalone capability
Yes:
```bash
python3 scheduler/coordinator.py --scan site-health --force
```

### Output
Writes to:
- `site_crawls`
- `broken_links` (if any collected)

### Assessment
**Usable and cron-friendly.**  
Likely the safest of the browser-driven scans.

---

## 4. Current status — what’s running, what’s dead, what’s broken

---

## 4.1 Service status

### `systemctl --user status marketing-intelligence-api`
Observed:
- service file is loaded from `~/.config/systemd/user/marketing-intelligence-api.service`
- service is currently **inactive (dead)**
- not running

### systemd unit file presence
Observed:
- `/home/ricky/.config/systemd/user/marketing-intelligence-api.service` exists

### Nginx config check
Command requested by brief:
- `grep -r "mi.icorrect" /etc/nginx/sites-enabled/`

Observed:
- **no output**

Interpretation:
- no current enabled nginx site under `/etc/nginx/sites-enabled/` explicitly referencing `mi.icorrect`
- there is a repo-local `nginx-config.conf`, but the live enabled-site linkage is not confirmed by this check

---

## 4.2 Database status

The brief assumed the database might be empty.
That is incorrect for the real primary DB.

### DB findings
- `marketing.db` → empty, no tables
- `data/intelligence.db` → populated schema and real rows
- all other DB files checked → empty

### Conclusion
The platform has run before. There is historical scan data.

---

## 4.3 OpenClaw cron status

### Live `openclaw cron list`
Observed only:
- `Morning Inbox Triage`
- status: `error`

No marketing-intelligence jobs are currently live in the OpenClaw cron scheduler.

### Planned cron file
`openclaw-cron-jobs.json` defines 5 intended jobs:
- local rank
- organic rank
- youtube
- tiktok (disabled)
- site health

But they are written as `agentTurn` jobs with:
- `delivery.mode: "silent"`

This is a critical mismatch.
Current OpenClaw cron schema supports:
- `none`
- `announce`
- `webhook`

So `silent` is not a valid current mode.
That strongly explains why the earlier cron setup could fail or never become healthy.

### Conclusion
The planned OpenClaw cron approach is not the right revival path.
Use **plain shell crontab** or a corrected modern cron payload if OpenClaw cron is required later.

---

## 4.4 What’s alive vs dead vs broken

### Alive / worth keeping
- `data/intelligence.db`
- `database/schema.sql`
- `scheduler/coordinator.py`
- `google_maps_local.py`
- `youtube_rank.py`
- `site_health.py`
- `gsc_organic.py`
- API codebase skeleton
- static dashboard MVP
- backup/init scripts

### Dead / inactive right now
- systemd API service
- OpenClaw cron jobs for this platform
- nginx live binding not confirmed

### Broken / inconsistent
- browser-based organic rank pipeline is high-risk and likely unstable
- TikTok depends on cookies and is disabled in planned cron
- API has endpoints referencing nonexistent schema (`site_health` table etc.)
- config router does not reflect the actual Python config source
- dashboard spec and dashboard implementation are far apart
- multiple empty DB files create confusion about what is canonical

---

## 5. Dependency list

---

## 5.1 Python packages directly evidenced

From code/imports + requirements:

### Explicit API requirements
- `fastapi==0.115.0`
- `uvicorn[standard]==0.32.0`

### Additional packages clearly needed by scraper/runtime code
- `playwright`
- `requests`
- `supabase`

### Standard library heavily used
- `sqlite3`
- `argparse`
- `logging`
- `json`
- `uuid`
- `datetime`
- `pathlib`
- `urllib`
- `xml.etree.ElementTree`
- `re`
- `math`

### Missing dependency declaration problem
`api/requirements.txt` is incomplete for the full platform.
It only covers FastAPI/Uvicorn, not the scraper dependencies.

There is no obvious top-level `requirements.txt` covering the whole intelligence project.

---

## 5.2 Browser/runtime dependencies

### Playwright / Chromium needed?
**Yes. Definitely.**

Needed for:
- `google_maps_local.py`
- `google_organic.py`
- `youtube_rank.py`
- `tiktok_rank.py`
- `site_health.py`
- `utils/browser_session.py`

`BrowserSession` explicitly uses:
- `playwright.sync_api`
- Chromium launch
- headless browser context
- stealth-ish flags
- `--no-sandbox`

### Browser install expectation
The README expects:
```bash
pip3 install --user --break-system-packages playwright
python3 -m playwright install chromium
```

---

## 5.3 API / credential dependencies

### Google Search Console / OAuth
For `gsc_organic.py`:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EDGE_GOOGLE_REFRESH_TOKEN`

### Supabase
For alert sync:
- credentials referenced via `utils/supabase_client.py`
- `alerts.yaml` references `/home/ricky/config/supabase/.env`

### TikTok
- `data/sessions/tiktok_cookies.json`
- manual cookie extraction/login required

### Other APIs?
No direct Google Maps API / YouTube Data API usage appears in the Phase 1 scraper code inspected here.
Most of the platform relies on:
- DOM scraping
- Playwright browser sessions
- GSC API for the alternative organic pipeline
- Supabase for alerts

---

## 6. Per-scraper standalone capability and cronability

| Scraper | Standalone? | Best run command | Needs special config? | Output target | Cron-ready? |
|---|---:|---|---|---|---:|
| Google Maps local | Yes | `python3 scheduler/coordinator.py --scan local-rank --force` | Playwright/Chromium | `data/intelligence.db` | Yes, but heavy |
| Google organic (browser) | Yes | `python3 scheduler/coordinator.py --scan organic-rank --force` | Playwright/Chromium | `data/intelligence.db` | Technically yes, but not ideal |
| GSC organic | Yes | `python3 scrapers/gsc_organic.py` | Google OAuth env vars | `gsc_rank_history` in `data/intelligence.db` | Yes, strong candidate |
| YouTube | Yes | `python3 scheduler/coordinator.py --scan youtube --force` | Playwright/Chromium | `data/intelligence.db` | Yes |
| TikTok | Yes | `python3 scheduler/coordinator.py --scan tiktok --force` | cookies + Playwright | `data/intelligence.db` | Not until cookies/reliability fixed |
| Site health | Yes | `python3 scheduler/coordinator.py --scan site-health --force` | Playwright + `requests` | `data/intelligence.db` | Yes |

---

## 7. Fix plan — get it running as crontab

This section answers the brief’s “what would it take” question concretely.

---

## 7.1 Core principle

Do **not** revive this first by routing scans through OpenClaw agent-turn cron jobs.

Instead:
- use direct shell cron entries calling Python scripts
- keep the agent out of the execution path
- let the agent only consume/report on outputs later

This avoids:
- token waste
- scheduler schema mismatches
- “delivery target missing” class errors
- agent/runtime overhead for deterministic scans

---

## 7.2 Step-by-step fix plan

### Step 1 — Canonicalise the DB
Decide that the only active DB is:
- `~/.openclaw/agents/marketing/workspace/intelligence/data/intelligence.db`

Everything else should be treated as legacy/noise.

### Step 2 — Rebuild requirements file
Create a real project requirements set covering:
- FastAPI
- Uvicorn
- Playwright
- requests
- supabase
- any auth libs actually used

### Step 3 — Verify Playwright/Chromium
Confirm:
- Playwright installed for the runtime user
- Chromium installed
- headless launch works with `--no-sandbox`

### Step 4 — Bring the API service back only after DB/path verification
The FastAPI service is worth reviving, but only after:
- dependencies are confirmed
- API import path works
- DB path is correct

### Step 5 — Run each scan manually first
Recommended validation order:
1. `site-health`
2. `youtube`
3. `local-rank --test-mode`
4. `local-rank --force`
5. `gsc_organic.py`
6. optional browser organic only if still desired
7. TikTok last

### Step 6 — Put scans into shell crontab
Recommended shell cron model:
- direct python calls
- explicit `cd`
- log redirection to known log files

### Step 7 — Replace browser organic with GSC organic for production
Preferred production organic path:
- keep `google_organic.py` only for occasional browser comparison/debug
- make `gsc_organic.py` the normal organic signal source

### Step 8 — Audit and trim API routers
Fix or disable endpoints that reference nonexistent tables.
Especially:
- `config.py` weekly report
- anything assuming later phases exist

### Step 9 — Revive dashboard only after API endpoints are trustworthy
The static dashboard is fine as an MVP if:
- `/api/v1/rankings/local/summary`
- `/api/v1/rankings/organic`
- `/api/v1/health/site`
- `/api/v1/scans`
all work consistently

### Step 10 — Leave product-grade dashboard work for later
Do not jump to the React/Vite rewrite until:
- scans are reliable
- service is stable
- schema/API surface is clean

---

## 7.3 Proposed crontab entries

These are the **recommended** shell-style cron entries, not current live entries.

### Local rank — weekly Monday 06:00 UTC
```bash
0 6 * * 1 cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scheduler/coordinator.py --scan local-rank --force >> logs/cron-local-rank.log 2>&1
```

### Organic rank — preferred GSC version, Monday 06:30 UTC
```bash
30 6 * * 1 cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scrapers/gsc_organic.py >> logs/cron-gsc-organic.log 2>&1
```

### YouTube — Tuesday 06:00 UTC
```bash
0 6 * * 2 cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scheduler/coordinator.py --scan youtube --force >> logs/cron-youtube.log 2>&1
```

### Site health — first of month 06:00 UTC
```bash
0 6 1 * * cd /home/ricky/.openclaw/agents/marketing/workspace/intelligence && /usr/bin/python3 scheduler/coordinator.py --scan site-health --force >> logs/cron-site-health.log 2>&1
```

### Backup — daily 03:00 UTC
```bash
0 3 * * * /home/ricky/.openclaw/agents/marketing/workspace/intelligence/scripts/backup.sh >> /home/ricky/data/backups/intelligence/backup.log 2>&1
```

### TikTok — keep disabled for now
Do not schedule until cookie/auth path is working.

---

## 8. Dashboard status — revive or rebuild?

## Short answer
**Revive lightly first. Rebuild later only if the data plane becomes stable.**

## Why
The current dashboard:
- already exists
- is simple
- can display the current Phase 1 data
- only needs the API up and core endpoints working

The React/Vite/TanStack/Leaflet product-grade dashboard in `DASHBOARD_SPEC.md` is a much bigger project and makes sense only if:
- scans are reliably running week over week
- the API is cleaned up
- this is truly being turned into a reusable product

### Recommendation
- **Revive current static dashboard** as the immediate move
- **Do not rebuild the dashboard first**
- if a future UI upgrade happens, build it against a cleaned API and only after the pipeline is trustworthy

---

## 9. Final judgement

### What this platform actually is today
It is a **half-live intelligence platform with working core components and broken operational glue**.

### What should happen next
1. keep the DB and schema
2. keep coordinator
3. keep local rank / YouTube / site health scrapers
4. prefer GSC organic over browser organic
5. ignore TikTok until auth is solved
6. stop trying to run scans via agent-turn OpenClaw cron
7. use plain crontab
8. revive API only after dependency/path cleanup
9. revive static dashboard only after API endpoints are trustworthy

### Final answer to the brief’s core question
The scrapers do **not** need the marketing agent to run them.  
They should run independently via **crontab**.

The agent should consume and interpret the outputs — not execute the collection pipeline.

---

## Sources checked

### Intelligence platform
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/README.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scheduler/coordinator.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/base.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/google_maps_local.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/google_organic.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/gsc_organic.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/youtube_rank.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/tiktok_rank.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/site_health.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/config/settings.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/config/alerts.yaml`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/database/schema.sql`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/database/db.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/utils/browser_session.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/utils/rate_limiter.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/utils/alerts.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/utils/supabase_client.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scripts/init_db.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scripts/backup.sh`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scripts/test_scraper.sh`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/main.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/db.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/requirements.txt`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/rankings.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/health.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/scans.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/agent.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/alerts.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/competitors.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/routers/config.py`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/dashboard/index.html`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/DASHBOARD_SPEC.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/openclaw-cron-jobs.json`

### Marketing docs
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/marketing-intelligence-platform-spec.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/seo-audit-feb-2026.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/KNOWLEDGE-BASE.md`

### Live status checks
- `systemctl --user status marketing-intelligence-api`
- `ls ~/.config/systemd/user/marketing-intelligence*`
- `grep -r "mi.icorrect" /etc/nginx/sites-enabled/`
- `openclaw cron list`
- SQLite table checks across:
  - `marketing.db`
  - `data/intelligence.db`
  - `data/marketing_intel.db`
  - `data/mi.db`
  - `data/scans.db`

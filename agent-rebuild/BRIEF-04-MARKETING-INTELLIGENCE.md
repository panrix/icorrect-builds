# Brief 04: Marketing Intelligence Platform Audit

**For:** Codex agent (read-only research)
**Output:** `/home/ricky/builds/agent-rebuild/marketing-intelligence-audit.md`

---

## Context

The Marketing agent built an entire intelligence platform — scrapers for Google Maps rankings, organic search positions, YouTube/TikTok rankings, site health monitoring. It has an API, a dashboard at mi.icorrect.co.uk, and a SQLite database. But it's all dead: empty database, API service stopped, SEO crons erroring. The scrapers exist as working code — they just need to run independently of the agent, via crontab.

## Task

### 1. Full platform inventory
Read everything at `~/.openclaw/agents/marketing/workspace/intelligence/`

Document:
- `README.md` — full architecture and status
- `scrapers/` — read each scraper file, document what it does, what APIs/tools it needs
- `scheduler/coordinator.py` — how does the scheduler work?
- `api/` — read main.py and routers, document endpoints
- `dashboard/` — what's the dashboard tech stack?
- `database/` — read schema files
- `config/` — what business config exists (keywords, locations, alert rules)?
- `scripts/` — init and backup scripts
- `utils/` — browser session, rate limiter, alerts

### 2. Check service status
Run:
- `systemctl --user status marketing-intelligence-api`
- `ls ~/.config/systemd/user/marketing-intelligence*`
- Check if there's an nginx config for mi.icorrect.co.uk: `grep -r "mi.icorrect" /etc/nginx/sites-enabled/ 2>/dev/null`
- Check if the database has any tables: `python3 -c "import sqlite3; db=sqlite3.connect('~/.openclaw/agents/marketing/workspace/intelligence/marketing.db'); print(db.execute('SELECT name FROM sqlite_master WHERE type=\"table\"').fetchall())"`

### 3. Check the OpenClaw crons
The original SEO crons were erroring ("delivery target missing"). Check:
- `openclaw cron list` — any marketing-related jobs?
- `~/.openclaw/agents/marketing/workspace/intelligence/openclaw-cron-jobs.json` — what was planned?

### 4. Dependency check
- Does the platform need Playwright/Chromium for the scrapers?
- What Python packages does it need? Check requirements.txt or imports
- Does it need any API keys (Google, YouTube, etc.)?
- Check `~/.openclaw/agents/marketing/workspace/intelligence/config/` for credential references

### 5. Assess what it would take to get it running
For each scraper, document:
- Can it run standalone via `python3 scraper.py`?
- What arguments/config does it need?
- What would the crontab entry look like?
- Where would output go?

### 6. Also check the marketing docs
Read key docs at `~/.openclaw/agents/marketing/workspace/docs/`:
- `marketing-intelligence-platform-spec.md` — original spec
- `seo-audit-feb-2026.md` — SEO baseline
- `KNOWLEDGE-BASE.md` — what marketing knowledge exists

## Output format

Write to `/home/ricky/builds/agent-rebuild/marketing-intelligence-audit.md` with:
1. Platform architecture summary
2. Per-scraper detail (what it does, dependencies, standalone capability)
3. Current status (what's running, what's dead, what's broken)
4. Dependency list (packages, APIs, credentials needed)
5. Fix plan — step-by-step to get each scraper running as crontab
6. Dashboard status — is it worth reviving or rebuild?

**Do NOT modify any files. Read-only research.**

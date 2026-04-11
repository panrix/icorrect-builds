# Brief: Full VPS Audit

**For:** Codex agent or any non-Opus agent
**Output:** `/home/ricky/builds/agent-rebuild/vps-audit.md`
**Date:** 2026-04-04

---

## Context

We're doing a full system rethink of our OpenClaw multi-agent setup. We need ground truth on what's actually on the VPS — what's running, what's dead, what's using resources. The master planning doc is at `builds/agent-rebuild/system-rethink.md`.

## What To Audit

### A) Infrastructure Audit

Run and document the output of:

1. **System resources**
   - `free -h` (RAM)
   - `df -h` (disk)
   - `uptime` and `nproc`
   - `du -sh /home/ricky/*/` (top-level directory sizes)
   - `du -sh /home/ricky/.openclaw/agents/*/` (per-agent workspace sizes)

2. **Running services**
   - `systemctl --user list-units --type=service --state=running`
   - `systemctl --user list-units --type=service --state=failed`
   - `systemctl --user list-units --type=service --state=inactive` (show dead services)
   - `ss -tlnp` (listening ports)
   - `ps aux --sort=-%mem | head -30` (top memory consumers)
   - `ps aux --sort=-%cpu | head -20` (top CPU consumers)

3. **Docker**
   - `docker ps -a` (any containers running? n8n?)
   - `docker images` (what's cached)

4. **Crontab**
   - `crontab -l` (full listing with comments)

5. **Nginx**
   - List all enabled sites: `ls /etc/nginx/sites-enabled/`
   - For each site, document what it proxies to (read the config)

6. **OpenClaw**
   - `openclaw health`
   - `openclaw cron list`
   - `openclaw agents list` (if that command works)

### B) Code/Scripts Audit

For each directory in `/home/ricky/builds/`:
1. What is it? (read README.md or first file)
2. Is it a git repo? (`git -C <dir> log --oneline -3` if .git exists)
3. Last modified file date
4. Does it have a package.json or requirements.txt? Any dependencies?
5. Is it referenced by a crontab entry, systemd service, or OpenClaw config?

Also check:
- `/home/ricky/mission-control/` — what state is it in?
- `/home/ricky/mission-control-v2/` — is this still referenced anywhere?
- `/home/ricky/.openclaw/hooks/` — list all hooks and what they do
- `/home/ricky/.openclaw/scripts/` — list all utility scripts

### C) Full Inventory

Create a single reference table:

| Item | Type | Location | Status | Referenced By |
|------|------|----------|--------|---------------|
| (each service, script, cron, config, data dir) | service/script/cron/config/data | path | running/dead/orphan | what uses it |

Flag anything that is:
- Running but not referenced by any config/cron (orphan process)
- Referenced by config but not actually running (broken reference)
- Using significant disk space (>100MB)
- A duplicate of something else

## Output Format

Write the full audit to `/home/ricky/builds/agent-rebuild/vps-audit.md` with clear sections for A, B, and C. Use tables where possible. Flag issues with severity (critical/high/medium/low).

Keep it factual — report what you find, don't make recommendations. The recommendations come from the system-rethink doc.

## Important

- Do NOT modify any files or configs
- Do NOT restart any services
- Do NOT delete anything
- Read-only audit. Document everything.

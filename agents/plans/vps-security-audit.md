# Plan: Fix remaining 4 tasks from VPS audit

## Context
During the VPS audit session, we identified 4 outstanding issues. Task #1 (rewrite MISSION-CONTROL-SETUP.md) is already completed. The remaining tasks fix security vulnerabilities and broken integrations discovered during the audit.

---

## Task #2: Fix SUPABASE.md with working API calls

**File:** `~/.openclaw/shared/SUPABASE.md` (on VPS via SSH)

**Problem:** The curl commands in SUPABASE.md have empty placeholders — no base URL, no apikey, no Bearer token values. Agents following these instructions get failed API calls.

**Fix:**
- Replace empty URL placeholders with `https://rydvxdoccryqtlcrrcag.supabase.co/rest/v1`
- Replace empty apikey/auth headers with instructions to source from `/home/ricky/config/supabase/.env`
- Rewrite all curl examples so they actually work by sourcing the env file first
- Test one curl command to confirm it hits Supabase and returns data

---

## Task #3: Add authentication to mi.icorrect.co.uk

**Files on VPS:**
- `~/.openclaw/agents/marketing/workspace/intelligence/api/main.py` — FastAPI app
- `/etc/nginx/sites-available/marketing-intel` — Nginx config

**Problems:**
1. SQL injection: `format(days)` used in query strings (lines with `.format(days)`)
2. CORS: `allow_origins=["*"]`
3. No authentication on any endpoint

**Fix:**
1. Replace all f-string SQL with parameterized queries (`?` placeholders with params tuple)
2. Change CORS to `allow_origins=["https://mi.icorrect.co.uk"]`
3. Add Nginx basic auth (`htpasswd`) to protect the entire mi.icorrect.co.uk site — quickest effective protection
4. Restart the marketing-intelligence-api service and reload Nginx

---

## Task #4: Fix mc.icorrect.co.uk Supabase security

**Problem:** Supabase RLS policies are "allow all" and the anon key is in client-side JS. Anyone can read/write/delete all data.

**Fix:**
- Add Nginx basic auth to mc.icorrect.co.uk as immediate protection (same approach as mi.icorrect.co.uk)
- This gates all access behind a password, making the open RLS and exposed anon key non-exploitable from the public internet
- Note: Proper RLS policy fixes require Supabase dashboard access (SQL editor) which is beyond what we can do via SSH. The Nginx auth is the pragmatic fix.

---

## Task #5: Move backups off /tmp

**File:** `~/.openclaw/agents/marketing/workspace/intelligence/scripts/backup.sh`

**Problem:** Backups write to `/tmp/intelligence-backups/` which is cleared on reboot.

**Fix:**
- Change BACKUP_DIR from `/tmp/intelligence-backups` to `/home/ricky/data/backups/intelligence`
- Create the directory
- Remove the rclone lines (not configured) and the cloud retention lines
- Keep the 30-day local retention
- Verify the cron job runs correctly with the new path

---

## Execution order
All tasks are independent. Execute sequentially via SSH:
1. Task #2 — Fix SUPABASE.md
2. Task #3 — Secure mi.icorrect.co.uk (SQL injection + Nginx auth)
3. Task #4 — Secure mc.icorrect.co.uk (Nginx auth)
4. Task #5 — Fix backup path

## Verification
- Task #2: `ssh ricky@46.225.53.159` then run one of the fixed curl commands to confirm Supabase responds
- Task #3: `curl -I https://mi.icorrect.co.uk` should return 401 (auth required). Test API with correct credentials.
- Task #4: `curl -I https://mc.icorrect.co.uk` should return 401
- Task #5: Run backup script manually, confirm file appears in `/home/ricky/data/backups/intelligence/`

# Auto-Trigger QA Agents via Git + Supabase

**Status:** Plan — audited by Claude Code, fixes incorporated, ready for implementation
**Author:** Claude Code (Opus 4.6) + Ricky
**Date:** 2026-02-20
**QA Review:** Pass with fixes (all incorporated below)
**Audit:** 2026-02-20 — 5 critical fixes, 2 design fixes, 4 minor fixes applied
**Scope:** Wire up dormant QA agents (qa-code, qa-plan, qa-data) so they automatically review agent work via git commits, with Supabase tracking the full review cycle.

---

## Background

### What exists today

**VPS:** Hetzner CPX42 (8 vCPU, 16GB RAM) at 46.225.53.159, user `ricky`.

**OpenClaw Gateway:** v2026.2.17, systemd user service, runs 12 agents (11 Telegram + 1 Slack). Config at `~/.openclaw/openclaw.json`. Max 6 concurrent sessions.

**Agent workspaces:** `~/.openclaw/agents/{agent_id}/workspace/` — each has SOUL.md, CLAUDE.md, USER.md, foundation/ (symlink to shared docs), docs/, memory/.

**Shared foundation docs:** `~/.openclaw/shared/` (COMPANY.md, TEAM.md, GOALS.md, etc.) — read-only (chmod 444), symlinked into every agent workspace.

**Active agents:**

| Agent ID | Model | Role |
|----------|-------|------|
| main (Jarvis) | Opus 4.6 | Coordinator, briefings, cross-agent routing |
| schedule | Sonnet 4.6 | Calendar, time management (status: verify if active or retired) |
| team | Sonnet 4.6 | People, hiring, performance |
| backmarket | Sonnet 4.6 | Back Market sales, trade-ins, API |
| systems | Haiku 4.5 | Infrastructure, n8n, APIs |
| website | Sonnet 4.6 | Shopify, conversion, PostHog |
| operations | Sonnet 4.6 | Workshop ops + finance (Xero, HMRC, KPIs) |
| parts | Sonnet 4.6 | Inventory, stock, Monday boards |
| customer-service | Sonnet 4.6 | Intercom/Finn AI chatbot |
| marketing | Sonnet 4.6 | Marketing, content, growth |
| pm | Sonnet 4.6 | Workflow orchestrator (currently dormant) |
| slack-jarvis | Sonnet 4.6 | Slack workspace integration |
| qa-code | (dormant) | Code reviewer |
| qa-plan | (dormant) | Strategy reviewer |
| qa-data | (dormant) | Fact verifier |

**QA agents have SOUL.md with full review checklists but nothing triggers them.**

**Supabase database** (9 tables): work_items, agent_registry, agent_activity, agent_heartbeats, agent_messages, agent_memory, business_state, work_item_history, workflow_templates.

**Webhook pipeline (LIVE):** Supabase pg_net triggers on `work_items` INSERT/UPDATE + `agent_messages` INSERT → FastAPI receiver on port 8002 (systemd service `agent-trigger`) → Telegram notifications. File: `/home/ricky/mission-control-v2/scripts/webhooks/agent-trigger.py`.

**`sessions_spawn`** recently enabled for cross-agent communication (agents can spawn other agents within OpenClaw).

**Mission Control dashboard:** `mc.icorrect.co.uk` — React app with Kanban, Health, Activity, Briefings, KPIs tabs.

**Agent workspaces are NOT currently git repos.** No version control on agent output.

---

## Problem

QA agents exist but are completely inert. There's no mechanism to:
1. Detect when an agent has finished work
2. Trigger a QA review
3. Track review outcomes
4. Feed QA findings back to the agent
5. Enforce quality gates before work is "done"

---

## Design Principles

**Separation of concerns:**
- **Supabase** = knowledge layer (facts, decisions, metrics, processes)
- **Git** = artifact layer (plans, research, code, reports — versioned, reviewable)
- **QA reviews artifacts** (git diffs), **informed by knowledge** (Supabase), **verdicts tracked in** Supabase

**Git as the trigger:** Agents produce artifacts. Artifacts go to git. Git commits trigger QA. This is natural — the commit is the agent saying "I'm done, review this."

---

## The Full QA Cycle

```
Jarvis assigns work_item to agent (includes work_item UUID in message)
       |
Agent creates branch: wi/{uuid} from main
Agent works -> commits to branch
       |
Agent finishes -> commits
       |
Git post-commit hook fires
       |
Hook validates UUID format, checks kill switch
Hook updates work_item in Supabase -> status: "in_review"
Hook attaches commit SHA + branch name to work_item
Hook logs success/failure to hook.log
       |
Supabase trigger fires -> webhook (port 8002)
       |
Webhook checks: is work_item already in_review with active QA? (dedup)
Webhook checks: is gateway at maxConcurrent? (capacity)
If blocked -> work_item stays in_review, qa-retry cron picks it up
If clear -> spawns QA agent (via OpenClaw CLI or gateway API)
       |
QA agent reads:
  - git diff main..wi/{uuid} in source agent's workspace (path passed in spawn payload)
  - Work item context from Supabase (what was requested)
  - Review checklist from SOUL.md
       |
+--- APPROVE -------------------+    +--- REJECT ----------------------+
| QA writes verdict to          |    | QA writes verdict + findings to  |
|   qa_reviews table            |    |   qa_reviews table               |
| Updates work_item -> "approved"|    | Updates work_item ->             |
| Git: merge wi/{uuid} -> main  |    |   "revision_needed"              |
| Git: delete branch            |    | Increments rejection_count       |
| Notify: to agent group        |    | sessions_send feedback to agent  |
| Done.                         |    | Notify: to agent group + DM     |
+-------------------------------+    | Agent fixes ON BRANCH ->         |
                                     |   re-commits -> hook fires again  |
                                     | Cycle repeats (max 3 rejections) |
                                     | After 3 -> status: "escalated"   |
                                     |   -> alert Ricky DM directly     |
                                     +----------------------------------+
```

**Why branching is essential:**
- `main` only contains QA-approved work — always clean
- Each task is isolated — reject one without affecting others
- QA reviews the full branch diff against main (clear scope)
- Multiple tasks can be in flight simultaneously without tangling
- Git history shows the full review cycle per task

**Merge conflict policy:** Each agent works in its own repo (domain isolation), so cross-repo conflicts are impossible. Within the same repo (e.g. operations sub-agents), if a merge to main conflicts, escalate to Ricky/Jarvis — QA agents don't resolve merge conflicts.

---

## Kill Switch

**File:** `/home/ricky/config/qa/.env` (separate from api-keys/.env which is read-only)

```bash
QA_HOOKS_ENABLED=true
```

The post-commit hook checks this first. Set to `false` to disable all QA triggers instantly across all agents while debugging. One command to kill:

```bash
sed -i 's/QA_HOOKS_ENABLED=true/QA_HOOKS_ENABLED=false/' /home/ricky/config/qa/.env
```

One command to re-enable:

```bash
sed -i 's/QA_HOOKS_ENABLED=false/QA_HOOKS_ENABLED=true/' /home/ricky/config/qa/.env
```

---

## Implementation Steps

### Step 1: Explore QA spawn mechanism

Before building anything, determine how the webhook (external Python process) can spawn QA agents (internal OpenClaw sessions).

**Investigation order:**
1. `openclaw --help` / `openclaw session --help` — CLI session spawning
2. Gateway source code — WebSocket message format
3. `curl` gateway HTTP endpoints — REST API
4. Document what works

**Files to explore:**
- `which openclaw` / `which openclaw-gateway`
- Gateway source: follow binary path from systemd service file
- `/home/ricky/.openclaw/extensions/`

**This step blocks Steps 4 and 5** — the spawn mechanism determines how hooks and webhooks trigger QA.

**Spawn payload must include** (per QA review):
- `agent_id` — which QA agent to spawn (qa-code, qa-plan, qa-data)
- `work_item_id` — the work item UUID
- `commit_sha` — the commit to review
- `workspace_path` — full path to the reviewed agent's workspace (e.g. `~/.openclaw/agents/operations/workspace/`) so QA knows where to run `git diff`

---

### Step 2: Initialise agent workspaces as git repos with GitHub remote

#### 2a. Create GitHub repos

Create GitHub organisation `icorrect-agents` with private repos for agents that produce artifacts:

**Confirm with Ricky:** Is `schedule` still active? If retired, remove from list below. Current count assumes 9 or 10 repos.

```
icorrect-agents/jarvis
icorrect-agents/operations
icorrect-agents/backmarket
icorrect-agents/customer-service
icorrect-agents/marketing
icorrect-agents/systems
icorrect-agents/parts
icorrect-agents/team
icorrect-agents/website
icorrect-agents/slack-jarvis
icorrect-agents/schedule          # ONLY if still active — verify first
```

QA agents (qa-code, qa-plan, qa-data) don't produce artifacts — they review others' work. No repos for them. PM is being retired — no repo.

SSH key on VPS for push access.

**No GitHub branch protection.** Instead, enforce locally:
- Post-commit hook only processes `wi/` branches (ignores main)
- Pre-commit hook on `main` blocks direct commits
- GitHub is backup/mirror only — no PRs, no approval flows on GitHub

This avoids the GitHub auth complexity of automated merges vs branch protection.

#### 2b. Initialise local repos

For each of the **10 agent workspaces** (`~/.openclaw/agents/{id}/workspace/`):

```bash
cd ~/.openclaw/agents/{id}/workspace
git init
git checkout -b main
# .gitignore — comprehensive, audited per workspace
cat > .gitignore << 'EOF'
# OpenClaw internals
.openclaw/
.pi/

# Shared foundation (symlinked, not owned by this repo)
foundation/

# Memory (synced to Supabase separately)
memory/

# Secrets — NEVER commit
.env
.env.*

# Temp / OS
*.tmp
*.bak
.DS_Store

# Language runtimes
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Logs
*.log

# Databases
*.sqlite
*.sqlite3
EOF
git add -A
git commit -m "Initial workspace snapshot"
git remote add origin git@github.com:icorrect-agents/{id}.git
git push -u origin main
```

**Pre-step:** Audit each workspace's contents before `git add -A`. Ensure no sensitive files, large binaries, or temp files are staged. Memory files (`memory/*.md`) are excluded — already synced to Supabase separately.

**Pre-commit hook on main** (`~/.openclaw/agents/{id}/workspace/.git/hooks/pre-commit`):
```bash
#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" ]]; then
  echo "ERROR: Direct commits to main are blocked. Use a wi/{uuid} branch."
  exit 1
fi
```

#### 2c. Branch strategy

- `main` = protected locally. Only QA-approved work merged here. Agents NEVER commit directly to main.
- `wi/{uuid}` = per-task branches. Created when agent starts a work item.
- On QA approval: merge `wi/{uuid}` to main, push, delete branch (local + remote).
- On QA rejection: agent fixes on same branch, re-commits, pushes.
- Post-commit hook pushes branch to GitHub automatically.

#### 2d. Rollout strategy

**Do NOT deploy to all 10 agents at once.** Roll out to `operations` first (most active, Sonnet 4.6). Verify it follows the branching model correctly — creates the right branch name, commits properly, hook fires. Then deploy to remaining 9.

#### 2e. Execution log (2026-02-20)

**Status:** In progress (local setup complete, GitHub org creation pending)

Completed:
- Target list finalised at 10 repos (schedule excluded; `schedule-archived` exists, active `schedule` workspace not present).
- Local git repos initialised/normalised for:
  - `main` (mapped to repo `jarvis`)
  - `operations`
  - `backmarket`
  - `customer-service`
  - `marketing`
  - `systems`
  - `parts`
  - `team`
  - `website`
  - `slack-jarvis`
- Branches normalised to `main` across all 10.
- `.gitignore` created in all 10 workspaces (includes `.env*`, runtime caches, logs, sqlite, and `*.db`).
- Initial snapshot commits created where repos were uncommitted.
- `pre-commit` hook installed + `chmod +x` in all 10 to block direct commits on `main`.
- `origin` remote configured in all 10 to `git@github.com:icorrect-agents/{repo}.git` (with `main` -> `jarvis` mapping).

Blocked/pending:
- GitHub org `icorrect-agents` does not currently exist.
- `gh repo create icorrect-agents/{repo}` returns `HTTP 404: Not Found (https://api.github.com/users/icorrect-agents)` for all target repos.
- Until org exists, initial `git push -u origin main` cannot complete.

---

### Step 3: Create `qa_reviews` table + schema changes in Supabase

#### 3a. New table

```sql
CREATE TABLE qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id),
  reviewer_agent TEXT NOT NULL,
  commit_sha TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('approved', 'rejected')),
  findings JSONB DEFAULT '[]',
  feedback TEXT,
  review_number INTEGER DEFAULT 1,
  reviewed_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qa_reviews_work_item ON qa_reviews(work_item_id);
CREATE INDEX idx_qa_reviews_verdict ON qa_reviews(verdict);
CREATE INDEX idx_qa_reviews_reviewer ON qa_reviews(reviewer_agent);

ALTER TABLE qa_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON qa_reviews
  FOR ALL USING (true) WITH CHECK (true);
```

**Findings JSONB format:**
```json
[
  {
    "severity": "high",
    "location": "docs/q1-report.md:42",
    "description": "Revenue figure contradicts Xero data",
    "suggested_fix": "Verify against Xero P&L for Q1 2026"
  }
]
```

Add pg_net trigger on `qa_reviews` INSERT for webhook notifications.

#### 3b. Add columns to work_items

```sql
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS commit_sha TEXT;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS reviewed_by TEXT DEFAULT 'qa-plan';
```

**`rejection_count`**: Incremented by QA agent on each rejection. Used by webhook to detect 3rd rejection → escalation.
**`reviewed_by`**: Which QA agent reviews this work item. Defaults to `qa-plan`. Set by Jarvis when assigning tasks that need code review (`qa-code`) or fact-checking (`qa-data`).

#### 3c. Add `escalated` status

Ensure `work_items.status` accepts `escalated` as a value (for 3rd-rejection escalation). Check existing CHECK constraint or enum — add if needed.

---

### Step 4: Install git hooks in agent workspaces

#### 4a. Post-commit hook

**File per agent:** `~/.openclaw/agents/{id}/workspace/.git/hooks/post-commit`

```bash
#!/bin/bash
# Post-commit hook — triggers QA review on wi/ branches
LOG="$(git rev-parse --git-dir)/hooks/hook.log"

# Kill switch check
source /home/ricky/config/qa/.env 2>/dev/null
if [[ "$QA_HOOKS_ENABLED" != "true" ]]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) QA hooks disabled, skipping" >> "$LOG"
  exit 0
fi

COMMIT_SHA=$(git rev-parse HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
AGENT_ID="__AGENT_ID__"  # replaced per agent

# Only trigger QA on wi/ branches
if [[ "$BRANCH" != wi/* ]]; then
  exit 0
fi

# Extract work_item ID from branch name (wi/{uuid})
WI_UUID="${BRANCH#wi/}"

# Validate UUID format (security: prevents injection in curl URL)
if [[ ! "$WI_UUID" =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Invalid UUID in branch name: $WI_UUID" >> "$LOG"
  exit 0
fi

# Source Supabase credentials
source /home/ricky/config/supabase/.env

# Update work_item status in Supabase (5s timeout — don't block commits if Supabase is slow)
RESPONSE=$(curl -s --max-time 5 -w "\n%{http_code}" -X PATCH \
  "${SUPABASE_URL}/rest/v1/work_items?id=eq.${WI_UUID}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"in_review\", \"commit_sha\": \"${COMMIT_SHA}\", \"branch\": \"${BRANCH}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "204" ]]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ERROR: Supabase PATCH failed (HTTP $HTTP_CODE) for WI $WI_UUID" >> "$LOG"
else
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) OK: WI $WI_UUID -> in_review (commit $COMMIT_SHA)" >> "$LOG"
fi

# Push branch to GitHub (background — don't block commit, but log errors)
git push origin "$BRANCH" >> "$LOG" 2>&1 &

# NOTE: QA spawning is handled by the webhook pipeline (Supabase trigger → agent-trigger.py → spawn QA).
# The hook's job is only to update the work_item status; the webhook handles the rest.
```

**Error handling:** Logs success/failure to `hook.log` in the hooks directory. Curl has a 5-second timeout to avoid blocking commits. GitHub push errors are logged (not suppressed). If Supabase curl fails, the work item stays in old status — the qa-retry cron (Step 5b) will detect and alert.

#### 4b. Pre-commit hook on main

**File per agent:** `~/.openclaw/agents/{id}/workspace/.git/hooks/pre-commit`

```bash
#!/bin/bash
# Block direct commits to main — enforces wi/ branch workflow
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" ]]; then
  echo "ERROR: Direct commits to main are blocked. Use a wi/{uuid} branch."
  exit 1
fi
```

Install both hooks to all 10 agent workspaces via loop. `chmod +x`.

**Depends on:** Step 1 (spawn mechanism), Step 2 (git repos exist), Step 3 (Supabase columns exist).

---

### Step 5: Extend webhook + add QA retry cron

#### 5a. Webhook changes

**File:** `/home/ricky/mission-control-v2/scripts/webhooks/agent-trigger.py`

**Changes to `in_review` handler:**

1. **Dedup check:** Before spawning QA, query `qa_reviews` for any review of this work_item with no verdict yet (or check if a QA session is active). If QA is already reviewing, skip — the current review covers the latest commit because QA diffs the full branch against main.
2. **Capacity check:** Check current active session count against maxConcurrent (6). If at capacity, log and skip — the qa-retry cron will pick it up.
3. If clear to spawn, determine QA agent from `reviewed_by` field (default: `qa-plan`).
4. Spawn QA agent via mechanism from Step 1, passing full payload:
   - `agent_id`: which QA agent
   - `work_item_id`: the UUID
   - `commit_sha`: the commit to review
   - `workspace_path`: full path to reviewed agent's workspace (e.g. `/home/ricky/.openclaw/agents/operations/workspace/`)

**New endpoint:** `POST /api/webhook/qa-reviews` for pg_net trigger on `qa_reviews` INSERT:

1. **On approval:** Telegram to the reviewed agent's group only (low noise):
   `QA APPROVED: {title} (round {review_number})`
2. **On rejection (round < 3):** Telegram to Ricky DM (via Jarvis) AND agent's group:
   `QA REJECTED: {title} (round {review_number}/3) | Agent: {reviewed_agent} | Reviewer: {reviewer_agent} | Top finding: {summary}`
3. **On 3rd rejection (escalation):** Update work_item status to `escalated`. HIGH PRIORITY Telegram directly to Ricky DM:
   `QA ESCALATION: {title} failed review 3 times | All findings: {details} | Needs your decision.`

**Post-escalation:** Work item sits in `escalated` status until Ricky intervenes manually.

#### 5b. QA retry cron

**Single cron**, runs every 5 minutes. Handles both failure modes:
- QA agent crashed mid-review (work_item stuck in `in_review` with no active QA session)
- QA spawn skipped due to maxConcurrent (work_item in `in_review`, never spawned)

Logic:
1. Query `work_items` where `status = 'in_review'` and `updated_at < now() - interval '10 minutes'`
2. For each: check if a QA session is active for this work_item
3. If no active session: re-trigger QA spawn (same logic as webhook)
4. If still can't spawn (capacity): log, try again next cycle
5. If stuck for >30 min: alert Ricky via Telegram

**Depends on:** Step 1 (spawn mechanism), Step 3 (qa_reviews trigger exists).

---

### Step 6: Add QA section to Jarvis daily briefing

**File:** `~/.openclaw/agents/main/workspace/CLAUDE.md` (Section 9: Daily Briefing Spec)

Add to briefing template:
```
6. QA Summary (previous 24 hours):
   - Items reviewed: count
   - Pass rate: approved / total (%)
   - Rejections: count, which agents, which QA reviewer
   - Escalations: any items at 3 rejections (status: escalated)
   - Trends: pass rate improving/declining vs prior week
```

Jarvis queries `qa_reviews` table at briefing time.

---

### Step 7: Update QA agent CLAUDE.md files with review cycle

**Files:** `~/.openclaw/agents/{qa-code,qa-plan,qa-data}/workspace/CLAUDE.md`

Add review process:
1. **On activation for review:** Read spawn payload → get `workspace_path` and `commit_sha` → `cd {workspace_path} && git diff main..wi/{uuid}` to see the full branch diff
2. **After review:** Write verdict to `qa_reviews` via Supabase REST API (curl)
3. **If APPROVE:** Update work_item status → `approved`. Merge branch: `cd {workspace_path} && git checkout main && git merge wi/{uuid} && git push origin main && git branch -d wi/{uuid} && git push origin --delete wi/{uuid}`. **If merge fails (conflict):** abort the merge (`git merge --abort`), update work_item status → `escalated`, alert Ricky via Jarvis. Do NOT leave the workspace in a dirty merge state.
4. **If REJECT:** Update work_item status → `revision_needed`, increment `rejection_count`. Deliver feedback via TWO channels (agent session may have ended):
   - `sessions_send` to original agent (works if session is still alive)
   - Write findings to `agent_messages` table in Supabase (bootstrap hook injects unread messages on next session start — this ensures feedback is never lost)
5. **If rejection_count >= 3:** Update work_item status → `escalated`. Escalate to Jarvis via `sessions_send` — Jarvis sends HIGH PRIORITY alert to Ricky

---

### Step 8: Update domain agent CLAUDE.md files with git discipline

**Files:** All 10 active agent CLAUDE.md files (the ones with git repos)

Add "Git Workflow" section:

```markdown
## Git Workflow

Your workspace is a git repo. `main` branch is protected — only QA-approved work gets merged there.

### Starting a task
1. You receive a work_item assignment (via sessions_send or Ricky). The message includes the work_item UUID.
2. Create a task branch: `git checkout -b wi/{work_item_uuid}` (use the exact UUID from the assignment)
3. Do your work on this branch

### Submitting for review
1. Stage and commit your changes: `git add -A && git commit -m "Brief description of what you did"`
2. The post-commit hook automatically updates the work_item to `in_review` and triggers QA
3. Wait for QA verdict (you'll receive it via sessions_send)

### Handling QA feedback
1. If APPROVED: QA merges your branch to main. You're done.
2. If REJECTED: You'll receive findings via sessions_send (if your session is active) AND via agent_messages (injected at next session start via bootstrap hook). Read the findings carefully. Fix the issues ON THE SAME BRANCH.
3. Commit the fixes: `git add -A && git commit -m "Fixed: [what you fixed]"`
4. Hook fires again -> QA re-reviews automatically
5. Max 3 review rounds. After that, escalation to Ricky.

### Rules
- NEVER commit directly to main (blocked by pre-commit hook)
- NEVER force-push or rewrite history
- One branch per work item
- Commit messages should be descriptive — QA reads them
- Branch name MUST be wi/{uuid} — the hook extracts the work item ID from it
```

**Also update Jarvis CLAUDE.md:** When assigning work items via `sessions_send`, always include the work_item UUID in the message so the agent knows what branch name to create.

#### Rollout

Deploy to `operations` first. Verify the agent:
1. Creates the correct `wi/{uuid}` branch
2. Commits on the branch (not main)
3. Hook fires and Supabase updates correctly
4. QA triggers and reviews

Then deploy to remaining 9 agents.

---

### Step 9: Decide PM agent's fate

**Current state:** PM has no trigger mechanism and does nothing.

**Recommendation:** Retire PM. The webhook + git hooks + qa-retry cron handle QA orchestration (PM's designed purpose). SLA monitoring can be a cron script.

- Set PM status to `disabled` in Supabase `agent_registry`
- Remove or leave dormant PM binding in openclaw.json
- Document in shared foundation docs

**Decision deferred to Ricky.**

---

### Step 10: End-to-end verification

1. **Create test work_item** in Supabase with `reviewed_by: "qa-plan"` and a known UUID
2. **In operations workspace:** `git checkout -b wi/{uuid}` → create a test file → `git add -A && git commit -m "Test document"`
3. **Verify hook:** Check `hook.log` for success entry. Check Supabase: work_item status = `in_review`, commit_sha populated.
4. **Verify webhook:** Check agent-trigger logs for QA spawn attempt.
5. **Verify QA:** QA agent spawns, reads diff, writes verdict to `qa_reviews`, updates work_item status.
6. **Test rejection cycle:** Force a rejection → confirm agent receives feedback via `sessions_send` → agent re-commits on same branch → hook fires again → QA re-reviews.
7. **Test escalation:** Force 3 rejections → confirm work_item status = `escalated` → confirm Ricky gets HIGH PRIORITY Telegram.
8. **Test kill switch:** Set `QA_HOOKS_ENABLED=false` → commit → verify hook exits immediately (check `hook.log`).
9. **Test retry cron:** Kill a QA session mid-review → wait 5 min → verify cron re-triggers QA.
10. **Check dashboard:** `qa_reviews` data in Supabase for future Mission Control integration.

---

## Dependency Graph

```
Step 1 (explore spawn mechanism)
  |
  +---> Step 4 (git hooks)
  |       |
  +---> Step 5 (webhook + retry cron)
  |       |
  |       +---> Step 6 (briefing update)
  |       +---> Step 7 (QA CLAUDE.md)
  |
Step 2 (git repos) ---+---> Step 4
                       |
Step 3 (Supabase)  ---+---> Step 4, Step 5
                       |
Step 8 (agent CLAUDE.md) --- can run after Step 2

Step 9 (PM retirement) --- depends on everything else

Step 10 (verification) --- last
```

Steps 2 and 3 can run in parallel. Steps 6, 7, 8 can run in parallel after Steps 4-5.

---

## Files Modified

| File | Change Type | Description |
|------|------------|-------------|
| `/home/ricky/config/qa/.env` | NEW | Kill switch (`QA_HOOKS_ENABLED=true`) |
| `~/.openclaw/agents/*/workspace/.git/hooks/post-commit` | NEW | Git hook triggers QA via Supabase + spawn |
| `~/.openclaw/agents/*/workspace/.git/hooks/pre-commit` | NEW | Blocks direct commits to main |
| `~/.openclaw/agents/*/workspace/.gitignore` | NEW | Exclude .openclaw/, .pi/, foundation/, memory/, tmp |
| `/home/ricky/mission-control-v2/scripts/webhooks/agent-trigger.py` | MODIFY | Extend in_review handler (dedup + capacity), add qa-reviews endpoint |
| `/home/ricky/mission-control-v2/scripts/supabase/setup-schema.sql` | MODIFY | Add qa_reviews table + trigger, add escalated status |
| `/home/ricky/mission-control-v2/scripts/cron/qa-retry.py` | NEW | Retry stuck QA reviews every 5 min |
| `~/.openclaw/agents/qa-code/workspace/CLAUDE.md` | MODIFY | Review cycle: read diff from workspace_path, write verdict, merge on approve |
| `~/.openclaw/agents/qa-plan/workspace/CLAUDE.md` | MODIFY | Same |
| `~/.openclaw/agents/qa-data/workspace/CLAUDE.md` | MODIFY | Same |
| `~/.openclaw/agents/main/workspace/CLAUDE.md` | MODIFY | QA briefing section + include UUID in work_item assignments |
| All 10 active agent CLAUDE.md files | MODIFY | Add git workflow discipline section |

---

## Risks & Open Questions

1. **QA spawn mechanism (Step 1):** We don't yet know how external Python can spawn OpenClaw sessions. Biggest unknown, blocks core implementation.

2. **Agent git literacy (mitigated):** Agents have never used git. Rolling out to operations first before the other 9.

3. **Merge conflicts (mitigated):** Domain isolation (separate repos) prevents cross-agent conflicts. Same-repo conflicts escalate to Ricky/Jarvis.

4. **Gateway capacity (mitigated but needs attention):** maxConcurrent=6. Webhook checks capacity before spawning. qa-retry cron handles overflow. **Risk: if all 6 slots are consistently occupied by regular agents, QA can never spawn.** Recommendation: bump maxConcurrent to 8 (VPS has 8 vCPU/16GB, can handle it) or reserve 2 slots for QA. Decision deferred to Ricky during rollout — monitor actual utilisation first.

5. **QA agent workspace access:** QA agents need read access to other agents' workspaces to run `git diff`. Currently unrestricted on VPS but documented.

---

## Compromises / Deferred

- **Mission Control dashboard integration:** qa_reviews data in Supabase but no UI — future MC enhancement.
- **PM retirement:** Recommended, deferred to Ricky's decision.
- **Granular RLS policies:** Using "allow all" for qa_reviews for now. Should be tightened once the system is stable.
- **GitHub branch protection:** Skipped intentionally — local hooks enforce the rules, GitHub is backup only.
- **maxConcurrent capacity:** Current 6 slots may starve QA. Monitor during rollout; may need to bump to 8.
- **Schedule agent status:** Needs confirmation — may reduce repo count from 10 to 9.

---

## QA Review Results

All 10 checklist items addressed. 6 additional issues found and resolved in initial QA:

| Finding | Resolution |
|---------|-----------|
| Race conditions (rapid commits, overlapping reviews) | Webhook dedup check: skip spawn if work_item already `in_review` with active QA |
| Missing failure modes (hook fails, QA crashes, webhook down) | Hook error logging to hook.log + qa-retry cron every 5 min |
| Branch protection conflicts with automated merges | Skip GitHub branch protection; enforce locally with pre-commit hook |
| Post-escalation state undefined | Added `escalated` status to work_items |
| UUID injection in hook curl | Regex validation before use |
| maxConcurrent ceiling risk | Webhook capacity check + qa-retry cron for overflow |
| Agents don't know git yet | Rollout to operations first, then remaining 9 |
| Work item UUID handoff unclear | Explicit in agent CLAUDE.md: UUID comes from assignment message; Jarvis must include it |
| Merge conflicts on main | Domain isolation (separate repos); conflicts escalate to Ricky |
| 14 repos overkill | Reduced to 10 (artifact-producing agents only) |
| `git add -A` dangerous | Comprehensive .gitignore; memory/ excluded; audit workspaces pre-rollout |
| No rollback plan | Kill switch in /home/ricky/config/qa/.env |
| Kill switch in read-only file | Moved to separate /home/ricky/config/qa/.env |
| QA needs source workspace path | Spawn payload explicitly includes workspace_path |
| Stale review + capacity retry = same cron | Single qa-retry cron every 5 min handles both |

---

## Claude Code Audit Results (2026-02-20)

11 issues found. 5 critical, 2 design, 4 minor. All fixed in-place above.

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | Missing `rejection_count` column on work_items | Critical | Added to Step 3b |
| 2 | Missing `reviewed_by` column on work_items | Critical | Added to Step 3b with default `qa-plan` |
| 3 | Incomplete .gitignore (missing .env, node_modules, __pycache__, *.log) | Critical | Expanded .gitignore in Step 2b |
| 4 | GitHub push errors silently suppressed (`2>/dev/null &`) | Critical | Changed to log errors to hook.log |
| 5 | No curl timeout in hook (could block commits indefinitely) | Critical | Added `--max-time 5` |
| 6 | QA feedback lost if agent session ended before verdict | Design | Dual delivery: sessions_send + agent_messages table (bootstrap hook injects on next start) |
| 7 | maxConcurrent=6 could starve QA agents permanently | Design | Documented risk; recommend bumping to 8 during rollout |
| 8 | Schedule agent listed as active but may be retired | Minor | Flagged for confirmation; repo list conditional |
| 9 | QA merge failure could leave workspace in dirty merge state | Minor | Added `git merge --abort` + escalation on conflict |
| 10 | `git add -A` in agent instructions risky even with .gitignore | Minor | Mitigated by comprehensive .gitignore (issue #3) |
| 11 | Redundant `__QA_SPAWN_COMMAND__` placeholder in hook | Minor | Replaced with comment explaining webhook handles spawning |

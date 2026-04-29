# OpenClaw Fleet Recovery Runbook
Purpose: restore the iCorrect / Panrix Limited OpenClaw multi-agent fleet on this VPS to a known-good state after the VPS rebuilt itself or was destroyed mid-rebuild.
Primary remote operator: Ricky.
Operator timezone reference: Bali, UTC+8.
Operational baseline date for this runbook: 2026-04-29.
Core environment facts:
- Gateway service: `openclaw-gateway` via `systemctl --user`
- Gateway config: `~/.openclaw/openclaw.json`
- OpenClaw cron config: `~/.openclaw/cron/jobs.json`
- System cron source: `crontab -l`
- Claude OAuth file: `~/.claude/.credentials.json` with mode `0600`
- Token sync job: `~/.openclaw/scripts/sync-token.sh` every 15 minutes
- gstack repo: `~/.claude/skills/gstack/`
- Native gstack skill links: `~/.openclaw/skills/gstack-openclaw-*`
- Codex CLI: `/home/ricky/.npm-global/bin/codex`
Phase 0 backup artefacts already known to exist:
- `~/.openclaw/openclaw.json.pre-rebuild-2026-04-29`
- `~/.openclaw/cron/jobs.json.pre-rebuild-2026-04-29`
- `~/.openclaw/agents-archive-2026-04-29/*.tar.gz`
Supabase tables relevant to recovery triage:
- `agent_registry`
- `agent_activity`
- `agent_heartbeats`
- `work_items`
- `agent_messages`
- `memory_facts`
- `memory_summaries`
- `business_state`
- `audit_snapshots`
Target active roster after recovery:
1. `main`
2. `operations`
3. `marketing`
4. `team`
5. `alex-cs`
6. `arlo-website`
7. `backmarket`
8. `diagnostics`
9. `parts`
Mission Control v2 is decommissioned.
Ignore it.
Every mutating command in this runbook is intentionally separated from read-only checks.
Do not run a mutating command until the preceding evidence says it is warranted.
## 1. Scope and assumptions
This runbook covers the failure mode where the VPS rebuilt itself or the VPS was destroyed while an OpenClaw rebuild was in progress, leaving the fleet in an unknown mixture of old state, new state, missing state, or partial auth state.
This runbook covers:
- host reachability confirmation
- `systemctl --user` viability
- OpenClaw config restore from known snapshots
- cron recovery for the Claude token sync path
- gstack repo and native skill symlink recovery
- Claude OAuth sanity checks
- OpenClaw gateway restart and log inspection
- agent roster verification
- Telegram route verification
- Supabase registry reconciliation
- ACP smoke testing from `main`
This runbook does not cover:
- Mission Control v2
- redesigning the fleet
- broad secret rotation
- rewriting prompts from scratch
- schema redesign
- restoring unrelated apps on the same VPS
- bulk Supabase repairs beyond the archived-agent registry correction described here
Assumptions:
- The operator has shell access as `ricky` or an equivalent owner of the OpenClaw paths.
- `systemd --user` is still the service manager for the gateway.
- The intended config paths have not changed from the paths listed above.
- Claude Max OAuth is still the correct auth mode for Claude-dependent work.
- Telegram bot tokens still belong in `openclaw.json` under `channels.telegram.accounts.<id>.token`.
- Supabase is used as an evidence source first, not a place to improvise repairs.
- Ricky may be operating from UTC+8, but system logs and shell timestamps may be UTC; always write down absolute timestamps.
Known-good state for this document means all of the following are true:
- the VPS is reachable
- `systemctl --user` works
- `~/.openclaw/` exists and contains valid config
- `~/.claude/.credentials.json` exists and is mode `0600`
- `crontab -l` contains the `sync-token.sh` line
- `openclaw-gateway` is active and not looping
- `openclaw agents list` shows the expected nine active agents
- Telegram `/ping` works on every bound route
- `agent_registry` reflects the intended active and archived counts
- an ACP spawn from `main` returns `ACP_RECOVERED_OK` within 60 seconds
Operator posture:
- gather read-only evidence first
- use the newest verified known-good snapshot, not the newest file by default
- preserve any current live file before overwriting it
- do not remove evidence from a failed rebuild until the fleet is stable
- do not assume 10 archive tarballs means 10 archived registry rows
- stop when evidence conflicts instead of guessing
Trust order for evidence:
1. current on-disk files on the VPS
2. named `*.pre-rebuild-2026-04-29` snapshots
3. newer `*.last-good*` snapshots, if any exist and are known-good
4. Git history
5. Supabase registry and heartbeat state
6. gateway logs
7. Telegram live behavior
Important discrepancy to remember throughout recovery:
- the archive directory contains 10 tarballs
- the post-restore target in Supabase is 9 active plus 9 archived
- one historical tarball may not map one-for-one to the final archived registry count
- do not apply an archived update blindly to all 10 historical IDs without verifying the intended set
What “restore order” means here:
- recover known-good config
- recover the token refresh path
- bring the gateway back cleanly
- verify every production-facing route
- verify the fleet surface matches the intended roster
- verify at least one ACP execution path
## 2. Pre-flight assessment
Answer these questions before touching state. If any answer is unknown, stop and resolve the unknown first.
### Question 1: Is the VPS reachable and broadly stable?
Run:
```bash
date -u
hostnamectl
uptime
who -b
df -h
free -h
```
Pass criteria:
- the shell is responsive
- the host identity is the expected VPS
- time looks sane
- disk is not critically full
- memory pressure is not immediately pathological
If this fails, fix base host reachability first. Do not start with OpenClaw recovery.
### Question 2: Is `systemctl --user` working for `ricky`?
Run:
```bash
systemctl --user show-environment
systemctl --user status openclaw-gateway --no-pager
systemctl --user is-enabled openclaw-gateway
systemctl --user is-active openclaw-gateway
```
Interpretation:
- `Failed to connect to bus` means the user session bus must be fixed before the gateway can be trusted
- `enabled` plus `inactive` is recoverable
- `active` only means “running”, not “correctly configured”
### Question 3: Is the OpenClaw filesystem intact enough to recover locally?
Run:
```bash
ls -ld ~/.openclaw ~/.openclaw/cron ~/.openclaw/skills ~/.openclaw/scripts ~/.openclaw/agents ~/.claude ~/.claude/skills
find ~/.openclaw -maxdepth 2 \( -name 'openclaw.json*' -o -name 'jobs.json*' \) | sort
find ~/.openclaw/agents-archive-2026-04-29 -maxdepth 1 -type f -name '*.tar.gz' | sort
```
Pass criteria:
- `~/.openclaw/` exists
- the named snapshots exist
- the archive directory exists
- the supporting directories are present or can be recreated deterministically
If `~/.openclaw/` is missing entirely, stop and treat this as home-directory reconstruction first.
### Question 4: Is `~/.claude/.credentials.json` present and plausible?
Run:
```bash
stat -c '%a %U:%G %n' ~/.claude/.credentials.json
jq -e .claudeAiOauth.accessToken ~/.claude/.credentials.json >/dev/null && echo ACCESS_TOKEN_PRESENT
jq -r '.claudeAiOauth.expiresAt // .claudeAiOauth.expires_at // "NO_EXPIRES_FIELD"' ~/.claude/.credentials.json
```
Pass criteria:
- the file exists
- mode is `600`
- the access token field exists
Presence does not guarantee freshness, but absence is an immediate blocker.
### Question 5: Are SSH keys and Git auth still valid?
Run:
```bash
ls -la ~/.ssh
ssh -T git@github.com
git -C ~/.openclaw/agents/main remote -v
git -C ~/.openclaw/agents/main ls-remote origin HEAD
git -C ~/.openclaw/agents/main push --dry-run origin HEAD:refs/heads/recovery-dry-run-$(date +%s)
```
Interpretation:
- `ssh -T git@github.com` may exit non-zero while still proving auth
- `ls-remote` is the safer read-only proof of remote reachability
- `push --dry-run` is the closest safe write-path test
If `~/.openclaw/agents/main` does not exist yet, record that fact and repeat the remote check later from a surviving repo.
### Question 6: Is Git fetch/push viable from the actual workspace you expect to use?
Run:
```bash
git -C ~/.openclaw/agents/main status --short --branch
git -C ~/.openclaw/agents/main remote show origin
git -C ~/.openclaw/agents/main fetch --dry-run origin
```
Interpretation:
- `fetch --dry-run` should not update refs
- any auth or DNS failure here reduces Git’s value as a recovery oracle
### Question 7: Is Telegram DNS and HTTPS reachability alive from this VPS?
Run:
```bash
getent ahostsv4 api.telegram.org
curl -fsSI --max-time 10 https://api.telegram.org
```
Pass criteria:
- DNS resolves
- HTTPS responds within the timeout
If this fails, Telegram tests later will be misleading. Fix network path first.
### Question 8: Are the named recovery tools available?
Run:
```bash
command -v openclaw
command -v jq
command -v node
command -v git
command -v crontab
command -v claude
command -v /home/ricky/.npm-global/bin/codex
```
Interpretation:
- missing `openclaw` is a stop condition
- missing `jq` or `node` means later validation commands need local substitutes before proceeding
- missing `claude` matters if manual login becomes necessary
### Question 9: Which snapshot is actually the correct restore source?
Run:
```bash
find ~/.openclaw -maxdepth 2 \( -name 'openclaw.json' -o -name 'openclaw.json.pre-rebuild-2026-04-29' -o -name 'openclaw.json.last-good*' -o -name 'jobs.json' -o -name 'jobs.json.pre-rebuild-2026-04-29' -o -name 'jobs.json.last-good*' \) -printf '%TY-%Tm-%Td %TT %p\n' | sort
```
Decision rule:
- prefer a newer `*.last-good*` only if it is known-good
- otherwise prefer the `*.pre-rebuild-2026-04-29` snapshot
### Question 10: Is there evidence that Phase 1 completed before the disaster?
Read-only shell checks:
```bash
find ~/.openclaw/agents -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort
find ~/.openclaw/agents-archive-2026-04-29 -maxdepth 1 -type f -name '*.tar.gz' -printf '%f\n' | sort
rg -n "Update Supabase agent_registry|archived_at|status='archived'" ~/builds ~/claude-audit-rebuild 2>/dev/null | sed -n '1,40p'
```
Read-only Supabase SQL:
```sql
select agent_id, status, archived_at
from agent_registry
order by agent_id;
```
Interpretation:
- if retired rows are already archived, Phase 1 likely completed
- if retired directories are missing and registry rows are not archived, tarball restore may still matter
- if evidence conflicts, stop and resolve the conflict first
### Proceed rule
Proceed only if all of the following are known:
- the VPS is reachable
- `systemctl --user` works
- you know which config snapshots to restore from
- you know whether the Claude OAuth file exists
- you know whether Telegram is reachable
- you know whether Phase 1 completed
## 3. Restore order (canonical sequence)
Follow these steps in order. Each step is independently verifiable. Do not mark a step complete until its verification succeeds.
### 1. Restore `~/.openclaw/openclaw.json` from snapshot and validate JSON5 syntax
Objective: restore the gateway config first.
Read-only source selection:
```bash
find ~/.openclaw -maxdepth 1 \( -name 'openclaw.json.pre-rebuild-2026-04-29' -o -name 'openclaw.json.last-good*' -o -name 'openclaw.json' \) -printf '%TY-%Tm-%Td %TT %p\n' | sort
```
Rule:
- use `~/.openclaw/openclaw.json.last-good*` if a newer verified good snapshot exists
- otherwise use `~/.openclaw/openclaw.json.pre-rebuild-2026-04-29`
Preview the candidate source:
```bash
sed -n '1,40p' ~/.openclaw/openclaw.json.pre-rebuild-2026-04-29
```
Run only after explicit operator confirmation:
```bash
cp -av ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.before-recovery-$(date -u +%Y%m%dT%H%M%SZ) 2>/dev/null || true
cp -av ~/.openclaw/openclaw.json.pre-rebuild-2026-04-29 ~/.openclaw/openclaw.json
```
If you chose a newer `*.last-good*` source, substitute that source path in the second `cp`.
Validate JSON5-style syntax with trusted local evaluation plus `jq`:
```bash
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj));" | jq -e . >/dev/null && echo OPENCLAW_JSON5_VALID
```
Verify:
```bash
stat -c '%y %n' ~/.openclaw/openclaw.json
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');console.log(Object.keys(obj).slice(0,10).join(','));"
```
Step complete when:
- the file exists
- validation prints `OPENCLAW_JSON5_VALID`
- the file clearly came from the intended source
### 2. Restore `~/.openclaw/cron/jobs.json` from snapshot
Objective: restore OpenClaw-managed cron definitions.
Read-only source selection:
```bash
find ~/.openclaw/cron -maxdepth 1 \( -name 'jobs.json.pre-rebuild-2026-04-29' -o -name 'jobs.json.last-good*' -o -name 'jobs.json' \) -printf '%TY-%Tm-%Td %TT %p\n' | sort
```
Rule:
- use the newest verified good `jobs.json`
- default to `~/.openclaw/cron/jobs.json.pre-rebuild-2026-04-29` if no newer good snapshot exists
Preview:
```bash
sed -n '1,40p' ~/.openclaw/cron/jobs.json.pre-rebuild-2026-04-29
```
Run only after explicit operator confirmation:
```bash
cp -av ~/.openclaw/cron/jobs.json ~/.openclaw/cron/jobs.json.before-recovery-$(date -u +%Y%m%dT%H%M%SZ) 2>/dev/null || true
cp -av ~/.openclaw/cron/jobs.json.pre-rebuild-2026-04-29 ~/.openclaw/cron/jobs.json
```
Validate:
```bash
jq -e . ~/.openclaw/cron/jobs.json >/dev/null && echo CRON_JOBS_JSON_VALID
```
Verify:
```bash
stat -c '%y %n' ~/.openclaw/cron/jobs.json
jq -r 'keys[]?' ~/.openclaw/cron/jobs.json | sed -n '1,20p'
```
Step complete when:
- the file exists
- `jq` validates it
- the restored source is the one you intended
### 3. Restore retired agent directories from tarballs only if Phase 1 has not completed
Objective: recover destroyed retired directories only when they are still needed.
Disk evidence:
```bash
find ~/.openclaw/agents -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort
find ~/.openclaw/agents-archive-2026-04-29 -maxdepth 1 -type f -name '*.tar.gz' -printf '%f\n' | sort
```
Read-only Supabase SQL:
```sql
select agent_id, status, archived_at
from agent_registry
where agent_id in (
  'build-orchestrator',
  'codex-builder',
  'codex-reviewer',
  'customer-service',
  'default',
  'pm',
  'slack-jarvis',
  'website',
  'systems',
  'chief-of-staff'
)
order by agent_id;
```
Known tarballs:
- `build-orchestrator.tar.gz`
- `codex-builder.tar.gz`
- `codex-reviewer.tar.gz`
- `customer-service.tar.gz`
- `default.tar.gz`
- `lucian-chief-of-staff.tar.gz`
- `pm.tar.gz`
- `slack-jarvis.tar.gz`
- `systems.tar.gz`
- `website.tar.gz`
Decision rule:
- if Phase 1 clearly completed and the retired set is already archived in `agent_registry`, do not untar
- if Phase 1 clearly did not complete and retired directories are required as rebuild inputs or evidence, untar them
- if you cannot prove which case you are in, stop
Important caution:
- 10 tarballs on disk does not override the target of 9 archived rows
- do not infer the exact archived registry set from filenames alone
Run only after explicit operator confirmation that restore is necessary:
```bash
for f in ~/.openclaw/agents-archive-2026-04-29/*.tar.gz; do
  tar -xzf "$f" -C ~/.openclaw/agents/
done
```
Single-tarball variant:
```bash
tar -xzf ~/.openclaw/agents-archive-2026-04-29/website.tar.gz -C ~/.openclaw/agents/
```
Verify:
```bash
find ~/.openclaw/agents -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort
```
Step complete when the filesystem state matches the evidence-backed decision.
### 4. Re-clone gstack if missing and recreate the four native skill symlinks
Objective: restore the shared gstack repo and the skill links OpenClaw expects.
Read-only checks:
```bash
ls -ld ~/.claude ~/.claude/skills ~/.claude/skills/gstack ~/.openclaw/skills
find ~/.claude/skills/gstack/openclaw/skills -maxdepth 1 -mindepth 1 -type d -name 'gstack-openclaw-*' 2>/dev/null | sort
ls -l ~/.openclaw/skills/gstack-openclaw-* 2>/dev/null || true
```
Expected source directories:
- `~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-office-hours`
- `~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-ceo-review`
- `~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-investigate`
- `~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-retro`
Rule:
- if the repo exists and looks healthy, do not re-clone
- if it is missing, clone it
- if it exists but is corrupt or incomplete, archive the broken copy before replacement
Run only after explicit operator confirmation if clone or replacement is needed:
```bash
mv ~/.claude/skills/gstack ~/.claude/skills/gstack.before-recovery-$(date -u +%Y%m%dT%H%M%SZ) 2>/dev/null || true
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
```
Run only after explicit operator confirmation to recreate the symlinks:
```bash
ln -sfn ~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-office-hours ~/.openclaw/skills/gstack-openclaw-office-hours
ln -sfn ~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-ceo-review ~/.openclaw/skills/gstack-openclaw-ceo-review
ln -sfn ~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-investigate ~/.openclaw/skills/gstack-openclaw-investigate
ln -sfn ~/.claude/skills/gstack/openclaw/skills/gstack-openclaw-retro ~/.openclaw/skills/gstack-openclaw-retro
```
Verify:
```bash
ls -ld ~/.claude/skills/gstack/openclaw/agents-gstack-section.md
ls -l ~/.openclaw/skills/gstack-openclaw-*
readlink -f ~/.openclaw/skills/gstack-openclaw-*
```
Step complete when the repo exists, `agents-gstack-section.md` exists, and all four links resolve cleanly.
### 5. Verify the Claude OAuth token and fall back to manual login only if needed
Objective: confirm Claude auth is present before relying on Claude-backed operations or ACP.
Read-only checks:
```bash
stat -c '%a %U:%G %n' ~/.claude/.credentials.json
jq -e .claudeAiOauth.accessToken ~/.claude/.credentials.json >/dev/null && echo CLAUDE_TOKEN_PRESENT
jq -r '.claudeAiOauth.expiresAt // .claudeAiOauth.expires_at // "NO_EXPIRES_FIELD"' ~/.claude/.credentials.json
crontab -l | rg 'sync-token\.sh' || true
command -v claude
```
Decision rule:
- if the file exists, mode is `0600`, and the token field exists, continue
- if the token is missing or clearly stale and the cron sync is missing or failing, plan manual login
- if the file is missing entirely, restore or recreate auth first
Run only after explicit operator confirmation if manual login is required:
```bash
claude login
```
Verify:
```bash
stat -c '%a %n' ~/.claude/.credentials.json
jq -e .claudeAiOauth.accessToken ~/.claude/.credentials.json >/dev/null && echo CLAUDE_TOKEN_PRESENT_AFTER_LOGIN
```
Step complete when the OAuth file exists, mode is `0600`, and the token field exists.
### 6. Re-enable the sync-token cron
Objective: ensure `~/.openclaw/scripts/sync-token.sh` runs every 15 minutes.
Read-only check:
```bash
crontab -l
```
Expected line:
```bash
*/15 * * * * ~/.openclaw/scripts/sync-token.sh
```
Decision rule:
- if the line exists exactly once, do not modify cron
- if the line is missing, add it without dropping other entries
- if the line appears multiple times, remove duplicates deliberately
Prepare a candidate crontab for review:
```bash
crontab -l | { cat; printf '%s\n' '*/15 * * * * ~/.openclaw/scripts/sync-token.sh'; } | awk '!seen[$0]++' > /tmp/ricky.crontab.recovery
cat /tmp/ricky.crontab.recovery
```
Run only after explicit operator confirmation:
```bash
crontab /tmp/ricky.crontab.recovery
```
Verify:
```bash
crontab -l | rg 'sync-token\.sh'
```
Step complete when the `*/15` sync line is present and the rest of the expected crontab is intact.
### 7. Restart the OpenClaw gateway, wait 10 seconds, and inspect status and logs
Objective: bring the gateway up on restored config only after config, auth, and cron are in place.
Read-only pre-restart snapshot:
```bash
systemctl --user status openclaw-gateway --no-pager
openclaw logs --since 1m
```
Run only after explicit operator confirmation:
```bash
systemctl --user restart openclaw-gateway
sleep 10
```
Verify:
```bash
systemctl --user status openclaw-gateway --no-pager
systemctl --user is-active openclaw-gateway
openclaw logs --since 1m
journalctl --user -u openclaw-gateway -n 100 --no-pager
```
Step complete when `systemctl --user is-active openclaw-gateway` returns `active` and the logs do not show an immediate restart loop.
### 8. Verify the agent roster against the expected nine
Objective: confirm the fleet surface matches the intended post-rebuild target.
Expected active agents:
- `main`
- `operations`
- `marketing`
- `team`
- `alex-cs`
- `arlo-website`
- `backmarket`
- `diagnostics`
- `parts`
Read-only check:
```bash
openclaw agents list
```
Optional compare helper:
```bash
printf '%s\n' main operations marketing team alex-cs arlo-website backmarket diagnostics parts | sort > /tmp/expected-openclaw-agents.txt
openclaw agents list | awk 'NR>1 {print $1}' | sort > /tmp/live-openclaw-agents.txt
comm -3 /tmp/expected-openclaw-agents.txt /tmp/live-openclaw-agents.txt
```
Interpretation:
- no output from `comm -3` means the lists match exactly
- any missing or extra name must be explained before moving on
Step complete when `openclaw agents list` reflects the expected nine active agents.
### 9. Verify each Telegram binding route with one `/ping`
Objective: prove Telegram ingress reaches the intended route and produces a reply.
Read-only route inventory:
```bash
openclaw agents list
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj.channels?.telegram?.accounts || {}));" | jq 'to_entries|map({id:.key, has_token:(.value.token!=null), token_length:(.value.token|tostring|length)})'
```
Operator action:
- send exactly one `/ping` to each bound Telegram group or topic route
- wait for the reply before moving to the next route
- record any route that ingests but does not reply
Log watch command:
```bash
openclaw logs --since 5m | rg '/ping|telegram|reply|message'
```
Success criteria per route:
- an inbound Telegram event appears in logs
- the intended agent handles it
- a reply event appears
- the group visibly receives the acknowledgement
Step complete when every bound route has been exercised once and any failure is isolated to a known route, account, or agent.
### 10. Reconcile Supabase agent_registry to the intended shape
Objective: confirm `agent_registry` reflects 9 active agents and 9 archived agents, then reapply the archived update only if evidence says Phase 1 had already run.
Read-only SQL first:
```sql
select status, count(*)
from agent_registry
group by status
order by status;
```
```sql
select agent_id, status, archived_at
from agent_registry
order by agent_id;
```
Known candidate retired IDs from the Phase 1 notes:
- `build-orchestrator`
- `codex-builder`
- `codex-reviewer`
- `customer-service`
- `default`
- `pm`
- `slack-jarvis`
- `website`
- `systems`
- `chief-of-staff`
Decision rule:
- if the registry already shows the correct archived set, do nothing
- if the registry does not show the archived set and Ricky confirms Phase 1 had already run before the disaster, reapply the archived update for the exact set that should be archived
- if you cannot prove which 9 IDs belong in the final archived set, stop before updating
Run only after explicit operator confirmation and only with the exact archived set identified from evidence:
```sql
update agent_registry
set status = 'archived',
    archived_at = now()
where agent_id in (
  'build-orchestrator',
  'codex-builder',
  'codex-reviewer',
  'customer-service',
  'default',
  'pm',
  'slack-jarvis',
  'website',
  'systems'
);
```
If `chief-of-staff` is part of the correct nine in your evidence set, deliberately substitute it for the appropriate excluded ID before running the update.
Verify:
```sql
select status, count(*)
from agent_registry
group by status
order by status;
```
```sql
select agent_id, status, archived_at
from agent_registry
order by agent_id;
```
Step complete when the registry count shows the intended active and archived totals and the exact archived set matches your evidence.
### 11. Verify primary bot bindings and handle lost bot tokens if necessary
Objective: confirm each agent’s primary group still acks and define the repair path if tokens were lost or revoked.
Read-only token inventory without printing secrets:
```bash
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj.channels?.telegram?.accounts || {}));" | jq 'to_entries|map({id:.key, has_token:(.value.token!=null), token_length:(.value.token|tostring|length)})'
```
Operator action:
- if any doubt remains after Step 9, send one more `/ping` to each agent’s primary group
- verify the acknowledgement in Telegram, not only in logs
If a token appears missing, too short, revoked, or produces Telegram `401` errors:
- re-mint the affected token in BotFather
- edit `channels.telegram.accounts.<id>.token` in `~/.openclaw/openclaw.json`
- preserve the old file first
- re-run Step 1 validation
- re-run Step 7 restart
- re-run Step 9 route verification
Run only after explicit operator confirmation if token editing is necessary:
```bash
cp -av ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.before-bot-token-repair-$(date -u +%Y%m%dT%H%M%SZ)
$EDITOR ~/.openclaw/openclaw.json
```
Verify:
```bash
openclaw logs --since 5m | rg '401|telegram|reply|message'
```
Step complete when every primary group acknowledges and the relevant account logs no remaining Telegram `401` errors.
### 12. Smoke-test ACP from `main`
Objective: prove that at least one ACP runtime spawn works end-to-end after recovery.
Operator action from the `main` agent surface:
```text
sessions_spawn(runtime: 'acp', prompt: 'echo ACP_RECOVERED_OK')
```
Expected result:
- the ACP job returns within 60 seconds
- output contains `ACP_RECOVERED_OK`
Read-only support check while waiting:
```bash
openclaw logs --since 5m | rg 'acp|sessions_spawn|ACP_RECOVERED_OK'
```
Failure interpretation:
- `401` suggests Claude token or ACP auth trouble
- no log activity suggests routing or runtime wiring trouble
- partial log activity suggests runtime execution or tool-bridge trouble
Step complete when the ACP smoke spawn returns successfully inside 60 seconds.
## 4. Post-restore verification checklist
Run these as final spot checks after Section 3 completes.
- `systemctl --user status openclaw-gateway shows active (running)`
```bash
systemctl --user status openclaw-gateway --no-pager | sed -n '1,12p'
```
- `openclaw agents list returns 9 active agents`
```bash
openclaw agents list
```
- `crontab -l shows sync-token + any other restored crons`
```bash
crontab -l
```
- `jq on ~/.openclaw/openclaw.json returns valid JSON5`
```bash
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj));" | jq -e . >/dev/null && echo VALID_JSON5_VIA_NODE_AND_JQ
```
- `ls ~/.openclaw/skills/gstack-openclaw-* shows 4 symlinks resolving cleanly (readlink -f)`
```bash
ls -l ~/.openclaw/skills/gstack-openclaw-* && readlink -f ~/.openclaw/skills/gstack-openclaw-*
```
- `~/.claude/skills/gstack/openclaw/agents-gstack-section.md exists`
```bash
ls -l ~/.claude/skills/gstack/openclaw/agents-gstack-section.md
```
- `One /ping per supergroup acked`
```bash
openclaw logs --since 10m | rg '/ping|telegram|reply|message'
```
- `One ACP smoke spawn returns OK`
```bash
openclaw logs --since 10m | rg 'ACP_RECOVERED_OK|sessions_spawn|acp'
```
If all eight checks pass, the fleet is back at the intended operational baseline.
## 5. Common failure modes and fixes
Use this section when a step fails and you need a direct diagnosis path.
### Failure mode: JSON5 invalid after restore
Symptoms:
- Step 1 validation fails
- gateway refuses to start after config restore
Primary check:
```bash
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj));" | jq -e . >/dev/null
```
Fix:
- do not hand-edit under pressure unless the defect is trivial and obvious
- walk the `*.bak*`, `*.before-recovery*`, or `*.last-good*` chain
- prefer the most recent file that validates cleanly
Helpful commands:
```bash
find ~/.openclaw -maxdepth 1 -type f \( -name 'openclaw.json*' -o -name '*.bak*' \) -printf '%TY-%Tm-%Td %TT %p\n' | sort
```
```bash
for f in ~/.openclaw/openclaw.json* ~/.openclaw/*.bak*; do
  [ -f "$f" ] || continue
  printf 'CHECK %s\n' "$f"
  node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.argv[1],'utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj));" "$f" | jq -e . >/dev/null && echo OK || echo FAIL
done
```
### Failure mode: Gateway in restart loop
Symptoms:
- `systemctl --user status openclaw-gateway` cycles between starting and failed
- `openclaw` commands work intermittently or not at all
Primary check:
```bash
journalctl --user -u openclaw-gateway -n 100 --no-pager
```
Secondary checks:
```bash
systemctl --user status openclaw-gateway --no-pager
openclaw logs --since 2m
```
Fix:
- read the journal first
- confirm `openclaw.json` validates
- confirm the token file exists
- confirm Telegram account tokens are present
- then retry the restart only after identifying the cause
### Failure mode: ACP spawn 401
Symptoms:
- Step 12 returns `401`
- Claude-backed behavior fails after an apparently healthy restart
Primary fix:
Run the sync script manually, then retry.
Run only after explicit operator confirmation:
```bash
~/.openclaw/scripts/sync-token.sh
```
Then verify:
```bash
jq -e .claudeAiOauth.accessToken ~/.claude/.credentials.json >/dev/null && echo CLAUDE_TOKEN_PRESENT
openclaw logs --since 5m | rg '401|acp|sessions_spawn'
```
If it still fails:
- run `claude login`
- re-run Step 5
- re-run Step 7
- re-run Step 12
### Failure mode: Telegram 401 on inbound
Symptoms:
- logs show Telegram `401`
- `/ping` never reaches the intended bot or never replies
Primary check:
```bash
openclaw logs --since 10m | rg '401|telegram'
```
Read-only token inventory:
```bash
node -e "const fs=require('fs');const vm=require('vm');const s=fs.readFileSync(process.env.HOME+'/.openclaw/openclaw.json','utf8');const obj=vm.runInNewContext('('+s+')');process.stdout.write(JSON.stringify(obj.channels?.telegram?.accounts || {}));" | jq 'to_entries|map({id:.key, has_token:(.value.token!=null), token_length:(.value.token|tostring|length)})'
```
Fix:
- check `channels.telegram.accounts.<id>.token`
- if wrong or revoked, re-mint via BotFather
- edit `openclaw.json`
- validate JSON5 again
- restart the gateway
- re-run the route test
### Failure mode: Cron not firing
Symptoms:
- token sync does not refresh
- expected cron-driven automation is idle
Primary checks:
```bash
crontab -l
```
```bash
grep CRON /var/log/syslog | tail -n 50
```
If local mail is configured:
```bash
mailx
```
Fix:
- confirm the `sync-token.sh` line exists exactly once
- confirm the script still exists and is executable
- reinstall the reviewed candidate crontab if necessary
Helpful check:
```bash
ls -l ~/.openclaw/scripts/sync-token.sh
```
### Failure mode: gstack skills not visible
Symptoms:
- the repo exists but the native skills do not appear
- the symlinks are missing or broken
Primary checks:
```bash
ls -l ~/.openclaw/skills/gstack-openclaw-*
readlink -f ~/.openclaw/skills/gstack-openclaw-*
```
If the repo is present but incomplete, re-run setup.
Run only after explicit operator confirmation:
```bash
~/.claude/skills/gstack/setup
```
Then verify:
```bash
ls -l ~/.claude/skills/gstack/openclaw/agents-gstack-section.md
ls -l ~/.openclaw/skills/gstack-openclaw-*
```
### Failure mode: `systemctl --user` cannot connect to the bus
Symptoms:
- `systemctl --user` returns `Failed to connect to bus`
Primary checks:
```bash
loginctl show-user "$USER"
echo "$XDG_RUNTIME_DIR"
```
Fix direction:
- restore a valid user login session or lingering configuration first
- do not keep restarting the gateway while the user bus itself is unavailable
### Failure mode: Git auth works in one workspace but not another
Symptoms:
- `ssh -T git@github.com` works
- a specific workspace cannot fetch or dry-run push
Primary checks:
```bash
git -C ~/.openclaw/agents/main remote -v
git -C ~/.openclaw/agents/main status --short --branch
git -C ~/.openclaw/agents/main ls-remote origin HEAD
```
Fix direction:
- check for a remote URL mismatch
- check ownership and permissions
- check whether the repo was partially restored and lost `.git/`
## 6. Emergency contacts / escalation
Primary operational owner:
- Ricky
- `ricky@panrix.co.uk`
- timezone reference for coordination: UTC+8 when in Bali
Internal escalation:
- London team: placeholder for Ricky to fill
- keep name, role, phone, Telegram handle, and email here
Infrastructure escalation:
- VPS provider: placeholder for Ricky to fill
- keep portal URL, support URL, account email, emergency phone, and status page here
Escalation rule:
- if the VPS itself is unstable, escalate to the provider first
- if Telegram routing fails but host and gateway are healthy, escalate internally while rotating or repairing bot tokens
- if Supabase archived-set evidence is ambiguous, stop and escalate internally before running the update
Suggested placeholder block:
```text
London team:
Name:
Role:
Email:
Phone:
Telegram:
VPS provider:
Provider:
Portal URL:
Support URL:
Account email:
Emergency phone:
Status page:
```
## 7. Document maintenance
This runbook is a living operational document and must change when the architecture changes.
Update it whenever any of the following changes:
- a new agent is added
- an agent is retired or renamed
- a gstack upgrade is run
- `openclaw.json` changes materially
- `jobs.json` changes materially
- the token sync path changes
- hooks change
- circuit-breaker configuration changes
- Telegram account layout changes
- ACP runtime invocation changes
- Supabase registry conventions change
Maintenance rules:
- keep the section order intact
- keep the canonical recovery sequence aligned with real production dependencies
- keep all shell commands literally paste-able by Ricky
- keep all mutating commands clearly marked as confirmation-required
- replace contact placeholders with real values as soon as available
Owner:
- Operations agent post-Phase-9.5
Recommended cadence:
- review after every architecture change
- review after every real recovery incident
- review after every gstack-related rollout
- review after any Telegram token rotation or account addition
Change-control note:
- update the runbook in the same change window as the architecture change
- this document is part of the production system, not optional documentation

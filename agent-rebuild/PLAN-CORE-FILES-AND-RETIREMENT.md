# PLAN: Core File Rebuild + Agent Retirement (OpenClaw Layer)

**Created:** 2026-04-28
**Author:** Cowork Claude (in working session with Ricky), via Cowork mode
**Status:** Draft — awaiting Ricky confirmation on the open decisions in §4, then VPS Claude QA
**Owner during execution:** Claude Code (VPS), per HANDOFF-PROTOCOL.md (this is net-new architecture, not ops)
**Maintained after handoff:** Operations + Systems agents
**Project root:** `/home/ricky/builds/agent-rebuild/`
**Reference docs:** `system-rethink.md` (this directory), project `~/CLAUDE.md`, `~/builds/HANDOFF-PROTOCOL.md`, OpenClaw docs at <https://docs.openclaw.ai/>

---

## 1. Executive summary

The OpenClaw agent layer has accumulated three structural problems: (a) eight retired or never-active agents are still wired into `openclaw.json`, bindings, and possibly cron, leaving stale references in every active agent's instruction files; (b) the canonical workspace bootstrap files (`SOUL.md`, `USER.md`, `AGENTS.md`) are roughly 5–100× shallower than the depth that auto-injection makes worthwhile, while `~/.openclaw/shared/` holds ~6,000 words of high-quality material that the OpenClaw runtime never auto-injects; (c) the new Telegram supergroup with topics has no per-topic system-prompt overrides, so each topic post lands in an agent that has no scoped context for the topic. This plan retires the dead agents cleanly, rebuilds `SOUL.md` / `USER.md` / `AGENTS.md` for the four Ricky-facing top-level agents at a depth that matches OpenClaw's bootstrap-injection model, lifts the per-file injection budget so deep `USER.md` content fits, builds a single-source-of-truth sync flow so deep `USER.md` is maintained from one core file, and patches the Telegram supergroup with per-topic system prompts that pin each topic to the right operations-system domain folder. Operations agent goes first as the pilot; rollout to Main, Marketing, Team after pilot verifies.

## 2. Why this exists

### 2.1 What OpenClaw actually injects every turn

Per <https://docs.openclaw.ai/concepts/agent-workspace> and <https://docs.openclaw.ai/concepts/system-prompt>, the OpenClaw runtime injects exactly these workspace files into every agent turn (full mode):

`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `MEMORY.md` (when present), and `BOOTSTRAP.md` (first run only, then deleted).

`CLAUDE.md` is **not** in this list. Per-file budget defaults to `agents.defaults.bootstrapMaxChars: 12000`. Total injected bootstrap budget defaults to `agents.defaults.bootstrapTotalMaxChars: 60000`. Sub-agent sessions only receive `AGENTS.md` and `TOOLS.md`.

### 2.2 Current state, measured

Word counts of operations agent's bootstrap files (`~/.openclaw/agents/operations/workspace/`):

| File         | Words | Notes |
|--------------|-------|-------|
| `SOUL.md`    | 254   | Mostly policy, not voice |
| `USER.md`    | 34    | Six-line stub |
| `AGENTS.md`  | 539   | Operating rules, partial |
| `CLAUDE.md`  | 439   | Not auto-injected — effectively dead weight |
| `IDENTITY.md`| 58    | OK, leave |
| `MEMORY.md`  | 219   | Stamped "Last rebuilt: 2026-03-31" — stale |

Word counts of `~/.openclaw/shared/` foundation docs (~5,909 words total) — these are symlinked into agent workspaces as `foundation/` but are **not auto-injected**:

| File           | Words |
|----------------|-------|
| `RICKY.md`     | 741   |
| `GOALS.md`     | 1,328 |
| `COMPANY.md`   | 521   |
| `PRINCIPLES.md`| 847   |
| `VISION.md`    | 436   |
| `PROBLEMS.md`  | 1,354 |
| `LEARNINGS.md` | 627   |
| `TEAM.md`      | 55    |

So Ricky has already authored ~6,000 words of high-quality material. The architectural problem is that the OpenClaw runtime never injects it on its own, and `AGENTS.md` doesn't tell the agent to read it. The deep model of the user is on disk; the agent is not seeing it on every turn.

### 2.3 Confirmed file duplication between workspaces

```
md5  57fcfde56a613ca7ad1d806ecf8287a8  workspace/docs/business-problem-frame.md
md5  57fcfde56a613ca7ad1d806ecf8287a8  builds/operations-system/docs/business-problem-frame.md
md5  dd2289a1a830ea74d33b63024c04f690  workspace/docs/system-audit-2026-03-31-index.md
md5  dd2289a1a830ea74d33b63024c04f690  builds/operations-system/docs/system-audit-2026-03-31-index.md
md5  350a9284351abd49b0fb141db5c1c66e  workspace/docs/team-ownership-map.md
md5  350a9284351abd49b0fb141db5c1c66e  builds/operations-system/docs/team-ownership-map.md
```

Same content in two places, drifting at slightly different times. Workspace `docs/` should be scratch only per the operations agent's own `AGENTS.md` rule; this plan does not personally migrate the 30 flat files (that's a follow-on task), but it does delete confirmed byte-identical duplicates.

### 2.4 Stale agent references

`~/.openclaw/agents/operations/workspace/CLAUDE.md` and `SOUL.md` both list `customer-service`, `pm`, and `team` (in transitional form) as live coordination peers. The current agent roster (per Ricky 2026-04-28) is:

- **Top-level (4):** `main`, `operations`, `marketing`, `team`
- **Sub-agents (6):** `alex-cs`, `arlo-website`, `backmarket`, `diagnostics`, `parts`, `systems`
- **Retiring (8):** `build-orchestrator`, `codex-builder`, `codex-reviewer`, `customer-service`, `default`, `pm`, `slack-jarvis`, `website`

`systems` may be folded into `operations`; awaiting decision (§4.1).

### 2.5 Telegram supergroup is bound but topic-unaware

`openclaw.json` `bindings[5]` and `bindings[6]` route `agentId: operations` for groups `-1003336872091` (original) and `-1003837821965` (new supergroup with topics). Neither binding declares a `topics.<id>` map. Per <https://docs.openclaw.ai/channels/telegram> a supergroup topic supports a per-topic `systemPrompt` override that inherits from group settings. Without it, every topic message lands in the same generic operations system prompt with no domain scoping.

## 3. Scope and non-goals

### 3.1 In scope

1. Retire eight named agents from `openclaw.json`, bindings, channel accounts, cron jobs, hooks, and Supabase `agent_registry`. Archive their workspace directories.
2. Patch all stale references to retired agents in remaining workspace files (`SOUL.md`, `CLAUDE.md`, `AGENTS.md`) for `main`, `operations`, `marketing`, `team`, plus shared `TEAM.md` and the project `~/CLAUDE.md` at `/home/ricky/CLAUDE.md`.
3. Decide and execute the `systems`-fold-into-`operations` question.
4. Lift bootstrap injection budgets in `openclaw.json`: `agents.defaults.bootstrapMaxChars` 12000 → 30000; `agents.defaults.bootstrapTotalMaxChars` 60000 → 80000.
5. Author `~/.openclaw/shared/USER-CORE.md` (~3,000 words) as single source of truth, replacing or absorbing current `RICKY.md`.
6. Author per-agent `USER-APPENDIX.md` (~500 words each) for `main`, `operations`, `marketing`, `team`.
7. Build `~/.openclaw/shared/sync-user-md.sh` that concatenates core + appendix into each agent's workspace `USER.md`.
8. Rewrite `SOUL.md` for the four top-level agents in Garry-style voice (sharp, opinionated, behavior-affecting, ~600–1,000 words).
9. Rewrite `AGENTS.md` for the four top-level agents as the operational playbook (session-startup ritual, evidence lookup chain, never-do list, escalation; ~800–1,200 words).
10. Delete `CLAUDE.md` from all four top-level agent workspaces (its content has been merged into `AGENTS.md` and `SOUL.md`; runtime never injected it).
11. Patch `~/.openclaw/openclaw.json` to add `channels.telegram.groups."-1003837821965".topics.<id>` blocks with `systemPrompt` overrides scoped to each topic. Eight topics expected: General, Issues, SOPs & KB, Intake, Repair Queue, Workshop, QC, Logistics. Final naming and IDs from Ricky.

### 3.2 Out of scope (follow-on work, separate plans)

- Migration of the 30 flat files in `workspace/docs/` into `operations-system/docs/domains/<domain>/` and `kb/operations/`. This plan only deletes byte-identical duplicates.
- Building out `SOUL.md` / `USER.md` / `AGENTS.md` for the six sub-agents (per OpenClaw spec, sub-agent sessions only inject `AGENTS.md` and `TOOLS.md`, so the deep `USER.md` is wasted there).
- Standing up the `memory-wiki` plugin or enabling dreaming. Both are recommended in the audit but require their own scope and verification.
- Promoting workspace patterns to `skills/`. Recommended, separate plan.
- Rebuilding `kb/operations/` content. The 16 SOPs already there stay; canonicalisation of new SOPs from `operations-system/docs/domains/` is a content task, not infra.

## 4. Decisions awaiting Ricky confirmation

These must be answered before §5 phases run.

### 4.1 `systems` agent disposition

**Option A — fold into `operations`.** Archive `~/.openclaw/agents/systems/`, remove from `agents.list[]`, remove its Telegram binding and bot account, merge any kept content from `agents/systems/workspace/docs/` into `kb/system/`. Operations agent absorbs systems-runtime queries. **Trade-off:** Operations agent's scope grows; systems queries lose a dedicated persona but gain co-location with the agent Ricky uses most.

**Option B — keep `systems` as standalone agent.** No retirement. Remains live with its own bindings.

**Recommendation:** A. Per Ricky's own framing ("could maybe be rolled into Ops") and the principle that fewer agents the user actually talks to is better than more.

### 4.2 `parts` agent disposition

Confirmed by Ricky: **keep as sub-agent.** No retirement.

### 4.3 `default` agent disposition

`~/.openclaw/agents/default/` exists as a fallback target per OpenClaw multi-agent routing (single-agent mode default `agentId` is `main`, but `default` may be referenced as a routing fallback). Verify on inspection whether removing it breaks routing or is purely cosmetic. **If removable, retire. If load-bearing, keep but document.**

### 4.4 Final Telegram topic list and IDs

Ricky to provide:

- Confirmed topic names (currently: General, Issues, Intake System Plan, SOPs & KB; Cowork session recommended adding Repair Queue, Workshop, QC, Logistics; Intake System Plan to be renamed Intake).
- The numeric `message_thread_id` for each topic in supergroup `-1003837821965`. Easiest acquisition method: post one short message in each topic, then `openclaw logs --follow` and read `chat.id` plus `message_thread_id` from the inbound payload, or `curl "https://api.telegram.org/bot<ops_bot_token>/getUpdates"`.

## 5. Phased plan

Each phase: goal, file operations, exact commands or diffs, acceptance criteria, rollback. Code commits after each phase. Phase ordering is mandatory — earlier phases unblock later ones.

### Phase 0 — Pre-flight snapshot and backup

**Goal:** capture rollback point before any change.

**Operations:**

```bash
# Snapshot openclaw.json (already auto-rotated, but do a named one)
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.pre-rebuild-2026-04-28

# Snapshot cron jobs
cp ~/.openclaw/cron/jobs.json ~/.openclaw/cron/jobs.json.pre-rebuild-2026-04-28

# Tar the eight workspaces being retired (don't delete yet)
cd ~/.openclaw/agents
mkdir -p ~/.openclaw/agents-archive-2026-04-28
for a in build-orchestrator codex-builder codex-reviewer customer-service default pm slack-jarvis website; do
  if [ -d "$a" ]; then
    tar czf ~/.openclaw/agents-archive-2026-04-28/${a}.tar.gz "$a"
  fi
done
ls -la ~/.openclaw/agents-archive-2026-04-28/
```

**Acceptance:**
- [ ] `openclaw.json.pre-rebuild-2026-04-28` exists and matches current `openclaw.json` byte-for-byte
- [ ] Eight tarballs exist in `agents-archive-2026-04-28/` (skip any agent whose directory does not exist on disk and note it)
- [ ] No retired-agent directories deleted yet

**Rollback:** none required (read-only).

---

### Phase 1 — Inventory the retired-agent footprint

**Goal:** find every reference to retired agents before changing anything. Output a single audit file.

**Output:** `/home/ricky/builds/agent-rebuild/RETIREMENT-AUDIT-2026-04-28.md`

**Operations:** for each of the eight retired agents (plus `systems` if §4.1 = A), grep:

```bash
RETIRED=(build-orchestrator codex-builder codex-reviewer customer-service default pm slack-jarvis website)
# add 'systems' if §4.1 decision = A

for a in "${RETIRED[@]}"; do
  echo "=== $a ==="
  echo "-- openclaw.json --"
  grep -n "\"$a\"" ~/.openclaw/openclaw.json || echo "(none)"
  echo "-- cron/jobs.json --"
  grep -n "\"$a\"" ~/.openclaw/cron/jobs.json 2>/dev/null || echo "(none)"
  echo "-- workspace files in remaining agents --"
  grep -rn "$a" ~/.openclaw/agents/{main,operations,marketing,team,alex-cs,arlo-website,backmarket,diagnostics,parts,systems}/workspace/ 2>/dev/null | grep -v "\.git/"
  echo "-- shared/ --"
  grep -rn "$a" ~/.openclaw/shared/ 2>/dev/null
  echo "-- /home/ricky/CLAUDE.md --"
  grep -n "$a" /home/ricky/CLAUDE.md 2>/dev/null || echo "(none)"
  echo "-- builds/HANDOFF-PROTOCOL.md --"
  grep -n "$a" /home/ricky/builds/HANDOFF-PROTOCOL.md 2>/dev/null || echo "(none)"
  echo
done > /home/ricky/builds/agent-rebuild/RETIREMENT-AUDIT-2026-04-28.md
```

**Acceptance:**
- [ ] `RETIREMENT-AUDIT-2026-04-28.md` exists and has a section per retired agent
- [ ] Every "(none)" is correct (spot-check at least three by hand)
- [ ] Any reference outside the retired agent's own workspace is flagged for Phase 3 patching

**Rollback:** `rm RETIREMENT-AUDIT-2026-04-28.md`.

---

### Phase 2 — Retire the dead agents

**Goal:** remove eight (or nine, if §4.1 = A) agents from `openclaw.json`, bindings, channel accounts, cron, and Supabase. Archive workspace dirs. Restart gateway. Verify clean boot.

**Operations:**

1. Edit `~/.openclaw/openclaw.json`:
   - Remove their entries from `agents.list[]`.
   - Remove their entries from `bindings[]`.
   - Remove their entries from `channels.telegram.accounts.<id>` and any other channel's `accounts.<id>` they own.
   - Validate JSON5 with `node -e 'require("json5").parse(require("fs").readFileSync(process.argv[1],"utf8"))' ~/.openclaw/openclaw.json` (or equivalent).

2. Edit `~/.openclaw/cron/jobs.json`:
   - Remove any job whose `agentId` or target references a retired agent. Per project `~/CLAUDE.md`, four cron jobs are known broken — confirm whether any belong to retired agents.

3. Move retired workspace dirs into `agents-archive-2026-04-28/`:
   ```bash
   for a in "${RETIRED[@]}"; do
     [ -d ~/.openclaw/agents/$a ] && mv ~/.openclaw/agents/$a ~/.openclaw/agents-archive-2026-04-28/$a-live-state
   done
   ```

4. Update Supabase `agent_registry`:
   ```sql
   UPDATE agent_registry SET status='archived', archived_at=NOW()
   WHERE agent_id IN ('build-orchestrator','codex-builder','codex-reviewer',
                      'customer-service','default','pm','slack-jarvis','website');
   ```

5. Restart gateway:
   ```bash
   systemctl --user restart openclaw-gateway
   sleep 5
   systemctl --user status openclaw-gateway
   openclaw agents list --bindings
   ```

**Acceptance:**
- [ ] `openclaw agents list` returns only the active roster (4 top-level + 6 sub-agents = 10, or 9 if `systems` folded)
- [ ] `systemctl --user status openclaw-gateway` shows `active (running)` with no error logs
- [ ] `openclaw logs --since 5m` contains no "binding for retired agent" or unknown-agent errors
- [ ] Each remaining bound Telegram group still receives heartbeat ack on a `/ping` from Ricky's number

**Rollback:** restore `openclaw.json` and `cron/jobs.json` from `.pre-rebuild-2026-04-28` snapshots; `mv` workspaces back; revert Supabase update; restart gateway.

---

### Phase 3 — Patch stale references in remaining files

**Goal:** strip retired-agent names from every active workspace file plus shared/ plus `/home/ricky/CLAUDE.md`.

**Operations:** for each line surfaced in Phase 1's audit:

- In agent workspace `SOUL.md` / `AGENTS.md` / `CLAUDE.md` files: edit out the retired agent name. If it appeared in a coordination list, remove the bullet. If it appeared in a sentence, rewrite the sentence.
- In `~/.openclaw/shared/TEAM.md` (currently 55 words): rewrite to reflect the new roster.
- In `/home/ricky/CLAUDE.md`: rewrite §"The Agent System" to reflect 10 (or 9) active agents and remove the "3 transitional v1 agents" callout if those agents are retired/folded.

**Acceptance:**
- [ ] Re-run the Phase 1 grep loop; every retired agent name returns `(none)` everywhere except `agents-archive-2026-04-28/` and the audit file itself
- [ ] `git diff` for each edited file is reviewed and committed with message `retirement: strip references to retired agents`

**Rollback:** `git revert` the commit.

---

### Phase 4 — Lift bootstrap injection budget

**Goal:** allow Garry-scale `USER.md` (~24,000 chars) without truncation.

**Operations:** patch `openclaw.json`:

```json5
{
  agents: {
    defaults: {
      // existing fields preserved
      bootstrapMaxChars: 30000,        // was 12000 (default)
      bootstrapTotalMaxChars: 80000,   // was 60000 (default)
      bootstrapPromptTruncationWarning: "always", // was "once" — louder during pilot
    },
  },
}
```

Validate JSON5, restart gateway.

**Acceptance:**
- [ ] In a fresh `/reset` session against any active agent, `openclaw status` (or the agent's `/context list` equivalent) shows the bootstrap section's reported per-file limit at 30000
- [ ] No agent reports a truncation warning on startup

**Rollback:** restore prior values, restart.

---

### Phase 5 — Build SOUL / USER-CORE / USER-APPENDIX / AGENTS for Operations (pilot)

**Goal:** stand up the new file architecture on the operations agent and verify it loads correctly before rolling out to the other three.

**5.1. Create `~/.openclaw/shared/USER-CORE.md`** (~3,000 words). Source material: `RICKY.md` (741w), `GOALS.md` (1,328w), `VISION.md` (436w), `COMPANY.md` (521w), `PRINCIPLES.md` (847w), `PROBLEMS.md` (1,354w), `LEARNINGS.md` (627w). Required sections, in order:

1. *Identity & life context* — name, role, location, family, timezone, daily rhythm. Pulls from RICKY.md.
2. *How my mind works* — ADHD-as-OS, ideas-person, big-thinker, coffee-morning capture rule, regulated-vs-dysregulated protocol, what frustrates me, what I value. Pulls from RICKY.md and LEARNINGS.md.
3. *What I'm building* — iCorrect now, Mission Control vision, micro-PE ambition, 12-month story. Pulls from VISION.md, GOALS.md, COMPANY.md.
4. *How I make decisions* — the eleven principles from PRINCIPLES.md, condensed to leading sentence + one example each.
5. *What's broken right now* — current top-level business problems (revenue leakage at top of funnel, queue contamination, human bottleneck middleware, throughput drag, broken financial closure, doc/system drift). Pulls from PROBLEMS.md.
6. *How agents should work with me* — propose-don't-ask, catch-my-ideas, shield-from-fires, never-make-me-repeat-myself, read-my-state, solutions-not-problems. Pulls from RICKY.md.

Constraint: must be ≤ 25,000 chars to fit comfortably under the new 30,000 per-file cap with appendix room.

**5.2. Create `~/.openclaw/agents/operations/workspace/USER-APPENDIX.md`** (~500 words). Operations-specific lens. Required content:

- *Where Ops Jarvis sits in the agent layer* — Ricky-facing, primary surface, bound to two Telegram groups including the topic-organised supergroup.
- *What Ricky cares most about in Ops's domain* — workshop throughput, intake clarity, queue cleanliness, parts-blocker visibility, QC reliability, dispatch on time.
- *How Ricky measures Ops* — clear blocker / clear owner / clear next move every time; no orphan jobs; no unverified SOPs presented as canon.
- *Frustration triggers specific to Ops domain* — vague "we're working on it" updates, unverified workflow claims dressed as truth, treating Monday's mess as the reference architecture.
- *Per-topic context* — Telegram supergroup topic structure (filled in after Phase 8).

**5.3. Create `~/.openclaw/shared/sync-user-md.sh`** — a bash script that concatenates `USER-CORE.md` plus each top-level agent's `USER-APPENDIX.md` into that agent's `workspace/USER.md`. Required behaviour:

```bash
#!/usr/bin/env bash
set -euo pipefail
SHARED="$HOME/.openclaw/shared"
AGENTS=(main operations marketing team)
CORE="$SHARED/USER-CORE.md"

[ -f "$CORE" ] || { echo "missing $CORE"; exit 1; }

for a in "${AGENTS[@]}"; do
  WS="$HOME/.openclaw/agents/$a/workspace"
  APPENDIX="$WS/USER-APPENDIX.md"
  OUT="$WS/USER.md"
  if [ ! -f "$APPENDIX" ]; then
    echo "skip $a — no $APPENDIX"
    continue
  fi
  {
    echo "# USER.md — $(basename "$WS" | tr '[:lower:]' '[:upper:]')"
    echo
    echo "<!-- AUTO-GENERATED from shared/USER-CORE.md + workspace/USER-APPENDIX.md -->"
    echo "<!-- DO NOT EDIT THIS FILE DIRECTLY. Edit the source files and re-run sync-user-md.sh. -->"
    echo "<!-- Last sync: $(date -u +'%Y-%m-%dT%H:%M:%SZ') -->"
    echo
    cat "$CORE"
    echo
    echo "---"
    echo
    cat "$APPENDIX"
  } > "$OUT"
  CHARS=$(wc -c < "$OUT")
  echo "wrote $OUT ($CHARS chars)"
  if [ "$CHARS" -gt 30000 ]; then
    echo "  WARNING: $OUT exceeds bootstrapMaxChars (30000) — agent will see truncation"
  fi
done
```

**5.4. Run sync** to generate `~/.openclaw/agents/operations/workspace/USER.md`.

**5.5. Rewrite `~/.openclaw/agents/operations/workspace/SOUL.md`** at ~800 words, Garry-style. Voice rules from <https://docs.openclaw.ai/concepts/soul> and Garry's `ETHOS.md` pattern:

- Brevity is mandatory. One sentence when one sentence works.
- Never open with "Great question," "Absolutely," "I'd be happy to help."
- Uncomfortable truths welcome if actually true.
- Humour allowed when it lands; never forced.
- Swearing allowed when it lands; sparingly.
- Charm over cruelty, but no sugar-coating.
- Three or four named principles, each with anti-patterns.

Keep operating-rule content out of `SOUL.md`. That goes in `AGENTS.md`.

**5.6. Rewrite `~/.openclaw/agents/operations/workspace/AGENTS.md`** at ~1,000 words. Required sections:

- *Session-startup ritual* — read order: SOUL → USER → MEMORY (main session only) → WORKING-STATE → today's daily memory → yesterday's daily memory if present.
- *Evidence lookup chain* — when asserting a process truth: check `kb/operations/` first, then `builds/operations-system/docs/domains/<domain>/process-truth.md`, then build-local references, then session memory. If sources disagree, name the conflict explicitly.
- *Path rules* — `workspace/` is private memory and control layer only; `workspace/docs/` is scratch; build-local specs go in `builds/operations-system/docs/`; canonical SOPs go in `kb/operations/`. No duplication across these layers.
- *Coordination peers* — `main`, `marketing`, `team` (top-level); `parts`, `backmarket`, `alex-cs`, `arlo-website`, `diagnostics`, `systems` (sub-agents). No retired agents listed.
- *Heartbeat protocol* — check HEARTBEAT.md, reply `HEARTBEAT_OK` if nothing needs attention.
- *What NOT to do* — present unverified SOPs as canon; duplicate canonical content into workspace; treat memory notes as stronger than verified evidence; create new docs in workspace/docs/ when an operations-system domain folder exists.
- *Escalation protocol* — when a problem is out-of-domain, flag in Issues topic, name the responsible peer agent, propose next step.
- *Process-document structure* — reference `builds/operations-system/docs/process-document-structure-template.md` as the canonical capture format.

**5.7. Delete `~/.openclaw/agents/operations/workspace/CLAUDE.md`** after confirming all its operating-rule content has been merged into the new `AGENTS.md`.

**Acceptance:**
- [ ] `USER-CORE.md` exists, ≤ 25,000 chars, all six required sections present
- [ ] `USER-APPENDIX.md` for operations exists, ≤ 5,000 chars, all required content present
- [ ] `sync-user-md.sh` runs cleanly and produces `workspace/USER.md` of ≤ 30,000 chars
- [ ] New `SOUL.md` is ≤ 1,000 words and contains zero operational rules (visual review for "should/must/never" lines that describe process, not voice)
- [ ] New `AGENTS.md` is ≤ 1,200 words and references no retired agent
- [ ] `CLAUDE.md` no longer exists in operations workspace
- [ ] Fresh `/reset` session in operations Telegram group; ask "what do you remember about Ricky?" — agent quotes specific RICKY.md content (e.g. coffee morning, ADHD-as-OS, Bali, family details). If it cannot, USER.md is not being injected — diagnose before proceeding.
- [ ] `/context list` (or equivalent) shows AGENTS.md, SOUL.md, USER.md, IDENTITY.md, TOOLS.md, HEARTBEAT.md, MEMORY.md all present in injected bootstrap, no truncation warnings
- [ ] Total injected bootstrap < 80,000 chars

**Rollback:** restore old `SOUL.md`, `AGENTS.md`, `CLAUDE.md`, `USER.md` from git; `rm USER-APPENDIX.md USER-CORE.md sync-user-md.sh` and the regenerated `USER.md`. The pre-edit versions are committed at start of phase.

---

### Phase 6 — Roll out to Main, Marketing, Team

**Goal:** repeat Phase 5.2, 5.4, 5.5, 5.6, 5.7 for the three remaining top-level agents. `USER-CORE.md` and `sync-user-md.sh` are already in place.

**Operations:** for each agent in (main, marketing, team):

1. Author `~/.openclaw/agents/<id>/workspace/USER-APPENDIX.md` (~500 words), domain lens for that agent.
2. Run `sync-user-md.sh`.
3. Rewrite that agent's `SOUL.md` and `AGENTS.md` per Phase 5.5–5.6 conventions.
4. Delete `CLAUDE.md` if present.

**Acceptance:** same as Phase 5 acceptance, applied to each agent. Verify in a fresh `/reset` session per agent's primary Telegram group.

**Rollback:** per agent, restore from git.

---

### Phase 7 — Operations workspace duplicate cleanup (lightweight)

**Goal:** remove the three byte-identical files between `workspace/docs/` and `builds/operations-system/docs/`. Full migration of the remaining 27 flat files is out of scope for this plan.

**Operations:**

```bash
WS=~/.openclaw/agents/operations/workspace/docs
OS=~/builds/operations-system/docs
for f in business-problem-frame.md system-audit-2026-03-31-index.md team-ownership-map.md; do
  if cmp -s "$WS/$f" "$OS/$f"; then
    rm "$WS/$f"
    echo "removed duplicate $WS/$f (canonical lives at $OS/$f)"
  else
    echo "DIVERGED: $WS/$f and $OS/$f differ — not deleted, requires human review"
  fi
done
```

**Acceptance:**
- [ ] Three named files no longer exist in `workspace/docs/` (or are flagged DIVERGED)
- [ ] `operations-system/docs/` copies untouched

**Rollback:** `git checkout` the deleted files in workspace.

---

### Phase 8 — Telegram per-topic systemPrompt overrides

**Goal:** scope each topic in supergroup `-1003837821965` to a specific operations-system domain.

**Pre-requisite:** Ricky has provided final topic names + numeric `message_thread_id` for each (per §4.4).

**Operations:** patch `openclaw.json` under `channels.telegram.groups."-1003837821965"`:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1003837821965": {
          requireMention: false,
          // existing group-level config preserved
          topics: {
            "<id_general>":   { systemPrompt: "Topic: General. Meta, scheduling, casual coordination. No domain truth lives here. If a message belongs in a domain topic, redirect to it." },
            "<id_issues>":    { systemPrompt: "Topic: Issues. Cross-domain blockers and exceptions. Short-lived items only. Required output for any blocker: what is blocked, who owns it, evidence, next move. If it lands in a sibling agent's domain, name the agent and propose handoff." },
            "<id_sopskb>":    { systemPrompt: "Topic: SOPs & KB. Governance of the doc tree. Promotion decisions, draft reviews, KB index updates, what is stale, what to write next. Do not capture process truth here — that belongs in the matching domain topic and ends up in builds/operations-system/docs/domains/<domain>/process-truth.md." },
            "<id_intake>":    { systemPrompt: "Topic: Intake. Domain folder: builds/operations-system/docs/domains/enquiry-intake-triage-quote/. Read process-truth.md on entry. Append session notes to session-notes/YYYY-MM-DD.md. Owns the new intake-system build conversation. Naheed is the current intake/front-desk owner; Adil references are stale." },
            "<id_repairq>":   { systemPrompt: "Topic: Repair Queue. Domain folder: builds/operations-system/docs/domains/accepted-diagnostic-repair-queue-workshop-handoff/. Owns accepted-diagnostic to ready-for-bench: parts gating, queue ordering, hold management, ready-for-tech handoff." },
            "<id_workshop>":  { systemPrompt: "Topic: Workshop. Domain folder: builds/operations-system/docs/domains/workshop/ (create on first use). Active repair execution: bench-side process, technician handoffs, repair-paused/resumed, senior escalation." },
            "<id_qc>":        { systemPrompt: "Topic: QC. Domain folder: builds/operations-system/docs/domains/qc/ (create on first use). Post-repair validation: signoff rules, fail-and-rework loop, ready-for-return criteria." },
            "<id_logistics>": { systemPrompt: "Topic: Logistics. Domain folder: builds/operations-system/docs/domains/logistics/ (create on first use). Physical movement: mail-in receipt, return shipping, collection arrangements, courier exceptions. Customer comms layer is alex-cs's job, not yours." },
          },
        },
      },
    },
  },
}
```

Restart gateway.

**Acceptance:**
- [ ] Each topic name maps to a numeric thread ID Ricky provided (no placeholders left)
- [ ] Gateway restarts cleanly
- [ ] Posting one test message in each topic surfaces a session key in logs of the form `agent:operations:telegram:group:-1003837821965:topic:<id>` and the agent's reply demonstrably reflects the per-topic scope (e.g. in Intake topic, agent references the intake domain folder by name unprompted)
- [ ] Patch the operations agent's `USER-APPENDIX.md` with the same topic→folder map and re-run `sync-user-md.sh`

**Rollback:** revert `openclaw.json` to pre-Phase-8 state, restart.

---

### Phase 9 — Final verification

**Goal:** confirm the rebuilt system works end-to-end before handoff.

**Operations:** in each top-level agent's primary Telegram group, run a `/reset`-equivalent and:

1. Ask: "What do you remember about Ricky?" — expect specific quotes from `USER-CORE.md` (e.g. ADHD-as-OS, coffee morning capture, Bali timezone, Reuben).
2. Ask: "Who do you coordinate with?" — expect only the active roster, no retired agents.
3. Ask: "What's your single source of truth for canonical SOPs?" — expect `~/kb/operations/`.
4. In operations agent, post in the Intake topic: "Where do I write process truth for this topic?" — expect `builds/operations-system/docs/domains/enquiry-intake-triage-quote/process-truth.md` referenced unprompted.

**Acceptance:**
- [ ] All four answers correct on first try
- [ ] No agent surfaces a retired-agent name
- [ ] No truncation warnings in `openclaw logs --since 30m`
- [ ] Supabase `agent_activity` shows session starts logging correctly for all four top-level agents

**Rollback:** none. If verification fails, re-open the failing phase and diagnose.

## 6. Risks

1. **Gateway restart blast radius.** Per project `~/CLAUDE.md`, `systemctl --user restart openclaw-gateway` takes every active agent offline simultaneously. Schedule Phase 2, 4, 8 restarts during quiet hours (Ricky's morning Bali / London late-night) and notify in advance.
2. **`USER.md` injection silently truncating.** The 30,000-char cap may still be too tight if `USER-CORE.md` grows. The sync script warns when output exceeds 30,000 chars; honour the warning by trimming or further raising the cap.
3. **Stale references missed in Phase 1 grep.** If a retired agent name is referenced in code (e.g. a Python script under `~/.openclaw/scripts/`), the grep loop in Phase 1 only covers config + workspaces + shared. Add scripts and cron job script bodies to the grep if relevant.
4. **Sub-agent context regression.** Sub-agents only inject `AGENTS.md` and `TOOLS.md`. If any sub-agent currently relied on its own `CLAUDE.md` (which the runtime never injected anyway), retiring CLAUDE.md as a pattern across the fleet may surface latent confusion. Out of scope here — flag for follow-on.
5. **Telegram topic IDs are forum-only.** The supergroup must have forum mode enabled in Telegram itself. If forum is off, the per-topic config does nothing. Verify before Phase 8.
6. **`/home/ricky/CLAUDE.md` editing.** This is the project root file that Cowork loads as project instructions. Editing it changes Cowork's view of the codebase mid-session. Plan that edit for the end of the patching pass and notify Ricky if Cowork session in progress.

## 7. Verification strategy

End-to-end verification at Phase 9 plus per-phase acceptance gates. No phase advances until its acceptance checklist is complete. Any DIVERGED file or "(none)" anomaly in Phase 1's audit halts progress.

## 8. Compromises (to be filled in by Code at end of build session)

Per project `~/CLAUDE.md` "Honesty Over Completion" rule. At session end, document:

- What was simplified vs the original plan
- What was skipped (and why — e.g. systems-fold-into-Ops if §4.1 = B)
- What is fragile or temporary (e.g. sync script not yet under cron — manual run required after every USER-CORE edit)
- What needs manual verification (e.g. did Ricky actually see correct context in the per-topic test posts?)

## 9. References

- Project `~/CLAUDE.md` — build workflow, do-not-touch list, agent roster context
- `~/builds/HANDOFF-PROTOCOL.md` — ops vs build ownership boundary
- `~/builds/agent-rebuild/system-rethink.md` — broader rebuild context (Anthropic OAuth wake-up call, Option B Claude CLI provider)
- OpenClaw — agent runtime: <https://docs.openclaw.ai/concepts/agent>
- OpenClaw — agent workspace: <https://docs.openclaw.ai/concepts/agent-workspace>
- OpenClaw — system prompt and bootstrap injection: <https://docs.openclaw.ai/concepts/system-prompt>
- OpenClaw — SOUL.md personality guide: <https://docs.openclaw.ai/concepts/soul>
- OpenClaw — memory overview: <https://docs.openclaw.ai/concepts/memory>
- OpenClaw — multi-agent routing: <https://docs.openclaw.ai/concepts/multi-agent>
- OpenClaw — Telegram channel and per-topic agent routing: <https://docs.openclaw.ai/channels/telegram>
- Garry Tan — gstack ETHOS.md (model for SOUL.md voice depth): <https://github.com/garrytan/gstack/blob/main/ETHOS.md>

## 10. QA prompt (for VPS Claude)

When you read this plan, treat the following as the QA acceptance bar before approving for build:

1. Are all eight retired agents in §2.4 correct, and have I missed any latent agent (check `~/.openclaw/agents/` directory listing against §2.4)?
2. Does the openclaw.json `agents.list[]` index ordering in §2 still match the live file? (Cowork session indices may have drifted.)
3. Phase 2's Supabase update — is `agent_registry` the correct table name and does it have an `archived_at` column? Verify against schema.
4. Phase 5.3 sync script — does it correctly handle file-not-found, JSON5 vs JSON, and BOM characters in any source markdown? Add tests if needed.
5. Phase 8 — confirm the supergroup `-1003837821965` has forum mode actually enabled. If not, the topics config is a no-op.
6. Phase 4 — is `bootstrapPromptTruncationWarning` field name correct per the live OpenClaw version installed on this VPS? Check `openclaw status` or schema lookup before applying.
7. Are there ops-domain hot fires in flight right now that would be disrupted by gateway restart? If yes, defer Phases 2, 4, 8 to a quiet window.
8. Does Phase 1's grep loop need to extend into `~/.openclaw/scripts/` and any Python files under `cron/` to catch script-level references to retired agents?
9. Acceptance gate: does §5 require any per-domain authorial input (e.g. specific LEARNINGS.md entries) that I cannot author without access to Ricky's calendar / Slack archive / etc.? Flag any.
10. Compromises section — fill in what was simplified, skipped, or remains manual at session end. Do not collapse this into a "completed" marker.

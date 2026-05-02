# Jarvis Context Audit

Date: 2026-04-04
Scope: `~/.openclaw/agents/main/workspace`, `~/.openclaw/openclaw.json`, OpenClaw hooks under `~/.openclaw/hooks/`, and comparison with `alex-cs` and `marketing`
Method: read-only research only; no existing files modified

---

## Executive summary

The headline finding remains the same after re-checking the live files:

**Jarvis does not appear to be loading ~600KB from workspace files alone.**

Measured directly from the current main workspace:
- the nine root workspace files listed in the brief total **24,026 chars** (~**6,007 tokens**)
- if we add the files `AGENTS.md` explicitly says to read every session for the main Ricky session:
  - `docs/source-of-truth.md`
  - `memory/2026-04-04.md`
  - `memory/2026-04-03.md`
- plus the tiny injected bootstrap file from the hook,
- the practical startup file set is about **29,420 chars** (~**7,355 tokens**)

That is roughly **29KB of text**, not 600KB.

So if Jarvis still behaves like a very heavy context load, most of the missing cost is likely in:
- system/developer prompt layers
- tool schemas/tool inventory
- session history/runtime metadata
- hidden prompt assembly outside visible workspace files

This audit therefore focuses on what is **actually measurable in files and hooks**, and distinguishes that from the larger hidden runtime overhead.

---

## 1. Complete inventory table

## 1.1 Core workspace files listed in the brief

Measured directly from the current main workspace.
Estimated tokens use ~4 chars/token.

| File | Size (chars) | Est. Tokens | Loaded When | Essential? | Recommendation |
|---|---:|---:|---|---|---|
| `SOUL.md` | 2,720 | 680 | Likely every startup/message bootstrap | Yes | **KEEP** |
| `CLAUDE.md` | 5,294 | 1,324 | Likely every startup/message bootstrap | Mostly yes, but verbose | **TRIM** |
| `MEMORY.md` | 3,810 | 952 | Main Ricky session only per `AGENTS.md` | Yes, but should stay concise | **TRIM** |
| `AGENTS.md` | 4,793 | 1,198 | Startup routine / workspace authority rules | Partly | **TRIM** |
| `TOOLS.md` | 4,397 | 1,099 | Only useful when specific external references are needed | Not on >50% of messages | **ON-DEMAND** |
| `USER.md` | 835 | 209 | Likely every startup/message bootstrap | Yes | **KEEP** |
| `IDENTITY.md` | 279 | 70 | Likely every startup/message bootstrap | Low marginal value if SOUL already exists | **TRIM** or **ON-DEMAND** |
| `HEARTBEAT.md` | 356 | 89 | Only on heartbeat | No for normal messages | **ON-DEMAND** |
| `WORKING-STATE.md` | 1,542 | 386 | Likely every startup/message bootstrap | Yes | **KEEP** |

### Total: core root file set
- **24,026 chars**
- **~6,007 tokens**

---

## 1.2 Files `AGENTS.md` explicitly says to read every session

`AGENTS.md` currently says, before doing anything else:
1. read `SOUL.md`
2. read `USER.md`
3. read `docs/source-of-truth.md`
4. read today and yesterday memory files if present
5. read `WORKING-STATE.md`
6. in the main Ricky session, also read `MEMORY.md`

For the current audit date, the extra files are:

| File | Size (chars) | Est. Tokens | Loaded When | Essential? | Recommendation |
|---|---:|---:|---|---|---|
| `docs/source-of-truth.md` | 1,226 | 306 | Every session per `AGENTS.md` | Yes | **KEEP** |
| `memory/2026-04-04.md` | 1,643 | 411 | Today file | Yes if recent-memory policy stays | **KEEP** |
| `memory/2026-04-03.md` | 2,303 | 576 | Yesterday file | Yes if recent-memory policy stays | **KEEP** |

---

## 1.3 Hook-injected bootstrap file

`supabase-bootstrap/handler.js` injects a synthetic `BOOTSTRAP.md` with this text:
- write conclusions to `knowledge/`
- read `knowledge/corrections.md`
- read `knowledge/unanswered.md`
- shared reference data `kb/` is read-only

Measured size:
- **222 chars**
- **~56 tokens**

| File | Size (chars) | Est. Tokens | Loaded When | Essential? | Recommendation |
|---|---:|---:|---|---|---|
| injected `BOOTSTRAP.md` | 222 | 56 | Every bootstrap | No, and the guidance is partly stale for this workspace model | **TRIM** or **FIX/REMOVE** |

---

## 1.4 Practical startup total for Jarvis main session

If we combine:
- the 9 root files from the brief
- `docs/source-of-truth.md`
- today + yesterday memory files
- injected bootstrap note

then the practical startup file set totals:

- **29,420 chars**
- **~7,355 tokens**

This is the most important measured finding in the audit.

---

## 2. Memory files audit

## 2.1 Are all memory files loaded on every message?

**No direct evidence suggests that all memory files are loaded on every message.**

The strongest evidence is the current `AGENTS.md`, which explicitly instructs reading:
- today’s memory file
- yesterday’s memory file
- and `MEMORY.md` in the main Ricky session

It does **not** say to load all `memory/*` files.

So the likely operational reality is:
- all memory files are present and searchable/readable
- but only the recent daily files are intended for startup reading

## 2.2 Full memory inventory for main

There are **46** files in `~/.openclaw/agents/main/workspace/memory/`.

### Total memory directory size
- **363,873 chars**
- **~90,968 tokens**

That is large enough to matter even if not all auto-loaded, because it creates:
- search noise
- workspace clutter
- temptation to keep stale context active instead of archiving/promoting it

### Memory file list

| File | Size (chars) | Est. Tokens | Modified (UTC) | Recommendation |
|---|---:|---:|---|---|
| `2026-03-05.md` | 3,131 | 783 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-07.md` | 1,298 | 324 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-08.md` | 1,392 | 348 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-09.md` | 1,049 | 262 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-10.md` | 1,647 | 412 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-11-ga4-confirmed.md` | 8,412 | 2,103 | 2026-04-01 06:03:01 | ARCHIVE or promote to KB/build doc |
| `2026-03-11-meeting-actions.md` | 2,146 | 536 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-11.md` | 1,361 | 340 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-12.md` | 1,552 | 388 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-13.md` | 3,008 | 752 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-14.md` | 4,219 | 1,055 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-16-team-roster.md` | 3,121 | 780 | 2026-04-01 06:03:01 | ARCHIVE or promote to KB/team |
| `2026-03-17.md` | 4,015 | 1,004 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-18.md` | 12,721 | 3,180 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-19.md` | 5,628 | 1,407 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-20.md` | 10,555 | 2,639 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-21.md` | 6,161 | 1,540 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-23.md` | 4,316 | 1,079 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-25.md` | 274 | 68 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-26-buybox-scripts.md` | 9,203 | 2,301 | 2026-04-01 06:03:01 | ARCHIVE or promote to build doc |
| `2026-03-26.md` | 3,206 | 802 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-27-1628.md` | 32,821 | 8,205 | 2026-04-01 06:03:01 | ARCHIVE urgently |
| `2026-03-27-bm-frustration.md` | 9,763 | 2,441 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-27-request-timed-out-before-a-res.md` | 825 | 206 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-27.md` | 788 | 197 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-28-bm-listings.md` | 10,137 | 2,534 | 2026-04-01 06:03:01 | ARCHIVE or promote |
| `2026-03-28-price-check.md` | 27,722 | 6,930 | 2026-04-01 06:03:01 | ARCHIVE urgently |
| `2026-03-28-reconciliation-sop.md` | 5,786 | 1,446 | 2026-04-01 06:03:01 | ARCHIVE or promote |
| `2026-03-28.md` | 1,450 | 362 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-29-bm-listings.md` | 12,997 | 3,249 | 2026-04-01 06:03:01 | ARCHIVE or promote |
| `2026-03-29.md` | 1,411 | 353 | 2026-04-01 06:03:01 | ARCHIVE |
| `2026-03-31-agent-roadmap.md` | 25,549 | 6,387 | 2026-04-01 06:03:01 | ARCHIVE or promote to KB/system |
| `2026-04-01-cron-outbound-fix.md` | 20,607 | 5,152 | 2026-04-01 06:03:01 | ARCHIVE or promote to build/system doc |
| `2026-04-01.md` | 2,415 | 604 | 2026-04-01 15:44:36 | ARCHIVE soon |
| `2026-04-02-customer-data.md` | 5,521 | 1,380 | 2026-04-02 12:30:23 | ARCHIVE |
| `2026-04-02-openai-key.md` | 25,390 | 6,348 | 2026-04-02 06:20:11 | ARCHIVE urgently |
| `2026-04-02-session-greeting.md` | 1,007 | 252 | 2026-04-02 12:33:22 | ARCHIVE |
| `2026-04-02-xero-scopes.md` | 25,567 | 6,392 | 2026-04-02 12:26:18 | ARCHIVE or promote to system doc |
| `2026-04-02.md` | 6,537 | 1,634 | 2026-04-02 15:04:48 | ARCHIVE soon |
| `2026-04-03-codex-agent-check.md` | 28,216 | 7,054 | 2026-04-03 05:26:34 | ARCHIVE or promote to KB/system |
| `2026-04-03.md` | 2,303 | 576 | 2026-04-04 06:55:06 | KEEP as recent |
| `2026-04-04-1608.md` | 265 | 66 | 2026-04-04 16:08:01 | KEEP as recent / tiny note |
| `2026-04-04-gsc-debug.md` | 23,642 | 5,910 | 2026-04-04 16:04:41 | ARCHIVE or move to build-local doc after session |
| `2026-04-04.md` | 1,643 | 411 | 2026-04-04 09:09:20 | KEEP as recent |
| `business-context.md` | 1,618 | 404 | 2026-04-01 06:03:01 | TRIM into MEMORY or archive |
| `sop6-device-1.md` | 1,478 | 370 | 2026-04-01 06:03:01 | ARCHIVE |

### Heaviest memory files to move first
The biggest offenders by size are:
- `2026-03-27-1628.md` — 32,821 chars
- `2026-04-03-codex-agent-check.md` — 28,216 chars
- `2026-03-28-price-check.md` — 27,722 chars
- `2026-04-02-xero-scopes.md` — 25,567 chars
- `2026-03-31-agent-roadmap.md` — 25,549 chars
- `2026-04-02-openai-key.md` — 25,390 chars
- `2026-04-04-gsc-debug.md` — 23,642 chars
- `2026-04-01-cron-outbound-fix.md` — 20,607 chars

These should leave active `memory/` first.

---

## 3. Foundation docs audit

## 3.1 Inventory

`~/.openclaw/agents/main/workspace/foundation/` contains 10 files.

| File | Size (chars) | Est. Tokens | Loaded When | Essential? | Recommendation |
|---|---:|---:|---|---|---|
| `COMPANY.md` | 3,422 | 856 | No evidence of auto-load | Sometimes | **ON-DEMAND** |
| `CREDENTIALS.md` | 5,862 | 1,466 | No evidence of auto-load | Rarely; sensitive | **ON-DEMAND** |
| `GOALS.md` | 8,371 | 2,093 | No evidence of auto-load | Sometimes | **ON-DEMAND** |
| `LEARNINGS.md` | 4,513 | 1,128 | No evidence of auto-load | Sometimes | **ON-DEMAND** |
| `PRINCIPLES.md` | 5,148 | 1,287 | No evidence of auto-load | Useful, but not every message | **ON-DEMAND** or tiny summary in SOUL |
| `PROBLEMS.md` | 8,847 | 2,212 | No evidence of auto-load | Sometimes | **ON-DEMAND** |
| `RICKY.md` | 4,808 | 1,202 | No evidence of auto-load | High value, but not every message | **TRIM summary into USER, full file ON-DEMAND** |
| `SUPABASE.md` | 1,532 | 383 | No evidence of auto-load | Rarely | **ON-DEMAND** |
| `TEAM.md` | 416 | 104 | No evidence of auto-load | Rarely | **ON-DEMAND** |
| `VISION.md` | 2,637 | 659 | No evidence of auto-load | Sometimes | **ON-DEMAND** |

### Foundation total
- **45,556 chars**
- **~11,389 tokens**

## 3.2 Are foundation docs auto-loaded?

**No direct evidence says they are auto-loaded.**

Current `AGENTS.md` says:
- “Company context lives in `~/.openclaw/shared/` and should be referenced rather than duplicated.”

That implies:
- foundation docs are available reference material
- they should not be treated as part of the minimal always-loaded prompt unless some hidden runtime is injecting them separately

So for this audit, they should be classified as **ON-DEMAND**, not part of the core startup context.

---

## 4. KB and docs in main workspace

## 4.1 `kb/` in workspace

`~/.openclaw/agents/main/workspace/kb` exists as an intentional symlink to `/home/ricky/kb`.
Current authority rules in `AGENTS.md` explicitly say:
- `/home/ricky/kb` is the canonical shared knowledge base
- do not create a second KB in the workspace

This means:
- KB is available from the workspace
- but there is no evidence that all KB content is auto-loaded
- KB should remain **search/read-on-demand**

## 4.2 `docs/`

Main workspace `docs/` includes at least:
- `source-of-truth.md` — **1,226 chars** (~306 tokens)

This file is explicitly in the startup pass in `AGENTS.md`, so it should be considered part of practical startup context.

Recommendation:
- keep it
- keep it short
- it is already reasonably small

---

## 5. Bootstrap hook analysis

## 5.1 `supabase-bootstrap/handler.js`

What it actually does:
- runs on `agent/bootstrap`
- injects a synthetic `BOOTSTRAP.md`
- writes a lightweight heartbeat row to Supabase `agent_heartbeats`

What it injects:
- knowledge persistence reminder
- `knowledge/` directory guidance
- correction/unanswered note guidance
- `kb/` is read-only

### Context cost
- **222 chars**
- **~56 tokens**

### Main issue
The cost is tiny, but the content looks stale for the current workspace model because it still points to `knowledge/` instead of the current `memory`/KB/builds reality.

### Recommendation
- **TRIM/FIX** the injected reminder
- make it reflect the actual current workspace model

## 5.2 `dependency-check/handler.js`

What it does:
- runs on bootstrap
- checks Supabase reachability
- checks workspace presence of `SOUL.md` or `CLAUDE.md`
- writes a local health JSON file
- if Supabase is unreachable, injects a hard degraded-mode warning bootstrap block and sends Telegram alert

### Degraded-mode injected block size
The warning text is approximately:
- **411 chars**
- **~103 tokens**

### Normal-context impact
- none, unless Supabase is down

### Recommendation
- **KEEP**; negligible normal cost and useful safety behaviour

## 5.3 `agent-activity-logger/handler.js`

What it does:
- logs session start/end activity to Supabase
- sends session start/end messages to Telegram activity group

### Prompt impact
- **none** injected into bootstrap context

### Recommendation
- irrelevant for context size

## 5.4 `supabase-memory/handler.js`

What it does:
- on command end, posts `last_completed` heartbeat to Supabase

### Prompt impact
- **none** injected into bootstrap context

### Recommendation
- irrelevant for context size

## 5.5 What data comes from Supabase at bootstrap? How much?

From the visible hook files checked here:
- `supabase-bootstrap` writes heartbeat and injects only a tiny static reminder
- `dependency-check` injects only a degraded-mode warning if Supabase is unavailable
- `agent-activity-logger` and `supabase-memory` only log activity

So from the audited hooks alone:
- **no large Supabase memory snapshot is being injected here**
- the visible bootstrap additions are tiny

This strongly supports the conclusion that any very large effective context cost is coming from **non-file runtime layers**, not these hooks.

---

## 6. OpenClaw config context settings

From `~/.openclaw/openclaw.json`:

| Setting | Value | Notes |
|---|---|---|
| `agents.defaults.bootstrapTotalMaxChars` | `45000` | Strong evidence that bootstrap file loading is capped at 45k chars |
| `agents.defaults.contextTokens` | `1000000` | Very large model context window |
| `agents.defaults.memorySearch.enabled` | `true` | Search is enabled |
| `agents.defaults.memorySearch.extraPaths` | `["knowledge/", "docs/", "data/", "kb/"]` | Suggests searchable extra paths, not auto-loaded paths |
| `agents.defaults.contextPruning.mode` | `cache-ttl` | Cached context pruning mode |
| `agents.defaults.contextPruning.ttl` | `12h` | Cached context survives up to 12h |
| `agents.defaults.compaction.mode` | `safeguard` | Compaction protection mode |
| `agents.defaults.compaction.memoryFlush.enabled` | `true` | Flush prompt before compaction |
| `agents.defaults.compaction.memoryFlush.softThresholdTokens` | `100000` | Memory-flush threshold |
| `tools.profile` | `full` | Broad tool surface |
| `tools.exec.security` | `full` | Full exec availability |
| `tools.exec.ask` | `off` | No approval ask mode by default |

## Interpretation

### `bootstrapTotalMaxChars`
This is the decisive config clue.
If the startup file bootstrap were really ~600KB+, it would violate the configured **45,000 char** cap.

So the visible file bootstrap cannot explain the 600KB claim.

### `memorySearch`
This looks like search enablement across extra paths, not “load these into every prompt.”
That is consistent with the rest of the observed behaviour.

### `contextPruning` / `compaction`
These shape long-session behaviour and cached context, but they do not explain a giant file bootstrap.

---

## 7. Classification summary and recommendations

## 7.1 KEEP in startup

These belong in the lean core startup set:
- `SOUL.md`
- `USER.md`
- `WORKING-STATE.md`
- `docs/source-of-truth.md`
- today memory file
- yesterday memory file
- a lean `MEMORY.md` for main Ricky session

## 7.2 TRIM hard

These are useful but too verbose or partly redundant:
- `CLAUDE.md`
- `MEMORY.md`
- `AGENTS.md`
- `IDENTITY.md`
- injected bootstrap note

## 7.3 Move to ON-DEMAND

These should not be part of always-loaded prompt context:
- `TOOLS.md`
- `HEARTBEAT.md`
- all foundation docs
- all KB except files explicitly read for the task
- older memory files

## 7.4 ARCHIVE

Archive almost all `memory/*` older than 2–3 days from active `memory/`, especially:
- long named investigations
- one-off incidents
- large planning notes
- anything already promotable to KB or build-local docs

---

## 8. Proposed slim context under 80KB

The brief target is **50–80KB**. Based on measured files, Jarvis’s visible file bootstrap is already under that. But here is a cleaner target anyway.

## 8.1 Proposed file list

| File | Target chars | Notes |
|---|---:|---|
| `SOUL.md` | 2,000–2,500 | identity + core operating rules |
| `CLAUDE.md` | 2,500–3,500 | source hierarchy + routing + reference docs only |
| `MEMORY.md` | 1,500–2,000 | durable truths only |
| `AGENTS.md` | 2,000–2,500 | startup checklist + role + authority rules only |
| `USER.md` | 400–700 | already close |
| `IDENTITY.md` | 0–150 | maybe merge into SOUL |
| `WORKING-STATE.md` | 500–1,500 | active task only |
| `docs/source-of-truth.md` | 800–1,200 | already close |
| `today memory` | 500–1,500 | concise daily trail |
| `yesterday memory` | 500–1,500 | concise daily trail |
| injected bootstrap note | 0–150 | if kept at all |

### Proposed lean startup total
Approximate target:
- **11,700 to 15,700 chars**
- **~2,925 to 3,925 tokens**

That is well below the 80KB target.

## 8.2 What should stay in trimmed `SOUL.md`

Keep only:
- Jarvis identity
- core posture
- delegation / routing principle
- verification rule
- high-risk boundaries
- continuity reminder

Remove:
- duplicative prose also in `CLAUDE.md`
- broad reference details that belong in a reference-doc section

## 8.3 What should stay in trimmed `CLAUDE.md`

Keep only:
- identity/role summary
- source hierarchy
- routing rules
- build vs KB vs workspace rules
- maybe live roster in compact form

Trim heavily:
- long path duplication
- anything better stored in KB/runtime docs
- any historic explanation not needed every session

## 8.4 What should stay in lean `MEMORY.md`

Keep only current durable truths Jarvis frequently needs, e.g.:
- OpenClaw live runtime and authority model
- KB as canonical shared knowledge base
- build orchestration rule
- a few important business facts Ricky expects remembered often
- one or two high-value safety/operating constraints

Remove from startup memory:
- old incidents
- one-off investigations
- detailed build/debug narratives
- material already promoted to KB/build docs

---

## 9. Archive plan for old memory files

## 9.1 Active memory should keep only
- today’s daily note
- yesterday’s daily note
- maybe one currently active incident note
- maybe one currently active strategic note

## 9.2 Archive first wave

Archive these immediately from active `memory/` after promotion review:
- all March files
- all named task files older than 3 days
- all files >10k chars unless actively in use today

## 9.3 Promote instead of keeping in memory

Promote to KB or build docs when appropriate:
- roster facts → `kb/team/`
- architecture and runtime conclusions → `kb/system/`
- BM tactical findings → BM build repo docs
- GSC/website debugging → website/marketing build docs
- Xero/integration findings → systems/build docs

---

## 10. Comparison with other agents

## 10.1 Alex (`alex-cs`)

Measured core bootstrap file set:
- **19,539 chars**
- **~4,885 tokens**

Memory directory:
- **5 files**
- **45,899 chars** total

Takeaway:
- leaner than Jarvis overall
- much smaller active memory corpus

## 10.2 Marketing

Measured core bootstrap file set:
- **9,133 chars**
- **~2,283 tokens**

Memory directory:
- **22 files**
- **274,523 chars** total

Takeaway:
- root bootstrap is very lean
- but active memory corpus is also bloated, though not as large as Jarvis’s

## 10.3 Comparison summary

| Agent | Core bootstrap chars | Core bootstrap est. tokens | Memory file count | Memory chars total |
|---|---:|---:|---:|---:|
| `main` | 24,026 | 6,007 | 46 | 363,873 |
| `main` practical startup incl. docs+recent memory+bootstrap | 29,420 | 7,355 | 46 | 363,873 |
| `alex-cs` | 19,539 | 4,885 | 5 | 45,899 |
| `marketing` | 9,133 | 2,283 | 22 | 274,523 |

### Comparison conclusion
- Jarvis is not abnormally huge at the **root startup file** level
- Jarvis is much larger in **active memory corpus size**
- Marketing has the same general pattern on a smaller scale
- Alex is significantly leaner

---

## 11. Final conclusions

## 11.1 What is actually expensive?

From the audited files and hooks, the expensive part is **not** the measured file bootstrap by itself.

Measured reality:
- practical startup file set: **~29KB**
- memory directory present in workspace: **~364KB**
- foundation docs available in workspace: **~46KB**

But there is no evidence that all memory files or all foundation docs are auto-loaded.

So if live per-message cost still feels like ~600KB+, the likely contributors are:
- hidden runtime/system prompt assembly
- large tool schemas / tool inventory
- session history / cached context
- possibly other injected metadata outside the visible workspace files

## 11.2 What should still be changed?

Even though the startup file set is smaller than expected, the workspace should still be tightened:

1. **Trim `CLAUDE.md`, `AGENTS.md`, and `MEMORY.md`**
2. **Move `TOOLS.md` and `HEARTBEAT.md` out of startup expectations**
3. **Archive older `memory/*` aggressively**
4. **Promote durable findings into KB or build repos**
5. **Fix stale `supabase-bootstrap` guidance referencing `knowledge/`**

## 11.3 Best estimate of a lean Jarvis startup context

A safe lean Jarvis startup could be:
- `SOUL.md`
- `USER.md`
- `WORKING-STATE.md`
- `docs/source-of-truth.md`
- tiny `MEMORY.md`
- today + yesterday memory files
- tiny bootstrap reminder if needed

That would likely total only **~10–16KB** of file-loaded text.

So the path to a real **50–80KB total prompt** is not mainly “trim a giant workspace bootstrap.”
It is:
- keep workspace bootstrap lean
- **and then audit hidden runtime/system/tool overhead next**

That is where the missing cost almost certainly lives.

---

## Sources checked

### Main workspace
- `/home/ricky/.openclaw/agents/main/workspace/SOUL.md`
- `/home/ricky/.openclaw/agents/main/workspace/CLAUDE.md`
- `/home/ricky/.openclaw/agents/main/workspace/MEMORY.md`
- `/home/ricky/.openclaw/agents/main/workspace/AGENTS.md`
- `/home/ricky/.openclaw/agents/main/workspace/TOOLS.md`
- `/home/ricky/.openclaw/agents/main/workspace/USER.md`
- `/home/ricky/.openclaw/agents/main/workspace/IDENTITY.md`
- `/home/ricky/.openclaw/agents/main/workspace/HEARTBEAT.md`
- `/home/ricky/.openclaw/agents/main/workspace/WORKING-STATE.md`
- `/home/ricky/.openclaw/agents/main/workspace/docs/source-of-truth.md`
- `~/.openclaw/agents/main/workspace/memory/*`
- `~/.openclaw/agents/main/workspace/foundation/*`
- `~/.openclaw/agents/main/workspace/kb/`

### Hooks
- `/home/ricky/.openclaw/hooks/supabase-bootstrap/handler.js`
- `/home/ricky/.openclaw/hooks/dependency-check/handler.js`
- `/home/ricky/.openclaw/hooks/agent-activity-logger/handler.js`
- `/home/ricky/.openclaw/hooks/supabase-memory/handler.js`

### Runtime config
- `/home/ricky/.openclaw/openclaw.json`

### Comparison agents
- `/home/ricky/.openclaw/agents/alex-cs/workspace/*`
- `/home/ricky/.openclaw/agents/marketing/workspace/*`

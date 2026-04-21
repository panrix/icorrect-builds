# CONVENTIONS — Runtime write rules, durability, naming

The contract every skill and helper follows. Violations produce incidents.

## Durability classification

| Class | Where | Git | Cleanup |
|-------|-------|-----|---------|
| **Canon** | `_shared/canon/` | Tracked | Never auto-deleted |
| **Templates** | `_shared/templates/` | Tracked | Never auto-deleted |
| **Skills** | `_shared/skills/`, `<agent>/skills/` | Tracked | Deleted only via `/create-skill` with explicit approval |
| **Agent identity** | `<agent>/{SOUL,CLAUDE,IDENTITY,AGENTS,MEMORY,TOOLS,HEARTBEAT,WORKING-STATE}.md` | Tracked | Updated via `write-state` or skill; never auto-deleted |
| **Agent memory** | `<agent>/memory/YYYY-MM-DD.md` | Tracked | Daily; archive by year after 365d |
| **Durable records** | `_shared/records/{decisions,delegations,incidents,qa-plans}/` | Tracked | Never auto-deleted |
| **Runtime state** | `_shared/state/*.json`, `_shared/state/*.jsonl`, `_shared/state/*/` | **Gitignored** | Per runtime-artifacts policy (handoff-scratch: 30 min; imports: 30 days after consume; etc.) |
| **Operational logs** | `_shared/logs/*.log`, `_shared/logs/*.jsonl` | **Gitignored** | Rotated via `logrotate` at 50MB, 5 generations |
| **Secrets** | `_shared/bridge/envs/*.env` | **Gitignored** | Rotation policy per credential in `credential-rotation.md` |

## Atomic writes

All state file writes go through `_shared/bin/write-state`. Two-phase commit with `.bak` rollback — see the Session-handoff section of the build plan for the full contract.

**Forbidden:** direct `Edit` or `Write` tool use on `WORKING-STATE.md`, `agents.json`, `workers.json`, `monday-queue.jsonl`, `intake-progress.json`, `intake-draft-*.json`, `bridge-activity.json`, `infra-snapshot.json`. `write-state` or its owning subsystem (bridge for `bridge-activity.json`) are the only writers.

## Checkpoint manifest

`/session-handoff` uses a fixed checkpoint manifest. The current contents of these files are copied into `memory/YYYY-MM-DD.md` under `## Checkpoints`:

- `_shared/state/intake-progress.json`
- `_shared/state/workers.json`
- `_shared/state/agents.json`
- `_shared/state/monday-queue.jsonl` — last 50 lines only

## Stale handoff quarantine

Scratch files older than 30 minutes are treated as stale handoff artifacts. `_shared/bin/sweep-runtime` quarantines `.bak-*` and `.tmp-*` from `_shared/state/handoff-scratch/` into `_shared/records/incidents/stale-handoff/`.

## Log rotation cadence

Log rotation runs on bridge startup and every 5 minutes after that from the bridge's 60-second tick (`tick_count % 5 == 0`). The bridge invokes `logrotate -s <statefile> <config>` so long-running services stay bounded without cron.

## Queue integrity offset tracking

`_shared/bin/sweep-runtime` persists `_shared/state/queue-validated-offset.txt` as the byte offset of the last known-good line end in `monday-queue.jsonl`. Each run validates forward from that offset and advances it only on success. The first invalid line freezes the offset and triggers an incident plus Telegram alert. The midnight UTC+8 tick also runs a full rescan from byte 0 inside the same tick mutex.

## Tool-use attribution

Incident attribution reads `_shared/state/skill-invocations.jsonl`, which is disk-persisted and survives restarts. Retention is time-windowed: keep any record whose `start_ts` is within the last 2 hours. Active invocations with no `end_ts` are never pruned. If attribution is ambiguous or missing, report `unknown (see skill-invocations.jsonl for window)` rather than inventing a skill name.

## Startup sweep responsibilities

`_shared/bin/sweep-runtime` runs on every bridge startup and every 5 minutes thereafter. Its responsibilities are:

1. Quarantine stale handoff scratch older than 30 minutes to `_shared/records/incidents/stale-handoff/`.
2. Rotate `_shared/logs/` files over 50MB via `logrotate`.
3. Purge `imports/*.consumed` older than 30 days.
4. Run queue-integrity validation using `queue-validated-offset.txt`, with the midnight UTC+8 full rescan handled inside the same tick mutex.
5. Report anomalies to Telegram once per day, deduplicated.

## Naming

- **Timestamps in filenames:** ISO-8601 UTC+8 compact — `2026-04-20T14-30-00` (no colons, filename-safe)
- **Handoff IDs:** ULID (monotonic, sortable)
- **Incident files:** `<kind>-<timestamp>.md` under `_shared/records/incidents/`
- **Delegation records:** `<delegation-id>.md` under `_shared/records/delegations/`
- **QA plans:** `<project-slug>-<timestamp>.md` under `_shared/records/qa-plans/`
- **Daily memory:** `YYYY-MM-DD.md` under `<agent>/memory/`

## Timezone

**All time-of-day in this system is UTC+8 (Ricky's Bali time) via explicit `TZ=Asia/Singapore`.** The VPS system clock is UTC. Every systemd unit, every scheduler, every timestamp in a user-facing artifact uses the explicit TZ. VPS-UTC times appear only in debug logs with explicit labeling.

## Logging discipline

- **Never log tokens, passwords, API keys, or customer PII** — even at debug level.
- **Incidents go to Telegram.** `_shared/records/incidents/<kind>-<ts>.md` + Telegram alert per the runtime-artifacts policy.
- **Silent failures are a bug.** If a write fails, an incident is logged.
- **Tool-use attribution** is honest. When a skill can't be identified, say "unknown (see skill-invocations.jsonl for window)" — never fabricate.

## Machine-owned files

Any file with `_version_hash` in its YAML frontmatter is machine-owned. `write-state` computes the hash at commit via canonical JSON (parse YAML → sort keys → `json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=False)` → SHA256). Direct edits are detected on next bridge tick and logged as `working-state-hash-mismatch-<ts>.md` (or equivalent) incident.

## Kill-switch

Three paths, all lock, all require SSH to unlock:

1. **Signed `/kill <passphrase>`** — HMAC-verified against `KILL_HMAC` env. Works from any Telegram client.
2. **Monday `kill-switch` column poll** — 60s cadence. Non-empty non-`OK` → LOCKED.
3. **SSH + `BRIDGE_LOCKED=1`** — env variable set, bridge restart.

LOCKED state is persisted to `_shared/state/bridge-locked.flag` and cleared only by root-owned `_shared/bin/bridge-unlock`.

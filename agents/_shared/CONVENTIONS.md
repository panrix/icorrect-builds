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
- **Tool-use attribution** is honest. When a skill can't be identified, say "unknown (see skill-invocations.jsonl)" — never fabricate.

## Machine-owned files

Any file with `_version_hash` in its YAML frontmatter is machine-owned. `write-state` computes the hash at commit via canonical JSON (parse YAML → sort keys → `json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=False)` → SHA256). Direct edits are detected on next bridge tick and logged as `working-state-hash-mismatch-<ts>.md` (or equivalent) incident.

## Kill-switch

Three paths, all lock, all require SSH to unlock:

1. **Signed `/kill <passphrase>`** — HMAC-verified against `KILL_HMAC` env. Works from any Telegram client.
2. **Monday `kill-switch` column poll** — 60s cadence. Non-empty non-`OK` → LOCKED.
3. **SSH + `BRIDGE_LOCKED=1`** — env variable set, bridge restart.

LOCKED state is persisted to `_shared/state/bridge-locked.flag` and cleared only by root-owned `_shared/bin/bridge-unlock`.

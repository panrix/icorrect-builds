# TOOLS — API references & endpoints for Lucian

External APIs and internal helpers Lucian uses. Read-on-demand — not auto-loaded at session start.

## Monday.com

- **Token source:** `/home/ricky/config/api-keys/.env` — `MONDAY_APP_TOKEN` (read-only from here; never echo to chat or log)
- **Endpoint:** `https://api.monday.com/v2`
- **Existing wrapper:** `/home/ricky/builds/alex-triage-rebuild/lib/monday.js`
- **Board IDs:** populated via `/intake` (Phase 4); Agents board is created in Phase 7 from `_shared/monday/agents-board-schema.json`
- **Agents board:** Phase 7 deliverable; writes until then go to `_shared/state/monday-queue.jsonl` via `queue-validator.validate()` and drain idempotently on first sync
- **Column reference (ground truth for all IDs):** `/home/ricky/builds/backmarket/docs/VERIFIED-COLUMN-REFERENCE.md`
- **API budget:** per plan, ~1,830 reqs/agent/day aggregate (60s kill-switch poll + 5-min sync + ad-hoc). Stay well under Monday's 10K/min.

## Telegram (outbound)

- **Bot token / config:** `_shared/bridge/envs/chief-of-staff.env` (created in Phase 3 — `TELEGRAM_BOT_TOKEN`, `ALLOWED_USER_ID`, `KILL_HMAC`)
- **Allow-list:** `ALLOWED_USER_ID` — only Ricky's user ID. Bridge enforces at the network boundary.
- **Existing client wrapper:** `/home/ricky/builds/customer-service/modules/enquiry/lib/telegram-client.js`
- **Rich cards:** `/home/ricky/builds/customer-service/modules/enquiry/lib/card-formatter.js`
- **Message size limit:** 4,096 chars per message. Longer replies must split; bridge handles splitting with `[silent-mode backlog N/M]` prefixing when applicable.

## Codex (Agent tool — build path, automated)

- **Subagent type:** `codex:codex-rescue`
- **Invocation:** Use the `Agent` tool with `subagent_type: "codex:codex-rescue"` and a self-contained brief following the Agent Delegation Protocol.
- **Brief location:** `_shared/canon/agent-delegation-protocol.md`
- **Supporting paths:** `_shared/records/delegations/` for durable outcome summaries; `_shared/logs/delegations.jsonl` for operational log
- **Fresh per call** — Codex retains no memory across invocations. Pass all context in the brief.

## Codex Desktop (manual handoff — product QA path)

- **No programmatic API.** A human operator (Ricky) runs it manually.
- **Handoff flow:** `/test-loop` writes a QA plan to `_shared/records/qa-plans/<project>-<ts>.md` (git-tracked), sends the path via Telegram, and waits for findings.
- **Findings return paths:**
  1. File drop (preferred) — `_shared/state/qa-findings/<project>-<ts>.md`, then `/test-loop findings ready`
  2. Single-message paste (≤3,500 chars)
  3. Multi-message paste — `/test-loop findings paste` … `/test-loop findings done`

## Git

- **Repo:** `panrix/icorrect-builds`
- **Local path:** `/home/ricky/builds/`
- **Protected branch:** `master` (never force-push; always create PRs for merges to master)
- **Working branch for this build:** `feat/agents`
- **Commit discipline:** `/checkpoint` skill commits with structured messages. Never commit secrets. `.env` files and `_shared/state/`, `_shared/logs/` are gitignored.

## External APIs (stubs — wire when a skill needs them)

| API | Purpose | Status |
|-----|---------|--------|
| **Intercom** | Customer service inbox, drafts, status | Stub — Alex (alex-cs agent, OpenClaw) currently owns this; Lucian only references via Alex if needed |
| **Shopify** | Orders, variants, tracking | Stub — read-only via existing scripts in `customer-service/` |
| **Xero** | Invoices, reconciliation | Stub — wire at finance-truth-rebuild phase |
| **BackMarket** | Listings, buy-box, pricing | Stub — operational reads route to Operations (Phase 8); Lucian gets summaries, not raw queries |

## Internal tools (this system)

| Tool | Where | Purpose |
|------|-------|---------|
| `write-state` | `_shared/bin/write-state` | Atomic 2-phase commit writer for machine-owned state files. The ONLY legal writer of `WORKING-STATE.md`, `agents.json`, `workers.json`, `monday-queue.jsonl`, etc. |
| `delegate` | `_shared/bin/delegate` | tmux send-keys + idle-detect + capture into a worker pane |
| `spawn-worker` | `_shared/bin/spawn-worker` | Create a new tmux window running `claude` for a worker role |
| `install-agent` | `_shared/bin/install-agent` | Render `.claude/settings.json` from template for a top-level agent |
| `verify-load-proof` | `_shared/bin/verify-load-proof` | `--dry-run` (parse only) or `--live` (real Claude session) — prove SOUL/CLAUDE are actually loaded |
| `sweep-runtime` | `_shared/bin/sweep-runtime` | Startup + 5-min sweep: stale handoffs, log rotate, queue integrity, disk check |
| `log-tool-use` | `_shared/bin/log-tool-use` | PostToolUse hook handler — appends to `_shared/logs/tool-use-chief-of-staff.jsonl` |
| `backoff.sh` | `_shared/bin/backoff.sh` | Shared exponential-backoff helper (sourced, not executed) |
| `export-openclaw-agents` | `_shared/bin/export-openclaw-agents` | **Migration-only.** Human-run once; emits JSONL to `_shared/state/imports/` in `/intake agents` shape. Not invoked at agent runtime. |
| `bridge-unlock` | `_shared/bin/bridge-unlock` | Root-owned (0700). Clears `bridge-locked.flag` and logs to incidents. SSH required. |
| `queue-validator.js` | `_shared/monday/queue-validator.js` | AJV-backed JSON Schema validation for every record emitted to `monday-queue.jsonl`. Call before append. |

## Schemas (Monday queue — v1)

`_shared/monday/schemas/v1/`:

- `queue-record.schema.json` — envelope
- `payload-project.schema.json`
- `payload-worker.schema.json`
- `payload-agent.schema.json`
- `payload-delegation.schema.json`
- `payload-decision.schema.json`

Any skill appending to `monday-queue.jsonl` MUST call `queue-validator.validate()` first. Rejects route to `_shared/records/incidents/queue-rejects.jsonl`.

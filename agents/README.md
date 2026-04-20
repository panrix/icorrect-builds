# `builds/agents/` — Claude Code-based agent system (v2)

Ricky's replacement for OpenClaw. Each top-level agent is a persistent Claude Code session in a named tmux session, bridged to Telegram. Workers live as tmux windows under a parent agent. Codex handles all code-writing.

## Top-level agents

| Agent | Role | Status | Bot |
|-------|------|--------|-----|
| [chief-of-staff/](chief-of-staff/) | **Lucian** — Ricky's primary orchestrator; ruthless organiser, one step ahead | In build (Phase 1a, 2026-04-20) | ⏳ |
| operations/ | Ops domain — Monday queue, KPIs, nightly housekeeping | Phase 8 | — |

Future agents (Customer Service, BackMarket, Marketing) spawn via `/spawn-new-agent` once the template is proven.

## Architecture at a glance

```
          Ricky (UTC+8, on his phone)
                    |
          Telegram ─┴─ Terminal / iOS SSH
                    |
          ┌─────────┴─────────┐
          │ Per-agent bot     │     ← one Telegram bot per top-level agent
          └─────────┬─────────┘
                    |
          ┌─────────┴─────────────────┐
          │ tmux session: <agent>     │     ← systemd service, auto-starts
          │   win 0: main (Claude CLI)│
          │   win 1..N: workers       │
          └─────────┬─────────────────┘
                    |
          ┌─────────┴───────┐     ┌─────────────────────┐
          │ Codex (CLI)     │     │ Codex Desktop       │
          │ code/build path │     │ product QA (manual) │
          └─────────────────┘     └─────────────────────┘
                    |
          ┌─────────┴────────────┐
          │ Monday agents board  │     ← synced every 5 min by Chief of Staff
          │ mission control view │
          └──────────────────────┘
```

## Directory layout

- `_shared/` — all infrastructure shared between agents (bridge, bin helpers, templates, schemas, hooks, canon, skills, records, logs, state)
- `<agent>/` — one directory per top-level agent with its identity files, skills, memory, and per-agent bin

See [`_shared/CONVENTIONS.md`](_shared/CONVENTIONS.md) for the runtime write rules and durability classification.

## Build plan

The full phased plan lives at [`chief-of-staff/plan.md`](chief-of-staff/plan.md) (copied from `/home/ricky/.claude/plans/` at Phase 1a). 10 rounds of QA in the decisions table. Phase status tracked in the main todo list.

## Key rules

- **Claude orchestrates, Codex builds.** See `_shared/canon/agent-delegation-protocol.md`.
- **Runtime state is gitignored; durable records are tracked.** See `_shared/CONVENTIONS.md`.
- **Three-path kill-switch.** Signed `/kill`, Monday flag, SSH env. Never SSH-only.
- **Zero runtime dependency on `~/.openclaw/`.** OpenClaw is retirable without breaking this system.

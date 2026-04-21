# USER — Ricky

> The user of every agent in this system. Ricky is the only allow-listed Telegram identity; every other `from.id` is untrusted by construction. This file is loaded at every agent's session start (symlinked as `USER.md`) and is the authoritative source of truth about who is commanding the system.

## Who

- **Name:** Ricky Panesar
- **Email:** ricky@panrix.co.uk
- **Company:** Panrix Limited, trading as **iCorrect** — specialist Apple repair (iPhone, iPad, Mac, including board-level work)
- **Role:** Founder and director. Runs the business remotely; operates as the final decision-maker on architecture, hires, strategy, and agent behaviour.

## Where

- **Primary location:** Bali, Indonesia — **UTC+8**
- **Workshop / team:** London — **UTC+0/+1** (BST/GMT)
- **Time-of-day convention:** every time reference in agent output names a timezone explicitly. "09:00 UTC+8" or "17:00 London", never bare "09:00".
- **VPS:** Hetzner Cloud + Ubuntu 24.04, system clock `Etc/UTC`. Systemd timers explicitly set `TZ=Asia/Singapore` to match Bali.

## Team (London workshop, ~7 staff)

Ground truth lives in `../TEAM.md` once `/intake people` populates it. Current roster (from historical audits, Feb–Mar 2026):

- **Ferrari** — senior technician; pricing and customer-quote authority; Alex's primary reviewer
- **Mykhailo** — technician; Monday `user_id 64642914`
- **Andreas** — technician + front-desk cover; `user_id 49001724`
- **Safan** — technician; `user_id 25304513`
- **Roni** — technician; `user_id 79665360`
- **Naheed** — technician; assistant to Roni (replaced Adil; same role as Adil had)

(Promote to `TEAM.md` during first `/intake people`.)

## How he works

- **Channel:** Telegram — primary. Voice notes, quick text, forwarded images.
- **Device:** phone most of the time; occasional SSH / Blink / VS Code when at a desk.
- **Cognitive profile:** ADHD. Short replies, structured output, action-oriented. Walls of text get skipped.
- **Preferred cadence:** dump thoughts → agent parses + structures → he acts. Not "agent asks 5 clarifying questions first."
- **When blocked on an agent's reply:** assumes silence = broken. Proactive `/proactive-update` is the cure, not the exception.

## What he values

- **Action over planning.** Start, report, narrow scope. Don't front-load a 20-item question list.
- **Honesty over completion.** A half-built thing honestly described beats a "complete" thing that silently doesn't work. Every build session ends with a COMPROMISES section if any corners were cut.
- **Verified over asserted.** Facts come from the source (API, file, commit), not from memory. "I don't know" is a legitimate answer; a confident wrong answer is expensive.
- **Terse over verbose.** Summaries in 2–3 sentences. Dashboards in one Telegram message. Files end with a structured artifact, not a soliloquy.
- **Scripts for truth, agents for judgement.** If it's deterministic, it's a script or cron. Agents only get invoked for reasoning, drafting, or analysis where the LLM adds value proportional to its cost.
- **Clean break from OpenClaw.** The new agent system must be retirable without OpenClaw. No symlinks, no runtime reads, no hidden dependencies.

## What he doesn't tolerate

- **Sycophancy.** "Great question!", "Certainly!", "I'd be happy to." Delete on sight.
- **Silent drift.** Agents that work for an hour without surfacing progress.
- **Scope creep without a flag.** If the work grew, say so and offer to split.
- **Hedging when a decision is made.** Once he's decided, execute — don't relitigate.
- **Narrated thinking.** "Let me think about this… let me check that…" State results, not process.

## How he delegates

- **Claude Code** (here) orchestrates — plans, specs, QA, coordination, research.
- **Codex** (OpenAI) builds — code, scripts, migrations, bug fixes. Self-contained briefs over the `Agent` tool or Codex Desktop for product/UI QA.
- **Agents (this system)** run operations — Lucian (Chief of Staff), Operations (Phase 8), and whatever comes next. Each on its own Telegram bot.
- **Workers** are spawned per-task under a parent agent (tmux windows). Short-lived. Not user-facing.

## Communication rules agents follow with him

1. **First response parses the input.** No "what do you mean?" as a first reply.
2. **Every reply ends with a structured artifact.** List, table, plan, or decision — never an open-ended question.
3. **Proactive updates when state changes.** Worker finishes → push. Blocker hit → push. Next-move surfaced → push.
4. **Cite every factual claim.** `path:line`, API response, commit hash — something pointable.
5. **Propose before asking.** When clarification is needed, offer 2–3 options with a recommendation, not a blank question.

## Business context (one-paragraph brief)

iCorrect is a specialist Apple repair shop in central London — ~7 staff, workshop-based, with high-skill board-level work as a differentiator. Customer-facing channels are Shopify (web), Intercom (chat/email), and phone. Operations flow through Monday.com (repair queue, parts, team performance). Backmarket is the largest resale channel for buyback devices. Ricky operates remotely from Bali and commands the business — both humans and agents — via Telegram from his phone.

## Pointers

- `COMPANY.md` — business mission, structure, scale
- `GOALS.md` — current strategic goals (refreshed quarterly via `/intake business`)
- `TEAM.md` — team roster, roles, who does what
- `PRINCIPLES.md` — system-level operating principles
- `VISION.md` — multi-year direction
- `PROBLEMS.md` — known issues and constraints

> Agents: read only this file at startup. Load the others on demand when a skill or task needs them.

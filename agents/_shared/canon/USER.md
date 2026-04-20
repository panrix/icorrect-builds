# USER — Ricky Panesar

**Role:** Founder & Director, iCorrect (Panrix Limited)
**Location:** Bali (UTC+8)
**Team:** ~7 staff in London workshop (UTC+0/+1)
**Communication style:** ADHD — concise, actionable, no filler. Structured output (lists, tables, decisions) over prose. Pushes back when unclear.

## Profile

Technical founder running a specialist Apple repair business remotely. Commands agents from his phone via Telegram; uses Claude Code on a Hetzner VPS. Deep context on business operations, Backmarket, Monday, Intercom, Shopify, and the full agent architecture.

## How he likes to work

- **Chief of Staff (Lucian) is his primary touchpoint.** Every domain — operations, customer service, marketing, backmarket — flows through Lucian first.
- **Claude orchestrates, Codex builds.** Coding work routes to Codex; Claude agents think, plan, review, coordinate.
- **Active management over parking-lot framing.** Agents push updates proactively, come back with "what next?" options, never sit silent.
- **Research → Plan → Build → Verify** for every project. Plans go in `builds/<project>/plan.md`, not Claude internals.
- **One phase at a time.** Never compress multi-phase work into a single session.

## Banned patterns when talking to Ricky

- Sycophancy ("Great question!", "Certainly!")
- Open-ended "what do you think?" endings — every interaction closes with a structured artifact.
- Clarifying questions as first response to vague input — parse first, act, report.
- Hedging language ("could", "might", "perhaps", "would you like") when a decision has been made.
- Narration of internal steps — state results and decisions directly.

## Context agents should know

- **OpenClaw retirement in progress** — `~/.openclaw/` is reference-only, no runtime dependency.
- **Backmarket (BM)** is a major revenue stream — buy-box health, listing reconciliation, and sale/dispatch SOPs are ongoing ops.
- **Monday.com** is the canonical board state; main board `349212843`, BM devices board `3892194968`.
- **Intercom** is customer service. Alex (CS agent) drafts replies.
- **Shopify** drives the main website. PostHog tracks conversion.
- **Xero** is the accounting system.

## How to refer to him

- By name in direct chat: "Ricky"
- In records / summaries: "Ricky" or "the owner" — not "the user" (cold), not "Mr Panesar" (formal)

## Timezone rule

Ricky is UTC+8. All times in skills, briefs, and memory logs use UTC+8 via explicit `TZ=Asia/Singapore`. Never UTC unless explicitly noting "VPS clock" for debugging.

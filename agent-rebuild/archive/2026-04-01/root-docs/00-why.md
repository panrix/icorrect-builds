# 00 — Why We're Rebuilding

**Date:** 2026-02-25
**Updated:** 2026-02-26 — Added doc series table for new docs.
**Purpose:** The context document. Why this rebuild exists, what it's building on, and where it's going.

---

## What iCorrect Is

iCorrect is a phone and device repair business. Walk-in repairs, mail-in repairs, and BackMarket trade-ins and sales. BackMarket alone is ~60% of revenue (~31k/month). The team is small — Ferrari (lead tech, remote), Andres, Meesha, and Ricky managing remotely from abroad.

Remote management is the key constraint. Ricky is not in the workshop. Everything he knows comes through Monday.com, Slack, Intercom, and the data these systems produce. That is why AI agents matter here — they are not a novelty, they are the mechanism for running the business.

---

## What Agents Do Here

Each agent owns a business domain: BackMarket operations, workshop queue management, customer service, inventory, finance. They monitor data feeds, follow SOPs, answer questions, flag problems, and — in some cases — take actions via APIs.

The vision is bigger than a repair shop. If this works — agents reliably running business operations from structured SOPs and live data — it is a model that could change how the entire industry operates. Small businesses running with AI-augmented teams, not just AI chatbots.

But that only happens if the foundations are right.

---

## What v2 Was

Between February 12-18, 2026, we went from 1 agent (Jarvis, doing everything) to 11 agents with sub-agent definitions, a Mission Control infrastructure (Supabase, webhooks, QA pipeline), and cron jobs. Six days, start to finish.

The pace was the problem. Agents were created ad-hoc with no shared template. Memory was built three times (file-based, CLI tool, Supabase bridge) — none enforced, none reliable. SOPs existed but agents ignored them. Workspaces became dumping grounds. The BackMarket agent — handling 60% of revenue — was making mistakes because it was not reliably following its own procedures.

v2 proved that agents *can* work. It also proved that building fast without structure creates a mess that gets worse over time.

---

## Why v3

In Ricky's words:

> *"If I'm being very honest, this is a complete mess. Just go through the folders and look at the disorganisation — it's a dumping ground. Because of that, we've had issues with BackMarket not following SOPs, and I can't build the way I want to build."*

> *"This has to be built on strong foundations because then I get the opportunity to build everything I want to build, and also I get to revolutionise the way this industry works. That only happens if it's on strong foundations — the structure of our files, how our memory works — that's completely rock solid."*

The rebuild is not about adding features. It is about making what exists work properly:

- **Agents that follow SOPs because SOPs are verified, structured, and present in the workspace**
- **Memory that persists without relying on agent compliance**
- **Workspaces that stay clean because the structure enforces it**
- **Fewer agents, each proven before the next one launches**

---

## How We Build v3

Two roles during the rebuild:

| Who | Does what |
|-----|-----------|
| **Code** (Claude Code, SSH sessions) | Technical work: API docs, config audits, doc index, workspace builds, crons, verification |
| **Research agents** (Telegram, one at a time) | Help Ricky extract and structure process knowledge into verified SOPs |

Research agents are documentation partners, not autonomous researchers. They present existing docs, ask Ricky specific questions, and write up what he confirms. Code does the technical groundwork and builds the infrastructure.

No Jarvis during the rebuild. Ricky routes between Code and agents. One domain at a time, prove then scale.

---

## What This Document Series Covers

| Doc | Title | What It Answers |
|-----|-------|----------------|
| 00 | Why We're Rebuilding | You're reading it. Context and motivation. |
| 01 | Lessons Learned | What went wrong in v2. Every mistake becomes a design constraint. |
| 02 | Knowledge Map | What documentation exists, where it lives, what's verified, what's missing. |
| 03 | Sequencing | What gets built first and why. The dependency chain. |
| 04 | Agent Architecture Spec | The template. What an agent IS — file structure, SOPs, memory, data feeds. |
| 05 | The Memory Problem | Why memory failed 3 times and why structure beats engineering. |
| 06 | Jarvis Fixes | Quick wins applied to Jarvis before the rebuild. |
| 07 | Supabase Audit | What data exists, what is missing, where crons should pull from. |
| 08 | Research Needed | All research tasks, split by Code (technical) vs Agent (process). |
| 09 | Research Agents | How research agents work, templates, transition plan. |
| 10 | Handoff | Complete context for the next session to continue. |

---

## The Thesis

Build fewer agents. Make each one reliable. Prove it works. Then scale.

v2 asked: *"How many agents can we build?"*
v3 asks: *"How good can we make one agent?"*

The answer to the second question is the foundation for everything that comes after.

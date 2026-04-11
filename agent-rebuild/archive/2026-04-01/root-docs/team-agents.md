# Team Agents — 1:1 Per Team Member

## Two-Layer Architecture

### Layer 1: Domain Agents (build first)
- BM, CS, Ops, etc.
- Own the processes, data, SOPs, and platform access
- Monitor, flag, execute via sub-agents
- Ricky and leads interact with these
- Each domain lead has sub-agents that execute specific SOPs

### Layer 2: Team Agents (build second)
- One agent per team member (Ferrari, Saf, Andres, Mykhailo, Roni, etc.)
- Each knows that person's role, their relevant SOPs, their Monday view
- Team member talks to their agent for help, reminders, lookups
- Does NOT duplicate domain agents — references them

## Team Agent Structure

Per agent:
- Own Telegram DM (personal, not a group)
- SOUL.md = who this person is, what they do
- CLAUDE.md = their SOPs (subset from domain), their Monday columns, their escalation paths
- Model: Haiku or Sonnet — answering questions, not making strategic calls

## What Each Team Agent Needs

- Monday board access with that person's relevant columns and groups
- Platform access relevant to their role (read-only minimum)
- The SOPs that apply to their daily work (subset of domain SOPs)
- Escalation paths — when to flag to domain lead or Ricky

**Critical lesson (from Slack Jarvis and research-bm): an agent without platform access is useless. The team won't use it twice. Every agent must ship with real API access and schema docs.**

## Build Order

1. Verify domain SOPs with current agents (in progress)
2. Build production domain agents with verified SOPs + platform access
3. Let team use domain agents — their questions and confusion become the spec for team agents
4. Build team agents from that real usage data

## How Team Agents Relate to Domain Agents

Ferrari (front desk) → references: Comms SOPs, Shipping SOPs, some Repair SOPs
Saf/Andres/Mykhailo (techs) → references: Repair SOPs, Parts SOPs
Roni (QC) → references: QC SOPs, Repair completion SOPs

Team agents don't make domain decisions. They surface the right information for that person's daily work.

## Open Questions

- Do team agents need write access to Monday (e.g. updating their own items)?
- Should team agents be able to escalate directly to domain agents, or only to Ricky?
- Telegram DM or dedicated group per team member?

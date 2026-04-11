# Escalation Paths

Status: needs-operator-confirmation
Last verified: 2026-03-31
Verification method: local operating-model review + operator confirmation
Evidence sources:
- /home/ricky/kb/system/live-operating-map.md
- /home/ricky/kb/system/agent-map.md
- /home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/team-state.md
- current operating model docs under /home/ricky/kb/system
- operator confirmation still required

This document contains governance and routing rules. Treat it as a working draft until Ricky confirms the authority model and team handling.

---

## Decision Authority

| Decision Type | Who Decides | Notes |
|---------------|-------------|-------|
| Strategic decisions | Ricky | Vision, direction, major changes |
| Spending > £500 | Ricky | Must approve before committing |
| BM price changes | Ricky | All price changes need approval |
| BM order acceptance | Ricky | Reviews and manually accepts each order |
| BM payouts > £200 | Ricky | Must confirm before payout |
| Hiring / firing | Ricky | All personnel decisions |
| Client quotes | Ferrari | Sends repair quotes to customers |
| Client escalations | Ferrari | First human contact for complaints |
| QC decisions | Roni | Final quality gate -- QC fail is non-negotiable |
| BM diagnostics | Roni | Grade assessment and condition verification |
| Parts ordering | Roni | Stock management and supplier coordination |
| Refurb room | Misha | Day-to-day supervision of Andreas |
| Repair queue | Safan | Currently self-managed (no formal system) |

---

## Escalation Chains

### Urgent Workshop Issues
1. Ferrari first (client comms, operational decisions within authority)
2. Then Ricky (if Ferrari cannot resolve or needs approval)

### Repair/Technical Issues
1. Safan (for repair queue, diagnostic questions)
2. Roni (for QC disputes, parts availability)
3. Ricky (for board-level decisions, strategic repair choices)

### Client Complaints
1. Ferrari (first response, goodwill up to reasonable limits)
2. Ricky (if complaint is serious, refund > normal threshold, or legal)

### BM Trade-In Issues
1. Roni (diagnostics, grading, condition assessment)
2. Ferrari (customer communication, counter-offers)
3. Ricky (pricing decisions, order acceptance, payout approval)

### Parts / Stock Issues
1. Roni (stock check, reorder decision)
2. Ricky (large orders, new supplier approval)

### Agent System Issues
1. Main agent (primary coordinator for agent routing)
2. Systems agent (infrastructure, VPS, service issues)
3. PM agent (build planning and execution routing)
4. Ricky (approval for significant changes)

---

## Communication Channels

| Person | Primary | Secondary | Timezone |
|--------|---------|-----------|----------|
| Ricky | Telegram | Slack | UTC+8 (Bali) |
| Ferrari | Slack | Monday.com, Phone | UTC+0/+1 (Italy) |
| Safan | Slack | Monday.com | UTC+0/+1 (London) |
| Misha | Slack | Monday.com | UTC+0/+1 (London) |
| Roni | Slack | Monday.com | UTC+0/+1 (London) |
| Andreas | Slack | Monday.com | UTC+0/+1 (London) |

---

## Key Rules

- Ricky is UTC+8 (Bali). London team is UTC+0/+1. Always specify timezone.
- Morning briefing timing is an operator habit, not a fixed system rule. Confirm it before automating around it.
- Do not overload Ricky with operational noise during designated planning windows.
- Do NOT route operational tasks to Suzy (MD title only, not operationally active).

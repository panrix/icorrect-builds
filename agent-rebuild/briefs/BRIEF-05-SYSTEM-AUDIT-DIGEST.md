# Brief 05: System Audit Research Digest

**For:** Codex agent (read-only research)
**Output:** `/home/ricky/builds/agent-rebuild/system-audit-digest.md`

---

## Context

In late March/early April 2026, Jarvis spawned multiple Codex research agents that produced a large body of research about iCorrect's business operations. This research is spread across many files in `builds/system-audit-2026-03-31/`. We need a concise digest of the most important findings — the stuff that should inform what we build next.

## Task

### 1. Read the index
Start with `/home/ricky/fleet/system-audit-2026-03-31/README.md` to understand the full scope.

### 2. Read and summarise each major research file
Location: `/home/ricky/fleet/system-audit-2026-03-31/`

Priority files (read in full, summarise key findings):
- `business-viability-analysis.md` — overall business health
- `channel-economics.md` — revenue by channel, margins
- `financial-mapping.md` — Xero/accounting structure
- `staff-performance-analysis.md` — technician output, speed, quality
- `marketing-analysis.md` — growth, SEO, conversion
- `customer-retention-analysis.md` — repeat customers, LTV
- `logistics-supplier-analysis.md` — parts, shipping, suppliers
- `physical-capacity-analysis.md` — bench capacity, bottlenecks
- `competitor-benchmarking.md` — London market comparison
- `monday-updates-analysis.md` — free-text update mining

Also check for:
- `data_flows.md` — how data moves between systems
- `access_matrix.md` — what credentials/APIs are available
- `payment-truth-target-state.md` — payment tracking design
- Any files with "profitability" in the name
- `loopback-verification-2026-04-01.md` — consistency check

### 3. Read the product cards if they exist
Check for any per-product profitability data — files like `gsc-profitability-crossref*.md` or product card files.

### 4. Check what scripts were built
`/home/ricky/fleet/system-audit-2026-03-31/scripts/` — list all scripts, what they do, whether they're reusable.

### 5. Read the master questions file
`MASTER-QUESTIONS-FOR-JARVIS.md` — what questions were flagged as unanswered?

## Output format

Write to `/home/ricky/builds/agent-rebuild/system-audit-digest.md` with:

### Executive Summary (1 page max)
- Business health snapshot (revenue, margins, debt, trajectory)
- Top 3 opportunities identified
- Top 3 risks identified
- Key data gaps that block decisions

### Per-Domain Findings
For each domain (operations, finance, marketing, team, parts, customer service, website):
- 3-5 bullet points of the most important findings
- What data is available vs what's missing
- What decisions the data supports

### Automation Opportunities
From the research, what processes were identified as needing automation? What scripts were built that could be deployed?

### Unanswered Questions
From the master questions file and research gaps — what still needs investigating?

Keep it concise. This is a digest, not a copy. The full research stays in the original files for reference.

**Do NOT modify any files. Read-only research.**

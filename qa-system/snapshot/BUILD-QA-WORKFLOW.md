# Build + QA Workflow — Shared Documentation

**Purpose:** Build and QA agents write to shared docs. Master audit reviews both at the end.

---

## The Two Docs

| Doc | Who writes | Content |
|-----|------------|---------|
| `docs/qa-trigger/BUILD-LOG.md` | Build agents (Codex, Claude) | What was implemented, files changed, verification |
| `docs/qa-trigger/QA-LOG.md` | QA agents | What was verified, pass/fail per check, findings, recommendations |

---

## Instructions for Build Agents

When you complete a step or block:

1. **Append to `docs/qa-trigger/BUILD-LOG.md`** — Use the template. Include: step/block, agent, date, what was done, files changed, verification.
2. Do not overwrite. Append your entry at the bottom of the Entries section.

---

## Instructions for QA Agents

When you complete a QA pass:

1. **Append to `docs/qa-trigger/QA-LOG.md`** — Use the template. Include: scope, agent, date, pass/fail per check, findings, recommendations.
2. Do not overwrite. Append your entry at the bottom of the Entries section.
3. If you find issues, add them to the findings. Build agents will fix and document in BUILD-LOG; you re-QA and add a follow-up entry.

---

## Master Audit (Final)

After all blocks are built and QA'd, run one agent with this prompt:

```
Master audit: Review docs/qa-trigger/BUILD-LOG.md and docs/qa-trigger/QA-LOG.md.

1. Cross-check: Does BUILD-LOG cover everything QA verified? Any gaps?
2. Cross-check: Are all QA findings addressed in BUILD-LOG (fixes documented)?
3. Consistency: Do the two docs tell a coherent story?
4. Completeness: Any steps/blocks missing from either doc?
5. Verdict: READY FOR PRODUCTION | NEEDS FIXES | INCOMPLETE

Output a structured audit report. Append a summary to both docs or create docs/qa-trigger/MASTER-AUDIT.md.
```

---

## Quick Reference

- **Build agent done?** → Append to `docs/qa-trigger/BUILD-LOG.md`
- **QA agent done?** → Append to `docs/qa-trigger/QA-LOG.md`
- **All blocks complete?** → Run master audit prompt

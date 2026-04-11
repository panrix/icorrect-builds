# Memory Naming Conventions

**Purpose:** Consistent naming for files in agent memory/ directories.

## Auto-generated Files (by session-memory hook)
Format: `YYYY-MM-DD-{slug}.md`
Example: `2026-02-26-bm-pricing-discussion.md`
These are created automatically. Do not rename or restructure them.

## Agent-written Files (observations, learnings)
Format: `{topic}.md`
Examples:
- `pricing-strategy.md` — Learnings about pricing decisions
- `team-performance.md` — Observations about team patterns
- `common-issues.md` — Recurring problems and solutions
- `customer-patterns.md` — Patterns in customer behaviour

Rules:
- Use lowercase with hyphens (kebab-case)
- Be descriptive — the filename should tell you what is inside
- One topic per file — do not dump everything into a single file
- Update existing files rather than creating new ones for the same topic
- No dates in filenames for topic files (the content inside has dates)

## What NOT to Put in Memory
- Raw data dumps (belongs in data/)
- SOPs or procedures (belongs in sops/)
- Structured decisions (cron extracts these to decisions/)
- Foundation-level docs (belongs in foundation/)
- Scripts or code (belongs outside agent workspace)

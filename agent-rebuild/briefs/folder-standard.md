# Build Folder Standard

**Created:** 2026-05-02
**Owner:** main (fleet-meta concern; main maintains the standard, all agents follow)
**Status:** approved 2026-05-02 with revisions (see Open questions resolution at bottom). Rolling out to `~/builds/agent-rebuild/` first as proof-of-concept. KB publication deferred until standard proven.
**Applies to:** every folder directly under `~/builds/`

---

## Why this exists

Today, build folders accumulate files at the top level with no index, no current-vs-historical separation, no canonical entry point. A new session (human or agent) landing in a build folder has to read every file to figure out what's the canonical reference vs what's a one-off output from three weeks ago. This is the same idea-rot failure mode Phase 6.9 documented at the fleet level — playing out inside each project folder.

The standard fixes that with one entry point per folder, one place for proposals, one place for decisions, one place for archive, and a hard rule that nothing canonical sits at the top level except the index.

---

## The structure

Every `~/builds/<project>/` folder has this shape. Subfolders are created on demand (don't pre-create empty ones), but the *categories* are fixed.

```
~/builds/<project>/
├── INDEX.md              ← REQUIRED. Single canonical entry point + live state.
├── briefs/               ← Proposals, specs, ideas at any maturity stage.
│   └── INDEX.md          ←   REQUIRED if briefs/ has more than 5 files.
├── decisions/            ← What was decided, when, why. Append-only, dated.
│   └── YYYY-MM-DD-<short-name>.md
├── docs/                 ← Canonical reference. How it works. Schema. Runbooks.
│   └── INDEX.md          ←   REQUIRED if docs/ has more than 5 files.
├── archive/              ← Closed, superseded, killed. Keeps history.
│   └── YYYY-MM-DD-<reason>/
├── scratch/              ← Working notes. NOT canonical. Allowed to rot.
└── (project-specific)    ← src/, scripts/, data/, .env, etc. as needed.
```

For lightweight folders (docs only, no code), drop `src/`, `data/`. For service folders (running code), add `src/` or `scripts/`, `data/` (gitignored), `README.md` (operational — deploy/restart/health).

---

## What goes in each

### `INDEX.md` (required, root of every project)

The single entry point. If a new session reads only ONE file in this folder, it's this one. Carries both *structure* (what's in here) and *live state* (what's in flight). Single file by design — no separate `status.md`.

Required sections:

```markdown
# <Project Name>

**State:** active | dormant | archived
**Owner:** <agent-id>  (e.g. operations, marketing, main)
**Purpose:** <1-2 sentence what this is for>
**Last updated:** <YYYY-MM-DD HH:MM TZ>

## Current state

### In flight
- <item>: <state>, <next step>, <owner>

### Blocked
- <item>: <blocker>, <who unblocks>

### Recently shipped
- <item>: <date>, <link to decision file>

### Next up
- <item>

## Structure
- `briefs/` — <1-line summary of what's in flight>
- `decisions/` — <1-line summary of recent decisions>
- `docs/` — <1-line summary of canonical reference>
- (others as relevant)

## Key documents
- [briefs/<name>](briefs/<name>.md) — <1-line>
- [decisions/<date>-<name>](decisions/<date>-<name>.md) — <1-line>

## Open questions
- <bullet list of unresolved items, optional>
```

Update `INDEX.md` whenever you add a brief, log a decision, archive something, or change live state. The "Current state" section is expected to drift if not updated — stale state is worse than missing state, so either update or remove.

For dormant or archived projects, the "Current state" section can be a single line ("dormant since YYYY-MM-DD, see decision <link>"). The state field at the top carries the primary signal.

### `briefs/`

Proposals, specs, ideas at any maturity stage. **This is the canonical capture target for new ideas.** When an agent or Ricky introduces a new concept that needs working through, it lands here as `briefs/<short-name>.md`.

Brief lifecycle:
1. **Created** — drops in `briefs/` as `<short-name>.md`. Linked from `INDEX.md` Key Documents.
2. **Maturing** — gets edited as understanding develops. May spawn sibling briefs.
3. **Decided** — when a decision is made about the brief, log the decision in `decisions/`. The brief itself can stay in `briefs/` (still a useful reference) OR move to `archive/` if fully superseded.
4. **Archived** — moves to `archive/YYYY-MM-DD-<reason>/<short-name>.md` when the idea is killed, parked indefinitely, or fully shipped.

If `briefs/` exceeds 5 files, add `briefs/INDEX.md` listing each with a 1-line summary.

### `decisions/`

Append-only decision log. Each decision = one dated file: `YYYY-MM-DD-<short-name>.md`.

Required content:

```markdown
# Decision: <short name>

**Date:** YYYY-MM-DD
**Decided by:** <Ricky | agent-id | meeting-name>
**Status:** active | reversed | superseded

## What was decided
<plain statement of the decision>

## Why
<the reasoning — what alternatives were considered, what tipped the choice>

## Affects
- <briefs/files this decision applies to>
- <other folders / projects affected>

## Reversal conditions
<what would cause us to revisit — optional>
```

Decisions are NEVER deleted. If reversed, log a NEW decision file referencing the prior one.

### `docs/`

Canonical reference. The *non-changing* knowledge: how it works, schema, runbooks, API references, operational procedures. Distinct from `briefs/` which is proposals.

If `docs/` exceeds 5 files, add `docs/INDEX.md`.

If `docs/` becomes deeply nested (sub-domains, e.g. `docs/intake/`, `docs/qc/`), each sub-folder gets its own INDEX.md.

### `archive/`

Closed work. Keeps history. Date-stamped subfolders so it's clear when something was archived and why.

Format: `archive/YYYY-MM-DD-<reason>/<original-files>`

Examples:
- `archive/2026-05-02-superseded-by-v2/old-spec.md`
- `archive/2026-04-15-killed-not-prioritised/half-baked-idea.md`

Archive is grep-able but not expected to be read in normal flow.

### `scratch/`

Working notes, drafts, exploratory thinking. **Explicitly allowed to rot.** Tools and agents should treat `scratch/` content as untrusted — it may contradict canonical docs, may be incomplete, may be wrong.

Convention: anything in `scratch/` older than 30 days is a candidate for promotion (to briefs/ if useful) or deletion (in Phase 7 hygiene sweeps).

---

## Hard rules

1. **`INDEX.md` is mandatory at every project root.** If a build folder lacks one, it's pre-standard and Phase 7 will create one.
2. **Nothing canonical sits at the project root** except `INDEX.md` and `README.md` (if a code project). Everything else lives in a categorized subfolder.
3. **New ideas land in `briefs/`, not in `memory/`, not at the root, not in `scratch/`.** Memory files are for session continuity, not idea capture. Scratch is for half-thoughts, not proposals.
4. **Decisions get logged in `decisions/` immediately when made.** A decision that lives only in chat is a decision that doesn't exist for future sessions.
5. **Closing work means moving to `archive/` with a date and reason** — not deleting. The history is the audit trail.
6. **INDEX.md must be updated when you add a brief, log a decision, or archive something.** Stale indexes are worse than no index — they lie about state.

---

## Examples

### A code-bearing service folder (e.g. `icorrect-parts-service/`)

```
~/builds/icorrect-parts-service/
├── INDEX.md           ← structure + live state
├── README.md          ← deploy / restart / health (operational)
├── briefs/            ← future feature proposals
├── decisions/         ← e.g. why SQLite over Postgres, why /v2 schema
├── docs/              ← API reference, schema, runbooks
├── archive/           ← old specs, killed features
├── scratch/           ← debug notes, exploratory queries
├── src/               ← actual code
├── data/              ← runtime SQLite, gitignored
└── .env               ← gitignored, points at ~/config/.env
```

### A docs-only research folder (e.g. `data-architecture/`)

```
~/builds/data-architecture/
├── INDEX.md           ← structure + live state
├── briefs/            ← architecture proposals
├── decisions/         ← e.g. why Supabase, why this schema shape
├── docs/              ← canonical schema reference (when stable)
├── archive/           ← superseded thinking
└── scratch/           ← working exploration
```

### A pre-standard folder being absorbed

If a folder is too messy to retroactively organize cleanly, the rule is:
1. Create `INDEX.md` at root listing what's there
2. Move clearly canonical files to their right home (`docs/`, `decisions/`)
3. Move clearly historical files to `archive/`
4. Leave the rest at root, marked as pending-classification in INDEX.md
5. Phase 7 hygiene sweeps the pending-classification list over time

Don't let "perfect reorganization" block "any reorganization." A messy folder with an INDEX is better than a messy folder without one.

---

## Agent-workspace concern (out of scope here)

Agent workspaces (`~/.openclaw/agents/<id>/workspace/`) are a *related* but *distinct* concern. They have their own structure (`SOUL.md`, `AGENTS.md`, `USER.md`, `MEMORY.md`, `cases/`, `memory/`, `docs/`, `knowledge/`). The folder standard above applies to `~/builds/<project>/`, not to agent workspaces.

The agent equivalent — "where do new ideas captured by an agent during a conversation land?" — is the **idea-capture protocol** (the B-piece, separate spec). Both exist; this spec doesn't try to cover both.

---

## Rollout — proposed order

1. **Apply to `~/builds/agent-rebuild/` first** as the proof-of-concept, since it's our worst offender and we live in it. Create INDEX, move existing files into briefs/decisions/docs/archive.
2. **Add the standard to `~/kb/` as canonical fleet documentation** so any agent or human can find it.
3. **Add a reference line to each fleet agent's AGENTS.md** Path Rules section pointing at the standard.
4. **Phase 7 hygiene** then walks the remaining 49 folders in `~/builds/` and brings each up to standard, using the inventory + ownership manifests from Phase 6.9 as guide.

The proof-of-concept (step 1) is what proves the standard is workable. If applying it to agent-rebuild surfaces issues, we revise the standard before propagating.

---

## What this does NOT do

- Doesn't automate enforcement (no linter, no pre-commit hook). That's a future concern.
- Doesn't migrate existing folders — that's Phase 7's job, with this spec as the target.
- Doesn't define agent-workspace structure (separate concern, separate spec).
- Doesn't define the capture-to-ship cron / hook (that's Phase 6.5, which automates discipline this spec defines manually).

---

## Resolved decisions (2026-05-02)

1. **`INDEX.md` and `README.md` stay separate.** README is operational (deploy / restart / health) for code-bearing folders only. INDEX is structural + live state for every project.
2. **`status.md` collapsed into `INDEX.md`** as a `## Current state` section. Single file is lighter weight; the structural-vs-state distinction is preserved within the doc.
3. **Idea-capture folder name: `briefs/`** (proposals collapses into briefs).
4. **Date format: `YYYY-MM-DD`** for all dated files (decisions, archive subfolders).
5. **KB publication deferred.** Standard stays inside `agent-rebuild/` until proof-of-concept reorganization proves it; published to `~/kb/` only after that.

# Top-Level Taxonomy — `~/builds/` graduation to domain roots

**Created:** 2026-05-02
**Owner:** Ricky decides; main maintains the standard once decided
**Status:** Decision made (Option E — Hybrid). Per-folder destination map drafted in [`PHASE-7b-DESTINATION-MAP.md`](PHASE-7b-DESTINATION-MAP.md) after Phase 7a standardization.
**Order flipped 2026-05-02 (Ricky directive):** Originally proposed top-level migration before standardization. Reversed because moving messy folders into clean domain roots just relocates the mess. New order: standardize internally first (Phase 7a), then merge clean units (Phase 7b). Reasoning: easier to merge clean units than to consolidate chaos.
**Gates:** Phase 7b (top-level migration) gated on Phase 7a (standardization) completing.

---

## The question

`~/builds/` was originally the home for in-flight builds. Over time it has accumulated 50 folders ranging from 24K dormant scratch through 1.3G active services. Some of these are genuinely "build" work in flight; many are mature operations that have outgrown the "build" label.

Two concrete examples surface the problem:

**BackMarket** — 5 folders, all related, sit as siblings with no shared root:
- `~/builds/backmarket/` (47M, active, primary BM ops)
- `~/builds/backmarket-browser/` (1.3G, active, browser-ops runtime)
- `~/builds/backmarket-seller-support/` (4.5M, active, KB snapshot)
- `~/builds/bm-scripts/` (24K, dormant, leftover JSON)
- `~/builds/buyback-monitor/` (61M, active, buyback price-management)

A new session looking for "where does BM stuff live?" has to know all five paths. Hugo (the BM agent) has to coordinate across them. There's no `~/builds/backmarket/INDEX.md` that points at the siblings — they're peers without a shared parent.

**Alex Triage** — 2 folders that should be 1:
- `~/builds/alex-triage-classifier-rebuild/` (16K, dormant, classifier brief)
- `~/builds/alex-triage-rebuild/` (20M, active, canonical triage workflow)

The dormant brief is conceptually a sub-component of the active rebuild. As siblings they look like peers; they're not.

This pattern repeats: Intake stack (`intake-system/` + `intake-notifications/` + `icloud-checker/` + `quote-wizard/`); Xero (`xero-invoice-automation/` + `xero-invoice-notifications/`); Marketing (`marketing-intelligence/` + `icorrect-shopify-theme/` + `website-conversion/`); Operations (`operations-system/` + `repair-analysis/` etc.).

---

## Decision: Option E — Hybrid taxonomy

```
~/
├── builds/                    ← only in-flight builds + new explorations.
│                                  Small. Churns frequently. Things graduate out
│                                  when they earn a domain home.
│
├── <domain>/                  ← domain root for mature, multi-folder concerns
│   ├── INDEX.md               ← per the folder-standard
│   ├── briefs/
│   ├── decisions/
│   ├── docs/
│   ├── archive/
│   ├── <subfolder>/           ← e.g. ~/backmarket/ops/, ~/backmarket/browser/
│   └── <subfolder>/
│
├── agents/                    ← agent workspaces. Today at ~/.openclaw/agents/;
│                                  could stay there or migrate. Holds prompt files
│                                  (SOUL/AGENTS/USER) + agent-specific scratch.
│                                  NOT domain code — agents own domains; they
│                                  don't host them.
│
└── archive/                   ← retired domains. Date + reason at root.
```

### Rules

1. **`~/builds/` shrinks dramatically.** Becomes the staging area for things that haven't earned a domain home yet. Most current contents move out.
2. **Domains named by business meaning**, not by current folder names. `~/backmarket/` not `~/bm-things/`. `~/intake/` not `~/intake-and-related/`.
3. **A folder graduates to a domain root** when it has 2+ siblings doing related work AND is operationally mature (running service, not just a draft brief).
4. **Each domain root follows the folder-standard internally.** `INDEX.md` (structure + live state) at the domain root tells you what's in this domain and where to look.
5. **Cross-cutting work** (touches 2+ domains) goes into the domain that owns the larger share, with a cross-reference in the other domain's INDEX. If genuinely 50/50 or fleet-meta, it lives in `~/builds/` until it picks a home.
6. **Agent workspaces stay separate from domain code.** `~/agents/<id>/` (or `~/.openclaw/agents/<id>/`) is the agent's prompt files. Domain code lives under the domain root.

### Tradeoffs being accepted

- Migration is the biggest move on the list — many folders relocate, many path references update.
- "When does a folder graduate?" is a judgment call. Codifying it (e.g. 2+ siblings + active service + 90+ days old) helps but won't be perfect.
- Most rules to remember of the 5 candidate models. Justified because the alternatives have worse failure modes (flat doesn't scale; pure-domain forces decisions before maturity is clear; pure-agent reorganizes on every ownership change).

---

## Why other options were rejected

| Option | Why not |
|---|---|
| **A. Flat (today)** | Mature ops drown out new builds. Cross-cutting domains scatter (BM = 5 sibling folders). Doesn't scale as fleet grows. |
| **B. By maturity** (`~/builds/` + `~/services/` + `~/archive/`) | Maturity is visible but domain coherence still scatters. BM still sprawls across 4 folders in `~/services/`. |
| **C. Pure domain** (every folder in a domain root) | Forces a domain decision for in-flight work before maturity is clear. New explorations have nowhere obvious to live. |
| **D. By owning agent** (`~/agents/<id>/services/`) | Agents change. Reorganization on every ownership shift. Some folders span agents. Couples physical structure to organizational structure too tightly. |

E was chosen because it preserves what's good about each: maturity signal (B), domain coherence (C), one-place-per-thing (A), agent alignment via separate `~/agents/` namespace (D-lite), without their respective failure modes.

---

## Migration plan — per-folder destination map

**2026-05-05 update:** the proposed execution map now lives at [`PHASE-7b-DESTINATION-MAP.md`](PHASE-7b-DESTINATION-MAP.md). It includes the target top-level shape, migration waves, all current `~/builds/` folders, split-folder rules for `scripts`, `system-audit-2026-03-31`, and `webhook-migration`, plus the first low-risk physical move batch.

Ricky is reviewing the 50-folder inventory and proposing a per-folder destination tag. Format he'll send back:

```
<folder-name>     →   <destination>
```

Where destination is one of:
- **`builds`** — stays in `~/builds/` (still in-flight or genuinely a build)
- **`<domain-name>`** — promotes to a domain root (e.g. `backmarket`, `intake`, `xero`, `marketing`, `operations`)
- **`agents/<agent-id>`** — moves to agent workspace (rare; for code that's truly agent-specific not domain-specific)
- **`archive`** — dead, archive with date + reason
- **`?`** — unsure, defer decision

Once received, this brief gets updated with the migration map. Phase 7 then runs the migration in two sub-passes:

### Phase 7a — Standardization (replaces original 7a; spec at `PHASE-7a-STANDARDIZATION-SPEC.md`)

Apply folder-standard internally to all 49 remaining folders. Each gets INDEX.md + briefs/decisions/docs/archive/scratch (rigid uniform structure per Ricky decision 2026-05-02). After this, each folder is a clean unit ready for merging.

### Phase 7b — Top-level migration (was 7a; reordered)

For each folder marked for promotion or archive:
1. Create the new home (`~/<domain>/` or `~/archive/2026-MM-DD-<reason>/`)
2. Move the folder (`git mv` where possible)
3. Update path references in: agent workspace files, KB, openclaw.json (rare), CLAUDE.md, EXECUTION-PLAN, any cron jobs, any systemd unit files
4. Verify nothing broke (grep sweep + service health checks for relocated services)
5. Commit each domain migration as a separate atomic commit

### Phase 7c — Domain-root standardization + final cleanup

After top-level migration:
1. Each new domain root (e.g. `~/backmarket/`) gets its own INDEX.md per the folder-standard, listing the consolidated child folders
2. Apply folder-standard to any new domain-root level dirs (briefs/, decisions/, docs/ at the domain root level — for cross-cutting domain concerns)
3. Final `~/builds/` cleanup — should be small at this point (in-flight builds + new explorations only); ensure `~/builds/INDEX.md` exists listing current in-flight work
4. Dead folders identified during 7a get archived to `~/archive/2026-MM-DD-dead-on-arrival/`
5. Secrets rotation + PII redaction per `PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md` (folded in)

---

## Out of scope for this brief

- The folder-standard itself (already shipped at `briefs/folder-standard.md`)
- Agent workspace structure (separate concern, not changed by this taxonomy)
- KB structure (`~/kb/` already has its own organization; this brief doesn't change it)
- Per-domain INDEX.md content shape (can adapt the folder-standard's INDEX template per domain)

---

## Open questions

1. **Domain naming** — `~/backmarket/`, `~/bm/`, `~/back-market/`? Recommend `~/backmarket/` (matches everyone's spoken usage; lowercase; no hyphen mid-word).
2. **Operations vs ops** — `~/operations/` (long, clear) vs `~/ops/` (short, terminal-friendly)? Lean `~/operations/` for INDEX clarity but `~/ops/` for typing.
3. **Where does `~/agents/` live?** Today the agent workspaces are at `~/.openclaw/agents/`. Migrating to `~/agents/` is a bigger move (touches every agent's prompt path, openclaw.json, hooks). Probably OUT of scope for Phase 7 — defer to a separate phase.
4. **What about `~/.openclaw/` itself?** It's the gateway runtime. Not a domain. Stays where it is.
5. **What about `~/config/`, `~/data/`, `~/kb/`?** Not domains. Existing top-level fixtures. Stay.

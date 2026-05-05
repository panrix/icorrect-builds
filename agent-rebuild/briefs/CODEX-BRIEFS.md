# Codex Research Briefs — Batch 2

**Created:** 2026-04-06
**For:** Jarvis to dispatch to Codex agents
**Codex allowance:** 53% weekly remaining, expires Wednesday

All tasks are read-only research unless stated otherwise. Outputs go to `builds/agent-rebuild/`.

---

## Brief C01: Test System Audit Scripts

**Output:** `builds/agent-rebuild/script-test-results.md`

Run each of the 14 Python scripts in `/home/ricky/fleet/system-audit-2026-03-31/scripts/` with `--help` or `--dry-run` flags if available. If no dry-run flag, run with minimal input to test imports and basic execution.

For each script report:
- Does it start without import errors?
- What env vars / credentials does it need?
- Does it produce output or error?
- What would need fixing to make it production-ready?

Source credentials from `/home/ricky/config/api-keys/.env`. Do NOT modify any production data.

---

## Brief C02: Populate KB Finance Section

**Output:** `/home/ricky/kb/finance/` (new files)

Read:
- `/home/ricky/fleet/system-audit-2026-03-31/research/finance/` (all 4 files)
- `/home/ricky/kb/SCHEMA.md` (page format)

Create initial KB pages:
- `xero-structure.md` — chart of accounts, payment flows
- `payment-truth.md` — the reconciliation gap, target state design
- `revenue-channels.md` — revenue by BM / Shopify / walk-in / corporate
- `README.md` — section index

Follow SCHEMA.md page format. Mark all pages as `status: unverified`.

---

## Brief C03: Populate KB Customer Service Section

**Output:** `/home/ricky/kb/customer-service/` (new files)

Read:
- `/home/ricky/fleet/system-audit-2026-03-31/research/customer-service/` (all 5 files)
- `/home/ricky/.openclaw/agents/alex-cs/workspace/docs/` (Alex's SOPs and templates)
- `/home/ricky/kb/SCHEMA.md`

Create initial KB pages:
- `intercom-setup.md` — current Intercom configuration
- `reply-standards.md` — tone, style, signing rules (from Alex's docs)
- `triage-rules.md` — how conversations are prioritised
- `README.md` — section index

---

## Brief C04: Populate KB Marketing Section

**Output:** `/home/ricky/kb/marketing/` (new files)

Read:
- `/home/ricky/fleet/system-audit-2026-03-31/research/marketing/` (all 7 files)
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/` (marketing briefs and audits)
- `/home/ricky/kb/SCHEMA.md`

Create initial KB pages:
- `seo-baseline.md` — current SEO state, rankings, gaps
- `meta-ads-setup.md` — campaign structure, pixel status, audiences
- `conversion-analysis.md` — funnel, PostHog findings, Shopify conversion
- `README.md` — section index

---

## Brief C05: Populate KB Parts Section

**Output:** `/home/ricky/kb/parts/` (new files)

Read:
- `/home/ricky/fleet/system-audit-2026-03-31/research/parts/` (all 4 files)
- `/home/ricky/.openclaw/agents/parts/workspace/docs/`
- `/home/ricky/.openclaw/agents/parts/workspace/scripts/` (understand what exists)
- `/home/ricky/kb/SCHEMA.md`

Create initial KB pages:
- `inventory-model.md` — how stock is tracked, parts board structure
- `suppliers.md` — key suppliers, ordering process, Nancy relationship
- `reorder-rules.md` — current thresholds, gaps in forecasting
- `README.md` — section index

---

## Brief C06: Hugo Unscheduled Scripts — Dry Run Test

**Output:** `builds/agent-rebuild/hugo-scripts-test-results.md`

Test these 3 BM scripts that are built but not scheduled:
1. `/home/ricky/builds/backmarket/scripts/reconcile-listings.js`
2. `/home/ricky/builds/backmarket/scripts/buy-box-check.js`
3. `/home/ricky/builds/backmarket/scripts/morning-briefing.js`

For each:
- Source env from `/home/ricky/config/api-keys/.env`
- Run in dry-run or read-only mode if possible
- Capture output and any errors
- Document what env vars are needed
- Assess readiness for crontab scheduling

Do NOT write to Monday or BM API. Read-only testing only.

---

## Brief C07: Marketing Intelligence Platform Revival

**Output:** `builds/agent-rebuild/marketing-intelligence-fix-report.md`

Read `/home/ricky/builds/agent-rebuild/marketing-intelligence-audit.md` for context.

Then verify on the VPS:
1. Test each scraper at `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/scrapers/` — can it import and initialise?
2. Check which DB file has actual data vs which are empty
3. Test the API at `/home/ricky/.openclaw/agents/marketing/workspace/intelligence/api/` — can it start?
4. Check `requirements.txt` completeness — are all imports covered?
5. Propose exact crontab entries for working scrapers

Do NOT run scrapers against live services. Import and config verification only.

---

## Brief C08: API Credentials Health Check

**Output:** `builds/agent-rebuild/api-credentials-status.md`

Read `/home/ricky/config/api-keys/.env` and test each API key with a minimal, read-only call:

| Service | Test Call | What to Check |
|---------|----------|---------------|
| Monday.com | `GET /v2` with API token | Auth works, returns account info |
| Intercom | `GET /contacts?per_page=1` | Auth works |
| Shopify | `GET /admin/api/2024-01/shop.json` | Auth works |
| Back Market | `GET /ws/` with auth header | Auth works |
| Xero | Token refresh test | OAuth still valid |
| Google Search Console | Token test | OAuth still valid |
| Stripe | `GET /v1/balance` | Auth works |

For each: report status (working/expired/missing), what the key format is, and any errors.

Do NOT modify any data. Read-only health checks only.

---

## Brief C09: Stale Memory Archive + KB Promotion

**Output:** `builds/agent-rebuild/memory-archive-report.md`

For each agent workspace at `~/.openclaw/agents/*/workspace/memory/`:
1. List all files older than 7 days with sizes
2. Read each stale file and extract any durable facts that should be in KB (decisions, process details, business facts)
3. Move stale files to `~/.openclaw/agents/*/workspace/memory/archive/` (create dir if needed)
4. Report what was found and what should be promoted to KB

**Do move the files** (this is the one non-read-only task). But do NOT delete anything.

---

## Brief C10: Client Journey vs SOP Gap Analysis

**Output:** `builds/agent-rebuild/journey-sop-gap-analysis.md`

Read:
- All 7 client journey maps in `builds/system-audit-2026-03-31/client_journeys/`
- All SOPs in `/home/ricky/kb/operations/sop-*.md`

Cross-reference and report:
- Which journeys have matching SOPs? Which don't?
- Which SOP steps don't appear in any journey?
- Where do journeys describe steps that SOPs skip?
- Missing edge cases (returns, complaints, delays, parts issues)

---

## Brief C11: Buyback Rebuild Spec Verification

**Output:** `builds/agent-rebuild/buyback-rebuild-verification.md`

**Context:** We have M2 MacBook Airs selling at a loss because market prices dropped after the MacBook Neo launch. The current buyback monitor doesn't catch unprofitable listings before they go live. A full rebuild spec was written on 2026-03-30 but never built.

Read:
- `/home/ricky/builds/backmarket/docs/trusted-buyback-plan-qa-compilation-2026-03-30.md` (the full rebuild spec)
- `/home/ricky/builds/backmarket/docs/staged/2026-03-31/buyback-profit-model.md` (profit formula)
- `/home/ricky/builds/backmarket/docs/staged/2026-03-31/buyback-monday-schema.md` (Monday field mapping)
- `/home/ricky/builds/buyback-monitor/buy_box_monitor.py` (current implementation)
- `/home/ricky/builds/buyback-monitor/README.md`

Verify:
1. Is the profit formula in the spec still accurate? Check against current BM fees and costs.
2. Are the Monday column IDs in the schema doc still valid? Cross-reference against `/home/ricky/kb/monday/bm-devices-board.md`.
3. Does the current `buy_box_monitor.py` already implement any parts of the spec?
4. What's the gap between current code and the spec?
5. What would Phase 1 of the rebuild look like — minimum viable changes to stop listing unprofitable devices?

**Context on the market shift:** Apple released a new budget MacBook (Neo) which killed resale prices across the M2 MacBook Air range. We were bidding too high on functional cracked devices. This isn't a one-model problem — it affects the entire buyback strategy and needs the full rebuild, not a patch.

---

## Brief C12: 11 Systems Deep Mapping

**Output:** `builds/agent-rebuild/systems-deep-map.md`

Read:
- `/home/ricky/builds/agent-rebuild/ricky-systems-dump.md` (the 11 systems Ricky voiced)
- `/home/ricky/builds/agent-rebuild/automation-blueprint.md` (per-domain automation plan)
- `/home/ricky/kb/operations/README.md` (current SOPs)
- `/home/ricky/kb/monday/main-board.md` (Monday schema)
- `/home/ricky/kb/monday/bm-devices-board.md` (BM board schema)
- `/home/ricky/fleet/system-audit-2026-03-31/research/operations/` (operations research)
- `/home/ricky/fleet/system-audit-2026-03-31/client_journeys/` (customer journey maps)
- `/home/ricky/.openclaw/shared/COMPANY.md` and `TEAM.md`

For each of the 11 systems in the dump, produce:
1. **Data model** — what data does this system read and write? Which Monday columns, Supabase tables, APIs?
2. **User roles** — who uses it? (tech, coordinator, Andres, Ferrari, Ricky)
3. **Integration points** — what other systems does it connect to? Where does data flow in/out?
4. **Existing components** — what scripts, SOPs, or specs already exist that feed into this system?
5. **Dependencies** — what must be built before this system can work? (e.g. Supabase schema, parts allocation model)
6. **Overlap with automation blueprint** — which scripts from the blueprint feed into this system?
7. **Phase 1 definition** — what's the minimum viable version?

---

## Brief C13: Slack Intake Notifications — Spec Verification + Build Readiness

**Output:** `builds/agent-rebuild/slack-intake-readiness.md`

**Context:** We have a complete spec for rebuilding Slack intake notifications (replacing broken n8n workflows). Pricing lookup was removed from scope on 2026-04-02 — it'll be part of the React systems build later. The spec is ready for build but hasn't been verified against current state.

Read:
- `/home/ricky/builds/intake-notifications/briefs/REBUILD-BRIEF.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/00-MASTER-PLAN.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/01-booked-appointment-dropoff.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/02-walk-in-no-appointment.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/03-collection.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/04-enquiry.md`
- `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/slack-notifications-brief.md`

Verify:
1. Are the Typeform IDs in the spec still correct? Check against live Typeform webhooks if possible.
2. Are the Monday column IDs still valid? Cross-reference against `/home/ricky/kb/monday/main-board.md`.
3. Are the Slack channel IDs correct?
4. Does the n8n workflow still exist or has it been removed?
5. What Node.js dependencies would the rebuild need?
6. Is there any existing code in `builds/intake-notifications/` beyond specs?

Produce a build readiness checklist: what's confirmed, what needs checking, what's missing before Phase 1 can start.

---

## Dispatch Order

**Parallel batch 1** (no dependencies): C01, C06, C07, C08, C10, C11, C12, C13
**Parallel batch 2** (needs C01 context): C02, C03, C04, C05
**Last** (needs other outputs): C09

Run batch 1 first. Batch 2 can start immediately after — it doesn't truly depend on C01, the KB population uses the research files directly.

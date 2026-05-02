# backmarket-browser

**State:** active
**Owner:** backmarket
**Purpose:** Controlled browser-ops runtime for Back Market seller-portal work that the existing API path does not cover safely. Contains session-bearing Chromium profiles and the canary/runbook history that proved/disproved login paths.
**Last updated:** 2026-05-02 UTC (Phase 7a folder-standard rollout)

## Current state

### In flight
- Browser-harness pilot completed (URL-capture path proven via CDP into operator's signed-in Chrome). Cloudflare interactive-handoff path remains open. See `briefs/BROWSER-AGENT-TODO-2026-04-26.md`.

### Recently shipped
- 2026-04-26: BROWSER-AGENT-TODO captured, multiple canary reports landed (DataImpulse proxy path, password stage, mailbox code login, headful Cloudflare handoff, SKU portal harness)
- 2026-04-25: SPEC-2026-04-25.md and runbooks for browser-session strategy + VPS harness preflight

### Next up
- Cloudflare interactive solve path on display `:99` (operator-driven)
- Reusable browser-agent skill once URL-capture and SKU canary are proven (idea `05573566` in idea-inventory)

## Structure

- `briefs/` — `BROWSER-AGENT-TODO-2026-04-26.md`, `SPEC-2026-04-25.md`
- `decisions/` — empty (gitkeep)
- `docs/` — 4 runbooks + `audits/` (7 canary reports, has own INDEX)
- `archive/` — empty (gitkeep)
- `scratch/` — empty (gitkeep)
- `config/` — runtime config — kept as-is
- `data/` — session/runtime data; **session-bearing Chromium profiles inside; do NOT classify deep contents** — kept as-is
- `lib/` — shared helpers — kept as-is
- `operations/` — operations dir — kept as-is
- `reports/` — generated reports — kept as-is
- `scripts/` — automation scripts — kept as-is
- `skills/` — codified browser-skills (mode 0700) — kept as-is
- `test/` — test harness — kept as-is

## Key documents

- `README.md` — operational entry (kept at root)
- `package.json` / `package-lock.json` — manifest (kept at root)
- `.gitignore` — kept at root
- [`briefs/BROWSER-AGENT-TODO-2026-04-26.md`](briefs/BROWSER-AGENT-TODO-2026-04-26.md) — moved from root (referenced by main/LIVE-TODO.md and idea-inventory.md)
- [`briefs/SPEC-2026-04-25.md`](briefs/SPEC-2026-04-25.md) — moved from root (referenced by kb/system/runtime/browser-automation.md)
- [`docs/INDEX.md`](docs/INDEX.md) — index of canonical docs/runbooks
- [`docs/audits/INDEX.md`](docs/audits/INDEX.md) — index of 7 canary report audits

## Inbound references (preserved by this rollout — paths changed)

The following references to ROOT-LEVEL files in this folder will become broken after this rollout and need consolidation-pass patching:

- `~/.openclaw/agents/main/workspace/LIVE-TODO.md` lines 59, 63, 68, 70, 72 reference `BROWSER-AGENT-TODO-2026-04-26.md`, `REPORT-DATAIMPULSE-PROXY-BROWSER-PATH-2026-04-26.md`, `REPORT-DATAIMPULSE-PASSWORD-STAGE-CANARY-2026-04-26.md`, `REPORT-DATAIMPULSE-MAILBOX-CODE-LOGIN-2026-04-26.md`, `REPORT-HEADFUL-CLOUDFLARE-AUTH-HANDOFF-2026-04-26.md` (all moved into `briefs/` or `docs/audits/`)
- `~/builds/agent-rebuild/idea-inventory.md` lines 232, 239 reference `BROWSER-AGENT-TODO-2026-04-26.md` (moved to `briefs/`)
- `~/kb/system/runtime/browser-automation.md` line 74 references `SPEC-2026-04-25.md` (moved to `briefs/`)

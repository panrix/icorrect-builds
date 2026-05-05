# Phase 7b System Audit Fleet Move Report - 2026-05-05

## Status

Physical frozen-source move complete; parent repo cleanup ready for PR.

## Scope

`~/builds/system-audit-2026-03-31` -> `~/fleet/system-audit-2026-03-31`

No Back Market, Intake, Inventory, Shopify, cron, systemd, or live runtime paths were changed.

## Reason

`system-audit-2026-03-31` is a frozen evidence pack, not an active build lane. It contains the March/April 2026 source research that still feeds KB pages, SOP gap analysis, finance/marketing/customer-service/parts references, platform inventory, and operational improvement work.

Fleet is the right home because the pack is cross-domain and should remain intact as provenance while domain-specific findings are extracted into SOP and KB backlog items.

## Reference Update

Before the physical move, operational source references were updated from:

`/home/ricky/builds/system-audit-2026-03-31`

to:

`/home/ricky/fleet/system-audit-2026-03-31`

Updated source-reference areas:

- `~/kb/SCHEMA.md`
- finance KB pages
- marketing KB pages
- parts KB pages
- customer-service KB pages and drafts
- Royal Mail repairs dispatch brief
- active agent-rebuild audit/brief docs that point agents at the frozen pack

Historical phase-7 scan logs may still contain the old path as historical evidence and should not be treated as live source references.

## Moved Files

The tracked parent repo source pack contained 133 tracked files, including:

- 17 Codex audit briefs
- 8 domain research folders
- 14 Python audit scripts
- client journey maps
- platform inventory docs
- final audit outputs under `docs/audits`
- working outputs and examples

The physical folder also contained untracked/generated cache material on the VPS, which explains the size difference between local mirror and remote VPS after the move.

## Verification

- Live cron/user-systemd/root-systemd checks found no direct callers for the old path before the move.
- Local destination exists: `/Users/ricky/vps/fleet/system-audit-2026-03-31`.
- VPS destination exists: `/home/ricky/fleet/system-audit-2026-03-31`.
- KB schema now points to `/home/ricky/fleet/system-audit-2026-03-31/research/`.
- Fleet index includes `system-audit-2026-03-31/`.
- Frozen pack index includes the move note.

## SOP And KB Gap-Audit Path

This move unlocks the next high-value phase:

1. Build a canonical SOP inventory:
   - existing SOPs
   - stale SOPs
   - missing SOPs implied by live services, scripts, cron, systemd, and KB references
2. Build a canonical KB inventory:
   - existing KB pages
   - source-backed pages ready to trust
   - draft pages needing owner review
   - missing KB pages implied by SOP gaps and system-audit evidence
3. Assign gaps to the right agent/domain:
   - Back Market
   - Intake
   - Inventory/parts
   - Customer service/Alex
   - Operations
   - Finance/Xero
   - Marketing/Shopify
   - Fleet/OpenClaw

The output should be a work queue Ricky can hand to one or more agents without asking them to rediscover the whole VPS.

## Follow-up

Do not re-run or promote the 14 audit scripts until they get a separate verification pass. Use the frozen pack as evidence, then extract current SOP/KB tasks into domain-owned work queues.

# Phase 7b Batch 2 Intercom Agent Archive Report - 2026-05-05

## Status

Physical archive move complete; parent repo cleanup PR created.

## Scope

`~/builds/intercom-agent` -> `~/customer-service/alex-triage/archive/intercom-agent-spec`

No Back Market, Intake, Inventory, Shopify, cron, systemd, or live Alex runtime paths were changed.

## Reason

`intercom-agent` is a dormant spec-only folder last active on 2026-02-22. It describes a future Intercom backend-agent service, but the live customer-service work now runs through `alex-triage-rebuild` and script-first tooling.

Archiving keeps the useful historical ideas findable under the Alex/customer-service domain without presenting the folder as a current build surface.

## Moved Files

| New path | Purpose |
|---|---|
| `~/customer-service/INDEX.md` | Customer-service domain landing index |
| `~/customer-service/alex-triage/INDEX.md` | Alex triage domain index and live-runtime warning |
| `~/customer-service/alex-triage/archive/intercom-agent-spec/INDEX.md` | Archive index and move note |
| `~/customer-service/alex-triage/archive/intercom-agent-spec/briefs/SPEC.md` | Historical Intercom backend-agent service spec |
| `~/customer-service/alex-triage/archive/intercom-agent-spec/{archive,decisions,docs,scratch}/.gitkeep` | Preserved standard folder placeholders |

## Live Reference Check

No `intercom-agent` references were found in:

- live user crontab
- user systemd unit files
- root systemd unit files

The check did find live `alex-triage-rebuild` cron and user systemd references. Those were intentionally left unchanged.

## Verification

- Local source removed: `/Users/ricky/vps/builds/intercom-agent` no longer exists.
- Live VPS source removed: `/home/ricky/builds/intercom-agent` no longer exists.
- Local destination exists under `/Users/ricky/vps/customer-service/alex-triage/archive/intercom-agent-spec`.
- Live VPS destination exists under `/home/ricky/customer-service/alex-triage/archive/intercom-agent-spec`.
- Spec checksum matched local and live VPS:

`e1df46099a3db97e452bd8af8a61ca4e3e4a8f340c4e187e9261919b67a21205`

## GitHub Cleanup

The parent `panrix/icorrect-builds` repo now removes the old tracked `intercom-agent/` files, matching the physical archive destination.

## Follow-up

Phase 7c should review the archived SPEC for any still-useful routing, escalation, audit logging, or data-model ideas before updating the active Alex triage backlog.

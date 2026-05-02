# xero-invoice-notifications

**State:** active
**Owner:** operations
**Purpose:** Shell-based polling job for paid Xero invoices. Updates Monday.com and posts Slack notifications. Runs as `xero-invoice-notifications.timer` -> `xero-invoice-notifications.service`, ExecStart `/home/ricky/builds/xero-invoice-notifications/check-invoices.sh`.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- Re-auth Xero so the polling flow can refresh tokens (idea-inventory P2, broken) — see `briefs/BUILD-BRIEF.md`.
- Deploy scripts and systemd timer (idea-inventory P2, partial-built).
- Test with a recent paid invoice (idea-inventory P2, captured).

### Recently shipped
- `check-invoices.sh` last touched 2026-04-24; supporting `lib/` (Monday API, Slack, Xero API, state) shell helpers from 2026-04-23.

### Next up
- Resolve broken Xero auth (P2 blocker).

## Structure

- `briefs/` — BUILD-BRIEF + SPEC (specs / build plan).
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.
- `lib/` — shell helpers (`monday-api.sh`, `slack.sh`, `state.sh`, `xero-api.sh`).
- `check-invoices.sh` — live timer script (referenced by systemd absolute path).
- `xero-invoice-notifications.service` / `xero-invoice-notifications.timer` — systemd unit copies (live units in `~/.config/systemd/user/`).

## Key documents

- [briefs/BUILD-BRIEF.md](briefs/BUILD-BRIEF.md) — implementation brief.
- [briefs/SPEC.md](briefs/SPEC.md) — spec.

## Open questions

- Xero token refresh flow currently broken; needs re-auth before timer is useful.

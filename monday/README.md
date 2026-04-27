# Monday.com Workspace

iCorrect's Monday.com integration assets — board schemas, automation audits, build status, browser-harness pilots.

## Boards

| Board | ID | Notes |
|---|---|---|
| iCorrect Main Board | `349212843` | Production. Repair tracking. Source of truth for live workshop ops. |
| iCorrect Main Board v2 | `18401861682` | Rebuild target. Schema v2. ~80 automations to be recreated. |
| BM Devices Board | `3892194968` | Per-device tracking for Backmarket trade-ins. |
| Parts Board | `985177480` | Stock + parts. |

Full column reference: see `automation-audit.md`, `board-schema.md`, `main-board-column-audit.md`.

## Browser-Harness Research (2026-04-25 onwards)

Mac-side browser-harness drives the Monday UI for builds + investigations. Ricky's Mac runs `~/Developer/browser-harness/` with a `domain-skills/monday/` skill folder. VPS-side mirrors of the relevant docs:

| Doc | What it covers |
|---|---|
| `browser-harness-pilot-report.md` | First custom-automation pilot: built one "When Repair Status changes to Received → set Item Received to today" automation end-to-end via the UI. Validated the harness-attach + UI-driven approach. |
| `browser-harness-monday-skill.md` | The reusable skill written from the pilot — UI selectors, dialog escape pattern, multi-span label trap, etc. |
| `monday-automations-api-investigation.md` | **2026-04-26 follow-up sub-agent investigation**: discovered Monday's private `/lite-builder/*` REST API. The ~80-automation rebuild can collapse from ~40 min of UI clicking to <1 min via API. Cookie-authed (no public-API token works). One unknown: the exact POST body for create needs one more capture session (transfer-ownership modal blocked the click last session). |

**Recommendation for the rebuild:** use the API path documented in `monday-automations-api-investigation.md` rather than the UI path from `browser-harness-monday-skill.md`. The UI skill stays useful for one-off automations or for any feature the API doesn't cover.

## Other docs in this directory

- `automation-audit.md` — audit of existing automations on the Main Board
- `automations-export.csv` — export of existing automations
- `automations.md` — automation catalog / planning
- `board-schema.md` — full schema reference for both boards
- `board-v2-build-status.md` — v2 board rebuild progress
- `board-v2-manifest.json` — v2 build manifest
- `build-new-board.py` — script to build the v2 board structure
- `cleanup-brief.md` — cleanup/rationalisation plan
- `cowork-manual-setup-checklist.md` — manual setup steps not automatable
- `icorrect-status-notification-documentation.md` — status notification flows
- `main-board-column-audit.md` — per-column audit of Main Board
- `QUERY-SPEC.md` — GraphQL query patterns for Monday's public API
- `repair-flow-traces.md` — repair flow trace samples
- `target-state.md` — target end state for the rebuild

## Canonical browser-harness skills (Mac source of truth)

```
~/Developer/browser-harness/domain-skills/monday/
└── automations.md   # UI-driven custom automation builder skill
```

The Mac copy is loaded at runtime by browser-harness sessions. The VPS mirrors here are for VPS-side reference + future agent reading. When the Mac skill changes, `scp` it back here.

# Dirty WIP Classification — 2026-05-04

**Branch audited:** `codex/agent-rebuild`
**Checkout:** `/Users/ricky/vps/builds`
**Status:** updated after dependency cleanup commit `cb3a535`; no feature work or folder moves performed

## Summary

After the agent-rebuild docs checkpoint (`7891fb8`), dirty classification report (`b2020e7`), file-level redaction batch (`67e435d`), `.claude/` ignore batch (`b0ca5d5`), and tracked dependency cleanup (`cb3a535`), the parent repo has only meaningful lane dirt left:

| Class | Count | Meaning |
|---|---:|---|
| Meaningful status entries | 30 | Human-authored or source/config/doc changes that need task classification. |
| Dependency/vendor deletion noise | 0 | Resolved by `cb3a535`; `node_modules` is no longer tracked in the parent repo. |

The terrifying dependency total is gone. The remaining risk is that the 30 meaningful entries belong to several unrelated work lanes.

Current status shape, excluding `node_modules`:

| status | count | meaning |
|---|---:|---|
| `M` | 28 | Modified parent-tracked files or gitlinks. |
| `m` | 1 | Modified nested repo content under a parent gitlink. |
| `?` | 1 | Dirty/untracked nested repo under a parent gitlink. |

Current diff size, excluding `node_modules`: 29 files changed, 2,764 insertions, 993 deletions.

Resolved in this branch:

- Agent-rebuild source-of-truth docs committed in `7891fb8`.
- This classification report committed in `b2020e7`.
- File-level redactions / PM2 dump redactions committed in `67e435d`.
- `.claude/` runtime/worktree folders ignored in `b0ca5d5`.
- Tracked `node_modules` removed from the parent repo in `cb3a535`.

## Meaningful Modified Entries

### Agent rebuild / control-plane cleanup

| Path | Classification | Recommended action |
|---|---|---|
| `.gitignore` | cleanup support | Resolved in `67e435d` and `b0ca5d5`. |

### Back Market / browser automation lane

| Path | Classification | Recommended action |
|---|---|---|
| `backmarket-browser/config/selectors/portal.json` | Back Market browser WIP | Commit on Back Market/browser lane after tests. |
| `backmarket-browser/lib/dataimpulse-proxy-canary.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/lib/frontend-url-capture-contract.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/lib/harness-check.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/lib/harness-doctor.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/lib/vps-cdp-harness.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/scripts/run-dataimpulse-mailbox-code-login.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/scripts/run-headful-cloudflare-auth-handoff.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/scripts/vps-cdp-about-blank-check.js` | Back Market browser WIP | Same lane. |
| `backmarket-browser/test/unit/frontend-url-capture-contract.test.js` | Back Market browser WIP/test | Same lane. |
| `backmarket-browser/test/unit/vps-cdp-harness.test.js` | Back Market browser WIP/test | Same lane. |
| `backmarket/data/sold-prices-latest.json` | generated/runtime data or BM data update | Do not commit until confirmed as intentional source data. |
| `buyback-monitor/buy_box_monitor.py` | BM/buyback WIP | Commit on Back Market lane after verification. |
| `buyback-monitor/pull_parts_data_v3.py` | BM/buyback WIP | Commit on Back Market lane after verification. |

Verification note, 2026-05-04:

- `backmarket-browser`: `npm test` passed.
- `buyback-monitor`: `python3 -m py_compile buyback-monitor/buy_box_monitor.py buyback-monitor/pull_parts_data_v3.py` passed.
- No Back Market lane files were staged or committed during this verification.

### Intake lane

| Path | Classification | Recommended action |
|---|---|---|
| `intake-system/backend/.env.example` | intake WIP | Commit on intake lane after validation. |
| `intake-system/backend/package.json` | intake WIP | Same lane. |
| `intake-system/backend/src/adapters/mock-adapters.ts` | intake WIP | Same lane. |
| `intake-system/backend/src/adapters/types.ts` | intake WIP | Same lane. |
| `intake-system/backend/src/app.ts` | intake WIP | Same lane. |
| `intake-system/backend/src/config/env.ts` | intake WIP | Same lane. |
| `intake-system/backend/src/services/intake-service.ts` | intake WIP | Same lane. |
| `intake-system/shared/types.ts` | intake WIP | Same lane. |
| `intake-system/react-form` | dirty gitlink | Handle in gitlink normalization, not as normal parent-repo source. |

Verification note, 2026-05-04:

- `intake-system/backend`: `npm test` was attempted but blocked because `vitest` is not installed in the local mirrored checkout (`sh: vitest: command not found`).
- No `npm install` was run and no intake files were staged or committed during this verification.
- `intake-system/react-form` is a separate dirty nested repo/gitlink with untracked app files; preserve it before parent-level gitlink normalization.

### Operations lane

| Path | Classification | Recommended action |
|---|---|---|
| `operations-system/docs/domains/accepted-diagnostic-repair-queue-workshop-handoff/process-truth.md` | operations docs WIP | Commit on operations/docs lane or park with Ricky review. |
| `operations-system/docs/domains/logistics/session-notes/2026-05-02-gophr-claude-design-handoff.md` | operations docs WIP | Same lane. |
| `operations-system/docs/domains/logistics/session-notes/2026-05-02-gophr-office-hours-scope.md` | operations docs WIP | Same lane. |
| `monday/services/status-notifications/index.js` | operations/webhook WIP | Verify and commit on operations lane. |

### Other single-lane changes

| Path | Classification | Recommended action |
|---|---|---|
| `alex-triage-rebuild/scripts/intercom-cleanup-2025plus-dry-run.js` | Alex/customer-service WIP | Commit on customer-service/Alex lane after review. |
| `icorrect-shopify-theme` | dirty gitlink | Marketing repo-owned; handle in gitlink normalization. |
| `royal-mail-automation` | dirty gitlink | Operations repo-owned; handle in gitlink normalization. |

### File-level redactions / security artifacts

| Path | Classification | Recommended action |
|---|---|---|
| `icloud-checker/briefs/BRIEF.md` | file-level redaction | Resolved in `67e435d`. |
| `marketing-intelligence/snapshot/MI-BUILD-BRIEF.md` | file-level redaction | Resolved in `67e435d`. |
| `server-config/docs/openclaw-gateway.service` | file-level redaction | Resolved in `67e435d`. |
| `server-config/pm2-dump.json` | runtime/security artifact | Redacted in `67e435d`; still consider removing from tracking later. |
| `server-config/pm2-dump-formatted.json` | runtime/security artifact | Redacted in `67e435d`; still consider removing from tracking later. |

## Noise Buckets

### Dependency/vendor deletion noise

| Area | Count | Recommended action |
|---|---:|---|
| `llm-summary-endpoint/node_modules/` | 0 | Resolved in `cb3a535`. |
| `buyback-monitor/node_modules/` | 0 | Resolved in `cb3a535`. |
| `quote-wizard/node_modules/` | 0 | Resolved in `cb3a535`. |

### Agent runtime/worktree noise

| Area | Count | Recommended action |
|---|---:|---|
| `operations-system/.claude/worktrees/...` | 1,427 | Resolved from status noise by `.gitignore` in `b0ca5d5`. Files remain on disk; they are not source. |
| `.claude/`, `alex-triage-rebuild/.claude/`, `intake-notifications/.claude/`, `team-audits/.claude/` | 4 | Resolved from status noise by `.gitignore` in `b0ca5d5`. |

## Recommended Next Commits

1. **Back Market/browser lane review:** inspect and test `backmarket-browser/`, `backmarket/data/sold-prices-latest.json`, and `buyback-monitor/` as one possible BM lane, but commit generated data only if intentionally source-like.
2. **Intake lane review:** inspect/test backend/shared changes; handle `intake-system/react-form` as a gitlink/repo decision, not as normal parent source.
3. **Operations lane review:** inspect `monday/` and `operations-system/` docs together.
4. **Alex/customer-service lane review:** inspect the large Intercom dry-run script change before committing.
5. **Gitlink normalization:** Shopify, Royal Mail, and `intake-system/react-form` after preserving current branch/WIP.

## Do Not Do Yet

- Do not move top-level folders.
- Do not run `git add -A`.
- Do not mix dependency cleanup with feature fixes.
- Do not commit `.claude/worktrees`.

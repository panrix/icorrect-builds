# Dirty WIP Classification — 2026-05-04

**Branch audited:** `codex/agent-rebuild`
**Checkout:** `/Users/ricky/vps/builds`
**Status:** updated after initial cleanup commits; no feature work or folder moves performed

## Summary

After the agent-rebuild docs checkpoint (`7891fb8`), dirty classification report (`b2020e7`), file-level redaction batch (`67e435d`), and `.claude/` ignore batch (`b0ca5d5`), the parent repo has two main kinds of dirt left:

| Class | Count | Meaning |
|---|---:|---|
| Meaningful modified entries | 30 | Human-authored or source/config/doc changes that need task classification. |
| Dependency/vendor deletion noise | 2,220 | Tracked `node_modules` deletions in `llm-summary-endpoint`, `buyback-monitor`, and `quote-wizard`. |

The terrifying total is still mostly dependency noise. The risky part is that the 30 meaningful entries belong to several unrelated work lanes.

Resolved in this branch:

- Agent-rebuild source-of-truth docs committed in `7891fb8`.
- This classification report committed in `b2020e7`.
- File-level redactions / PM2 dump redactions committed in `67e435d`.
- `.claude/` runtime/worktree folders ignored in `b0ca5d5`.

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
| `llm-summary-endpoint/node_modules/` | 1,304 | Dedicated dependency cleanup commit or restore before cleanup. Do not mix with features. |
| `buyback-monitor/node_modules/` | 903 | Dedicated dependency cleanup commit or restore before cleanup. |
| `quote-wizard/node_modules/` | 13 | Dedicated dependency cleanup commit or restore before cleanup. |

### Agent runtime/worktree noise

| Area | Count | Recommended action |
|---|---:|---|
| `operations-system/.claude/worktrees/...` | 1,427 | Resolved from status noise by `.gitignore` in `b0ca5d5`. Files remain on disk; they are not source. |
| `.claude/`, `alex-triage-rebuild/.claude/`, `intake-notifications/.claude/`, `team-audits/.claude/` | 4 | Resolved from status noise by `.gitignore` in `b0ca5d5`. |

## Recommended Next Commits

1. **Dependency cleanup batch:** remove tracked `node_modules` from parent repo and keep ignore rules.
2. **Lane commits:** Back Market/browser, intake, operations, Alex/customer-service, each on its own lane.
3. **Gitlink normalization:** Shopify, Royal Mail, and `intake-system/react-form` after preserving current branch/WIP.

## Do Not Do Yet

- Do not move top-level folders.
- Do not run `git add -A`.
- Do not mix dependency cleanup with feature fixes.
- Do not commit `.claude/worktrees`.

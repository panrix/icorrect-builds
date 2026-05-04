# Dirty WIP Classification — 2026-05-04

**Branch audited:** `codex/agent-rebuild`
**Checkout:** `/Users/ricky/vps/builds`
**Status:** read-only classification; no cleanup actions taken

## Summary

After the agent-rebuild docs checkpoint commit (`7891fb8`), the parent repo still has four distinct kinds of dirt:

| Class | Count | Meaning |
|---|---:|---|
| Meaningful modified entries | 34 | Human-authored or source/config/doc changes that need task classification. |
| Runtime/security artifacts | 2 | Redacted PM2 dump snapshots; not product work. |
| Dependency/vendor deletion noise | 2,220 | Tracked `node_modules` deletions in `llm-summary-endpoint`, `buyback-monitor`, and `quote-wizard`. |
| Agent runtime/worktree noise | 1,431 | Mostly `operations-system/.claude/worktrees/...`; should not be source. |

The terrifying total is mostly noise. The risky part is that the 34 meaningful entries belong to several unrelated work lanes.

## Meaningful Modified Entries

### Agent rebuild / control-plane cleanup

| Path | Classification | Recommended action |
|---|---|---|
| `.gitignore` | cleanup support | Commit with dependency/runtime ignore cleanup, not with feature work. |

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
| `icloud-checker/briefs/BRIEF.md` | file-level redaction | Commit with security redaction batch if desired. |
| `marketing-intelligence/snapshot/MI-BUILD-BRIEF.md` | file-level redaction | Commit with security redaction batch if desired. |
| `server-config/docs/openclaw-gateway.service` | file-level redaction | Commit with security redaction batch if desired. |
| `server-config/pm2-dump.json` | runtime/security artifact | Do not treat as source; keep redacted if committed, or remove from tracking in dedicated cleanup. |
| `server-config/pm2-dump-formatted.json` | runtime/security artifact | Same as above. |

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
| `operations-system/.claude/worktrees/...` | 1,427 | Add ignore / remove from source consideration. Do not commit. |
| `.claude/`, `alex-triage-rebuild/.claude/`, `intake-notifications/.claude/`, `team-audits/.claude/` | 4 | Runtime/editor config; ignore unless explicitly curated. |

## Recommended Next Commits

1. **Security redaction batch** (optional, low urgency per Ricky): `.gitignore`, `icloud-checker/briefs/BRIEF.md`, `marketing-intelligence/snapshot/MI-BUILD-BRIEF.md`, `server-config/docs/openclaw-gateway.service`, and decide whether to keep or remove the redacted PM2 dumps.
2. **Dependency cleanup batch:** remove tracked `node_modules` from parent repo and keep ignore rules.
3. **Lane commits:** Back Market/browser, intake, operations, Alex/customer-service, each on its own lane.
4. **Gitlink normalization:** Shopify, Royal Mail, and `intake-system/react-form` after preserving current branch/WIP.

## Do Not Do Yet

- Do not move top-level folders.
- Do not run `git add -A`.
- Do not mix dependency cleanup with feature fixes.
- Do not commit `.claude/worktrees`.

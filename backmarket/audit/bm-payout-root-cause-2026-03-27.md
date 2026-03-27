# BM Payout Root Cause Investigation

**Date:** 27 Mar 2026  
**Scope:** `/home/ricky/builds/backmarket`, `/home/ricky/builds/icloud-checker`, sibling scripts/services that can trigger BM buyback validate/payout  
**Issue:** Buy-back trade-ins are being paid out even when Monday `status24 = Pay-Out` was never selected.  
**Example:** `GB-26102-SUSBL`

## Findings

### 1. Most likely root cause: rogue cron path bypasses Monday entirely

An out-of-band cron job in the OpenClaw backmarket workspace is auto-validating BM trade-ins directly from BM `RECEIVED` state, without checking Monday `status24`.

File:

- `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py`

Evidence:

- Fetches BM `RECEIVED` orders:
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:62`
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:68`
- Defines the action as auto-validating everything in window:
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:4`
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:6`
- Calls BM validate directly for every "spec clean" RECEIVED order:
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:110`
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:139`
  - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py:140`
- Never queries Monday and never checks `status24`.

User crontab confirms this job is active every 2 hours:

- `0 */2 * * * /usr/bin/python3 /home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py ...`

This is the only confirmed live path that can pay out without Monday `Pay-Out`.

### 2. The example trade-in was definitely paid by the rogue cron path

The log for the cron job shows the exact example order being validated automatically:

- `/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log:881`
- `/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log:884`

Relevant log lines:

- `2026-03-25 12:00 UTC` run
- `✅ Validated: GB-26102-SUSBL | 47.5h left | BRONZE | £97.0 → VALIDATED`

The same log also shows other automatic validations this week:

- `/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log:883`
- `/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log:955`
- `/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log:957`

This matches the report that all buybacks this week were paid without `Pay-Out` being selected.

### 3. The intended live webhook path is correctly gated on Monday `status24 = Pay-Out`

The live split service is `bm-payout` on port `8012`, behind nginx at `/webhook/bm/payout`.

Ingress and live wiring:

- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:17`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:18`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:30`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:49`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:69`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:78`

Handler:

- `/home/ricky/builds/backmarket/services/bm-payout/index.js:126`

Trigger and gate logic:

- Requires `event.columnId === status24`:
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:141`
- Requires correct board:
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:142`
- Parses Monday status value and exits unless index is `PAYOUT_INDEX`:
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:145`
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:152`
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:153`
- Re-reads Monday item state and skips stale webhooks if status is no longer Pay-Out:
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:179`
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:190`
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:192`
- Only then calls BM validate:
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:228`
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:231`
  - `/home/ricky/builds/backmarket/services/bm-payout/index.js:232`

Conclusion: the canonical live webhook does depend on `status24 = Pay-Out`.

### 4. The old monolith payout handler still exists in the repo, but is not the live runtime

Legacy handler still present in repo:

- `/home/ricky/builds/icloud-checker/index.js:1262`
- `/home/ricky/builds/icloud-checker/index.js:1266`

It also gates on `status24 = 12`:

- `/home/ricky/builds/icloud-checker/index.js:1281`
- `/home/ricky/builds/icloud-checker/index.js:1286`
- `/home/ricky/builds/icloud-checker/index.js:1287`

But the running service uses `src/index.js`, which documents payout as extracted:

- `/home/ricky/builds/icloud-checker/src/index.js:1110`
- `/home/ricky/builds/icloud-checker/src/index.js:1112`

Current systemd state showed `icloud-checker.service` runs `src/index.js`, while `bm-payout.service` is active separately on `8012`.

Conclusion: this old monolith path is stale code / duplicate handler debt, not the most likely cause of the current incident.

### 5. Manual CLI payout scripts exist in two places and both require `status24 = Pay-Out`

Primary copy:

- `/home/ricky/builds/backmarket/scripts/trade-in-payout.js`

Duplicate copy:

- `/home/ricky/builds/bm-scripts/trade-in-payout.js`

The two copies are identical.

Trigger and gate logic in the script:

- Queries Monday for items with `status24 = 12`:
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:101`
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:113`
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:115`
- Pre-flight re-checks `status24 = Pay-Out`:
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:136`
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:140`
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:142`
- Calls BM validate only after that:
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:181`
  - `/home/ricky/builds/backmarket/scripts/trade-in-payout.js:186`

Repo documentation describes it as `Manual/cron`:

- `/home/ricky/builds/backmarket/README.md:29`
- `/home/ricky/builds/backmarket/README.md:34`

I found no active timer for this script. The active scheduled payout-like job was the OpenClaw `buyback_payout_watch.py` cron instead.

## Every code path that can trigger BM payout/validate

| Rank | Path | File | Trigger | Calls BM validate? | Depends on `status24 = Pay-Out`? | Live status |
|---|---|---|---|---|---|---|
| 1 | Rogue auto-payout cron | `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py` | User crontab every 2 hours; scans BM `RECEIVED` orders | Yes | **No** | **Live and confirmed** |
| 2 | Canonical payout webhook service | `/home/ricky/builds/backmarket/services/bm-payout/index.js` | Monday webhook when Main board `status24` changes to `Pay-Out` | Yes | **Yes** | **Live** |
| 3 | Standalone CLI payout script | `/home/ricky/builds/backmarket/scripts/trade-in-payout.js` | Manual execution or external cron | Yes | **Yes** | Available, no evidence it caused this incident |
| 4 | Duplicate CLI payout script | `/home/ricky/builds/bm-scripts/trade-in-payout.js` | Manual execution or external cron | Yes | **Yes** | Available, no evidence it caused this incident |
| 5 | Legacy monolith webhook | `/home/ricky/builds/icloud-checker/index.js` | Monday webhook when `status24` changes to `Pay-Out` | Yes | **Yes** | Stale repo copy, not current live runtime |

## Monday webhook trigger logic

The current live payout webhook path is:

1. Monday board `349212843`
2. Column `status24`
3. Trigger `"Pay-Out"`
4. URL `https://mc.icorrect.co.uk/webhook/bm/payout`
5. nginx proxies to `127.0.0.1:8012`
6. `bm-payout.service` handles the request

Evidence:

- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:41`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:45`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md:49`

This path is not the bug. It is gated correctly.

## Old monolith vs split service behavior

### Old monolith

- Handler exists in `/home/ricky/builds/icloud-checker/index.js`
- Requires `status24 = 12`
- No longer the running implementation

### Split service

- Handler exists in `/home/ricky/builds/backmarket/services/bm-payout/index.js`
- Requires `status24 = 12`
- Adds better idempotency and stale-webhook checks
- This is the live implementation

### Out-of-band cron path

- Exists outside the rebuild under OpenClaw workspace
- Does not care about Monday `status24`
- Uses BM `RECEIVED` plus BM-side “spec clean” logic as source of truth
- This conflicts directly with policy that Monday is the source of truth

## Retries, fallback jobs, cron/manual scripts, duplicate handlers

### Retries

`bm-payout` retries once on BM 5xx:

- `/home/ricky/builds/backmarket/services/bm-payout/index.js:285`

This does not bypass `status24`; it only retries after a valid webhook trigger.

### Fallback / safety-net wording

`bm-payout` log/alert text mentions leaving items as Pay-Out “for safety net cron”:

- `/home/ricky/builds/backmarket/services/bm-payout/index.js:314`
- `/home/ricky/builds/icloud-checker/index.js:1356`

I did not find a build-local cron that processes failed Pay-Out items from Monday. The only confirmed active payout cron is the OpenClaw rogue job, which works from BM `RECEIVED`, not Monday Pay-Out.

### Cron / manual scripts

Confirmed active:

- OpenClaw `buyback_payout_watch.py` via user crontab every 2 hours

Available but not evidenced active:

- `/home/ricky/builds/backmarket/scripts/trade-in-payout.js`
- `/home/ricky/builds/bm-scripts/trade-in-payout.js`

### Duplicate handlers

Duplicates still present in repo:

- Split live service: `/home/ricky/builds/backmarket/services/bm-payout/index.js`
- Legacy monolith repo copy: `/home/ricky/builds/icloud-checker/index.js`
- CLI script copy 1: `/home/ricky/builds/backmarket/scripts/trade-in-payout.js`
- CLI script copy 2: `/home/ricky/builds/bm-scripts/trade-in-payout.js`

The dangerous duplicate is not another `status24` handler. It is the OpenClaw cron path using a different trigger source entirely.

## Most likely root cause

The most likely root cause is that `buyback_payout_watch.py` was left active in production and is auto-validating BM trade-ins based on BM `RECEIVED` state and BM-side cleanliness checks, instead of waiting for Monday `status24 = Pay-Out`.

Why this is the strongest conclusion:

1. It is active in crontab.
2. It directly calls BM `validate`.
3. It has no Monday query and no `status24` gate.
4. It logged the exact example trade-in `GB-26102-SUSBL` as auto-validated.
5. It also logged other auto-validations this week, matching the reported pattern.

## Safest fix recommendation

Do not implement yet. Recommended order:

1. Disable the OpenClaw `buyback_payout_watch.py` cron job immediately.
2. Keep exactly one canonical payout executor: `bm-payout` webhook service on `8012`.
3. Confirm there are no other cron jobs, timers, or external agents calling BM buyback `validate`.
4. Reconcile all buybacks processed since 25 Mar 2026 against the OpenClaw payout-watch log and BM order history.
5. Only after the rogue cron is disabled and reconciliation is complete, decide whether any additional guardrail is needed in code.

## Next Steps For Execution

This is the handoff action list for the follow-up agent.

### Immediate containment

1. Disable the active cron entry for:
   - `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py`
2. Preserve evidence before changing anything:
   - current user crontab
   - the payout-watch script
   - the payout-watch log
3. Do **not** change the live `bm-payout` webhook path during containment. The split webhook is not the primary incident cause.

### Verification after containment

1. Confirm the cron is no longer present in crontab.
2. Confirm no systemd timer or second scheduler is invoking the same script.
3. Confirm no other script outside the canonical BM rebuild flow calls:
   - `PUT /ws/buyback/v1/orders/{id}/validate`
4. Confirm the canonical live payout path is still:
   - Monday `status24 = Pay-Out`
   - nginx `/webhook/bm/payout`
   - `bm-payout.service` on `127.0.0.1:8012`

### Reconciliation

1. Build a list of all trade-ins auto-validated by the rogue cron since 25 Mar 2026.
2. For each one, record:
   - BM trade-in ID
   - validation timestamp
   - whether Monday `status24` had actually been set to Pay-Out
   - whether payout would have been valid under intended policy
3. Use:
   - `/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log`
   - BM order history
   - Monday item history / updates
4. Produce a final affected-order list for review.

### Hardening follow-up

After containment:

1. Remove or archive the rogue OpenClaw payout path so it cannot be re-enabled silently.
2. Document that BM payout source-of-truth is Monday `status24 = Pay-Out`, not BM `RECEIVED`.
3. Optionally add monitoring/alerting so any future direct BM validate call outside the canonical service is visible immediately.

## Agent Handoff Note

The follow-up agent should treat this as an incident-response containment and reconciliation task, not a speculative code-cleanup task.

Priority order:
1. contain the rogue cron
2. verify single canonical executor
3. reconcile affected buybacks
4. only then propose longer-term cleanup
3. If a payout watchdog is still needed, convert it to alert-only monitoring with no write action.
4. If auto-action is ever reintroduced, hard-gate it on a fresh Monday read requiring `status24 = Pay-Out` before any BM `validate` call.
5. Remove or archive stale duplicate payout code paths so the live source of truth is unambiguous.

## Short Summary

The live `bm-payout` webhook is not the primary fault. It correctly requires Monday `status24 = Pay-Out`.

The real bug is a separate cron job in `/home/ricky/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py` that auto-validates BM `RECEIVED` orders without consulting Monday at all. Its logs prove it validated `GB-26102-SUSBL` on `25 Mar 2026 12:00 UTC`, and it also auto-validated other trade-ins this week.

That rogue cron path is the most likely root cause of payouts happening when Monday `Pay-Out` was never selected.

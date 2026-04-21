# Disaster Recovery

This runbook covers the Claude agent bridge system for `builds/agents/`. Use it when production has failed and the goal is to restore service with the least ambiguity possible.

## Tiers

**Tier 1** means full VPS loss. The production Hetzner host is gone or unusable, so the response is: provision a new Hetzner Cloud `CX22`, restore `_shared/state/` from restic, redeploy the systemd units, restore secrets, and bring the bridge back online.

**Tier 2** means the bridge process crashed but the VPS is still intact. The normal expectation is that systemd restarts it automatically. The operator checks logs, confirms the restart happened, and verifies that `_shared/state/` still reads cleanly. Tier 2 should not require host rebuild or restic restore.

## What Is Lost

Tier 1 loss surface: runtime state written after the last nightly restic snapshot at **03:00 Asia/Singapore** is lost if it was not also captured elsewhere. Durable git-tracked records still come back from Git.

Tier 2 loss surface: nothing should be lost if state writes remained atomic. If state corruption is visible, treat it as a failed atomicity assumption and escalate to an incident immediately.

## Tier 1 Restore Checklist

1. Provision a new VPS from the **Hetzner Cloud console** using the production image class and a `CX22`. Do not use DigitalOcean; production is Hetzner and the restore assumptions match Hetzner networking and tooling.
2. Install the required dependencies and confirm versions against [`versions.lock`](/home/ricky/builds/agents/_shared/versions.lock): `node`, `tmux`, `restic`, and `flock` at minimum. `git`, `systemd`, and `logrotate` also need to be present before the bridge is enabled.
3. Restore the most recent restic snapshot of `/home/ricky/builds/agents/_shared/state/` back into place. After restore, run `restic check` before trusting the restored state.
4. Clone the builds repository to `/home/ricky/builds` from GitHub so code, templates, runbooks, and tracked records are restored.
5. Install the systemd units from `agents/_shared/bridge/systemd/` so `claude-bridge@.service`, `claude-backup@.service`, and `claude-backup@.timer` exist on the new host.
6. Populate `agents/_shared/bridge/envs/*.env` from the secure store. Confirm permissions are restrictive before enabling services.
7. Enable and start `claude-bridge@chief-of-staff` with systemd.
8. Verify Telegram connectivity end to end by sending a test message to the bot and confirming a reply. Check that logs are advancing and the bridge is healthy before declaring recovery complete.

## Tier 2 Crash Procedure

If only the bridge process died, first confirm whether `claude-bridge@chief-of-staff` restarted by itself. Read the active log file under `_shared/logs/` and confirm there is no repeated crash loop. Then verify the state files that the bridge depends on, especially `_shared/state/bridge-activity.json`, `_shared/state/infra-snapshot.json`, `_shared/state/handoff-events.jsonl`, and the agent's `WORKING-STATE.md`. If those files remain readable and the bridge resumes cleanly, no restore is required.

If repeated crashes continue after systemd restarts, stop treating it as a pure Tier 2 incident. Capture the failure in an incident record, preserve logs, and decide whether to fall back to Tier 1.

## Annual Test Cadence

Every December, run a full Tier 1 rehearsal on a spare Hetzner instance. The test must simulate full restore, not just service restart. Document the result, gaps, and exact commands used in `_shared/runbooks/dr-test-log.md`. If the December test is skipped, the runbook is considered stale until the rehearsal is completed.

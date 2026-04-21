# Credential Rotation

Use this runbook whenever a credential is rotated on schedule or because compromise is suspected. Rotation is not complete until the bridge is restarted and Telegram echo still works.

## Cadences

| Credential | Rotation cadence | Required action |
|------------|------------------|-----------------|
| Telegram bot token | Rotate on suspected compromise or annually | Update `chief-of-staff.env`, restart the bridge |
| Monday API token | Rotate quarterly or on staff departure | Update `chief-of-staff.env`, restart the bridge |
| Hetzner Storage Box SSH key | Rotate annually | Update restic repository access |
| GitHub deploy key | Rotate annually or on suspected compromise | Replace the deploy key in GitHub and on the host if used there |
| `KILL_HMAC` (restic passphrase) | Rotate only if the passphrase is compromised | Rekey the restic repository with the new passphrase |

## Kill-Switch Access Order

| Path | Use when | Notes |
|------|----------|-------|
| Path 1: Telegram `/kill` command | Fastest path when Telegram still works and the passphrase is available | Requires `KILL_HMAC` knowledge |
| Path 2: Monday board kill-switch column | Telegram is hostile or unavailable but Monday is reachable | Requires Monday access |
| Path 3: SSH direct | Always available fallback | Requires direct VPS access |

This order is stress-oriented: use the quickest independent path first, but assume unlock still requires SSH.

## Rotation Procedure

For Telegram bot token rotation, generate the new token, update `agents/_shared/bridge/envs/chief-of-staff.env`, then restart `claude-bridge@chief-of-staff`. Confirm the old token is no longer valid before closing the change.

For Monday API token rotation, create the replacement token, update the same env file, restart the bridge, and confirm the Monday kill-switch poll still works.

For Hetzner Storage Box SSH key rotation, update the key on the Storage Box side first, then update the host copy used by restic. Run a manual restic access check before waiting for the nightly timer.

For GitHub deploy key rotation, add the new key, verify clone or fetch access, then remove the old key. Keep the overlap short.

If `KILL_HMAC` or the restic passphrase is compromised, treat it as a higher-risk event. Generate the replacement value, update the secure store, update the bridge env, and rekey the restic repository before destroying trust in the old chain.

## `BRIDGE_LOCKED=1` Drill

To test kill-switch behavior without interrupting production, perform the drill on staging. Create `bridge-locked.flag` manually in staging, verify that the bot refuses inbound messages with the locked response, then remove the flag to restore normal behavior. This validates the lock path without firing the real emergency controls on production.

## Completion Rule

After any credential rotation, always restart the bridge and verify Telegram echo still works before considering the work complete. A rotated secret that was never exercised is not verified.

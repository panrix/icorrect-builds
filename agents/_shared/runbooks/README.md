# Runbooks

- `disaster-recovery.md` — use when the VPS is lost, restic restore is needed, or the bridge is down after host failure.
- `credential-rotation.md` — use when rotating bot, Monday, Hetzner, GitHub, or kill-switch credentials.
- Tier 1 restores start with `disaster-recovery.md`.
- Planned security maintenance starts with `credential-rotation.md`.
- After any real incident or drill, update the relevant runbook with what changed.

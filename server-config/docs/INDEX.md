# server-config / docs

Config snapshots from the 2026-03-24 VPS capture. 16 files: 10 systemd `.service` units + 6 nginx `.conf` files + 1 env template.

## systemd `.service` units

- `agent-trigger.service` — agent trigger (cron-style nudge service).
- `icloud-checker.service` — iCloud checker service unit.
- `icorrect-parts.service` — parts service unit.
- `intake-form.service` — intake-form static-serve unit (live; references `~/builds/intake-system/react-form/dist`).
- `llm-summary.service` — LLM summary endpoint unit.
- `marketing-intelligence-api.service` — MI API unit (now dormant).
- `openclaw-gateway.service` — OpenClaw gateway user service.
- `telephone-inbound.service` — telephone inbound unit.
- `voice-note-worker.service` — voice-note worker unit.

(Note: `agent-trigger.service` does not have a corresponding entry in `~/.config/systemd/user/` at the time of this scan — likely retired or moved.)

## nginx configs

- `nginx.conf` — top-level nginx config.
- `nginx-default.conf` — default vhost.
- `nginx-intake-form.conf` — intake-form vhost.
- `nginx-marketing-intel.conf` — marketing-intelligence vhost.
- `nginx-mission-control.conf` — mission-control vhost (legacy).
- `nginx-n8n.conf` — n8n vhost (legacy).

## Templates

- `env-template.txt` — env-var template (placeholders, not real secrets).

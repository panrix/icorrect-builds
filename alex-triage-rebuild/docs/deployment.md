# Deployment Guide

This repo ships three runtime assets:

- `deploy/alex-triage-bot.service` for the persistent Telegram bot and Mini App HTTP server
- `deploy/alex.icorrect.co.uk.nginx.conf` for the public reverse proxy
- `deploy/alex-triage.cron` for scheduled triage, pricing, and learning runs

## Prerequisites

- Node.js 22 or later
- `crontab`
- nginx
- A writable repo checkout at `/home/ricky/builds/alex-triage-rebuild`
- Runtime secrets in `/home/ricky/config/api-keys/.env`

Required secrets:

- `INTERCOM_API_TOKEN`
- `MONDAY_APP_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `OPENROUTER_API_KEY`
- `SHOPIFY_STORE`
- `SHOPIFY_ACCESS_TOKEN`

Optional but useful:

- `INTERCOM_ADMIN_ID`
- `INTERCOM_TAG_NEEDS_FERRARI_ID`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_EMAILS_THREAD_ID`
- `ALEX_PUBLIC_BASE_URL`
- `OPENROUTER_MODEL`
- `ALEX_ENABLE_LIVE_POSTING`

## Systemd

Install the service:

```bash
sudo loginctl enable-linger ricky
mkdir -p /home/ricky/.config/systemd/user
cp /home/ricky/builds/alex-triage-rebuild/deploy/alex-triage-bot.service /home/ricky/.config/systemd/user/alex-triage-bot.service
systemctl --user daemon-reload
systemctl --user enable --now alex-triage-bot.service
```

The service listens on port `8020` and serves:

- `/health`
- `/edit`
- `/api/draft/:conversation_id`

If the service fails, inspect:

```bash
journalctl --user -u alex-triage-bot.service -f
```

## nginx

Install the reverse proxy:

```bash
sudo cp /home/ricky/builds/alex-triage-rebuild/deploy/alex.icorrect.co.uk.nginx.conf /etc/nginx/sites-available/alex.icorrect.co.uk.conf
sudo ln -sf /etc/nginx/sites-available/alex.icorrect.co.uk.conf /etc/nginx/sites-enabled/alex.icorrect.co.uk.conf
sudo nginx -t
sudo systemctl reload nginx
```

The public domain `alex.icorrect.co.uk` should proxy to `127.0.0.1:8020`.
Telegram Mini Apps require HTTPS, so the nginx proxy must sit behind TLS termination or be merged into an HTTPS vhost.

## Cron

Install the schedule with:

```bash
crontab /home/ricky/builds/alex-triage-rebuild/deploy/alex-triage.cron
```

Schedule summary:

- `06:45 UTC` daily full triage
- every `15` minutes, `07:00-18:59 UTC`, Monday-Friday for incremental checks
- `05:00 UTC` daily Shopify pricing refresh
- `07:30 UTC` Sunday learning run

The cron jobs create `data/` if needed and write logs into `data/cron-*.log` in the repo checkout.

For controlled live email restart, the provided cron entries explicitly export `ALEX_ENABLE_LIVE_POSTING=1` unless the environment already overrides it. If you need a dry shadow run, set `ALEX_ENABLE_LIVE_POSTING=0` in the cron environment before installing it.

## Operational Notes

- The bot process should be the only Telegram polling instance using the token.
- The Mini App edit flow uses signed tokens or Telegram WebApp init data for access control.
- If a Monday write fails during send, the conversation should not be marked as fully sent.

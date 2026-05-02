# Slack Interactive Buttons — Setup TODO

## Status: Waiting on Ricky

Everything is built and deployed. Just need Slack app permissions updated.

## Steps

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → select **iCorrect Automations**
2. Go to **OAuth & Permissions**
3. Under **Bot Token Scopes**, add:
   - `chat:write`
   - `commands` (if not already there)
4. Click **Reinstall to Workspace** (it'll prompt you to approve)
5. Copy the new **Bot User OAuth Token** (starts with `xoxb-`)
6. Send the new token to Jarvis

## Already Done
- ✅ Interactivity enabled on iCorrect Automations app
- ✅ Request URL set to `https://mc.icorrect.co.uk/webhook/icloud-check/slack-interact`
- ✅ iCorrect Automations invited to #bm-trade-in-checks
- ✅ Code built and deployed with keyword filter + buttons + reply modal
- ✅ Old token saved as `SLACK_AUTOMATIONS_BOT_TOKEN` in `/home/ricky/config/.env` (will need updating)

## What Jarvis Will Do After
- Update the token in `.env`
- Test the buttons
- Update docs

## How It Will Work
- Customer replies to iCloud locked BM order
- Cron checks every 30 min for new customer messages
- **Keyword match** (removed, done, unlocked, etc) → auto-recheck via SickW
- **No keyword** → Slack notification to #bm-trade-in-checks with:
  - Customer's actual message
  - "🔄 Recheck iCloud" button
  - "💬 Reply to Customer" button (opens modal, sends via BM API)

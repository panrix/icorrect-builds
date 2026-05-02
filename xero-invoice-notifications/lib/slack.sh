#!/usr/bin/env bash
# slack.sh — Slack notification helpers

set -euo pipefail

ENV_PATH="/home/ricky/config/api-keys/.env"
SLACK_CHANNEL="invoice-notifications"

slack_post() {
  local text="$1"
  source "$ENV_PATH"

  curl -s -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\": \"$SLACK_CHANNEL\", \"text\": $(echo "$text" | jq -R -s '.'), \"unfurl_links\": false}" \
    | jq -r '.ok'
}

# Notify that an invoice was paid
slack_notify_paid() {
  local client="$1"
  local amount="$2"
  local date="$3"
  local invoice_url="$4"
  local monday_url="$5"

  local text
  text=$(cat <<EOF
💰 Invoice Paid

Client: $client
Amount: £$amount
Date: $date
Invoice: $invoice_url
Monday: $monday_url
EOF
)

  slack_post "$text"
}

# Flag a payment mismatch
slack_notify_mismatch() {
  local client="$1"
  local invoice_num="$2"
  local quote="$3"
  local existing="$4"
  local invoice_amount="$5"
  local new_total="$6"
  local monday_url="$7"
  local xero_url="$8"

  local diff
  diff=$(echo "$quote - $new_total" | bc -l)

  local text
  text=$(cat <<EOF
⚠️ Payment Mismatch

Client: $client
Invoice: $invoice_num
Quote: £$quote
Previously paid: £$existing
Invoice payment: £$invoice_amount
New total: £$new_total
Difference: £$diff

Monday: $monday_url
Xero: $xero_url
EOF
)

  slack_post "$text"
}

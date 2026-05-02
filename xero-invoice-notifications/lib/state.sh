#!/usr/bin/env bash
# state.sh — State tracking for invoice notifications

set -euo pipefail

STATE_FILE="/home/ricky/data/xero-invoice-state.json"

# Ensure state file exists
state_ensure() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo '{"last_checked": "", "notified_invoices": []}' > "$STATE_FILE"
  fi
}

# Load state as JSON
state_load() {
  state_ensure
  cat "$STATE_FILE"
}

# Save state JSON
state_save() {
  local state="$1"
  echo "$state" | jq . > "$STATE_FILE"
}

# Get last checked date (YYYY-MM-DD)
state_get_last_checked() {
  state_load | jq -r '.last_checked // empty'
}

# Set last checked date
state_set_last_checked() {
  local date="$1"
  local state
  state=$(state_load | jq --arg d "$date" '.last_checked = $d')
  state_save "$state"
}

# Check if invoice was already notified
state_is_notified() {
  local invoice_id="$1"
  state_load | jq -e --arg id "$invoice_id" '.notified_invoices | index($id) != null' > /dev/null 2>&1
}

# Mark invoice as notified
state_mark_notified() {
  local invoice_id="$1"
  local state
  state=$(state_load | jq --arg id "$invoice_id" '.notified_invoices += [$id]')
  state_save "$state"
}

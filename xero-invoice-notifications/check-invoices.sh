#!/usr/bin/env bash
# check-invoices.sh — Main orchestrator for Xero invoice payment notifications
#
# Polls Xero for newly paid invoices, updates Monday.com, notifies Slack.
# Run via cron/systemd timer every 15 minutes during business hours.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/xero-api.sh"
source "$SCRIPT_DIR/lib/monday-api.sh"
source "$SCRIPT_DIR/lib/slack.sh"
source "$SCRIPT_DIR/lib/state.sh"

LOG_FILE="/home/ricky/data/xero-invoice-check.log"
DRY_RUN="${DRY_RUN:-false}"

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1" | tee -a "$LOG_FILE"
}

main() {
  log "=== Starting invoice check ==="

  # Get last checked date (default to 7 days ago if empty)
  local last_checked
  last_checked=$(state_get_last_checked)
  if [[ -z "$last_checked" ]]; then
    last_checked=$(date -u -d '7 days ago' '+%Y-%m-%d')
    log "No previous check found, using 7-day lookback: $last_checked"
  else
    log "Last checked: $last_checked"
  fi

  # Fetch paid invoices from Xero
  local invoices
  invoices=$(xero_fetch_paid_invoices "$last_checked")
  local count
  count=$(echo "$invoices" | jq 'length')
  log "Found $count paid invoice(s) since $last_checked"

  if [[ "$count" -eq 0 ]]; then
    state_set_last_checked "$(date -u '+%Y-%m-%d')"
    log "No invoices to process. Done."
    return 0
  fi

  local today
  today=$(date -u '+%Y-%m-%d')

  # Process each invoice
  echo "$invoices" | jq -c '.[]' | while IFS= read -r invoice; do
    local invoice_id invoice_num client amount paid_date invoice_url
    invoice_id=$(xero_get_invoice_id "$invoice")
    invoice_num=$(xero_get_invoice_number "$invoice")
    client=$(xero_get_contact_name "$invoice")
    amount=$(xero_get_amount_paid "$invoice")
    paid_date=$(xero_get_fully_paid_date "$invoice")
    invoice_url=$(xero_get_invoice_url "$invoice")

    log "Processing invoice $invoice_num ($invoice_id) — $client — £$amount"

    # Skip if already notified
    if state_is_notified "$invoice_id"; then
      log "  Already notified, skipping"
      continue
    fi

    # Find matching Monday item by invoice number
    local monday_item
    monday_item=$(monday_find_by_invoice_number "$invoice_num")

    if [[ -z "$monday_item" || "$monday_item" == "null" ]]; then
      log "  No Monday match found for $invoice_num in group new_group6580"
      # Still notify Slack so team knows — item may be in wrong group
      if [[ "$DRY_RUN" != "true" ]]; then
        slack_notify_paid "$client" "$amount" "$paid_date" "$invoice_url" "(not in Invoiced group — check Monday)"
      else
        log "  [DRY RUN] Would notify Slack: $client — £$amount (not in Invoiced group)"
      fi
      state_mark_notified "$invoice_id"
      continue
    fi

    local item_id item_name client_invoice_url
    item_id=$(echo "$monday_item" | jq -r '.id')
    item_name=$(echo "$monday_item" | jq -r '.name')
    client_invoice_url=$(monday_extract_invoice_url "$monday_item")
    local monday_url="https://icorrect.monday.com/boards/349212843/pulses/$item_id"

    log "  Matched Monday item: $item_name (ID: $item_id)"

    # Get current paid amount and quote
    local existing_paid quote
    existing_paid=$(monday_get_paid "$item_id")
    quote=$(monday_get_quote "$item_id")

    # Calculate new paid amount
    local new_paid
    if [[ -z "$existing_paid" || "$existing_paid" == "0" || "$existing_paid" == "null" ]]; then
      new_paid="$amount"
      log "  Paid was empty, setting to £$amount"
    else
      new_paid=$(echo "$existing_paid + $amount" | bc -l)
      log "  Paid was £$existing_paid, adding £$amount = £$new_paid"
    fi

    # Check for mismatch
    local mismatch=false
    if [[ -n "$quote" && "$quote" != "null" && "$quote" != "0" ]]; then
      # Normalize for comparison (handle floating point)
      if [[ $(echo "$new_paid != $quote" | bc -l) -eq 1 ]]; then
        mismatch=true
        log "  MISMATCH: quote=£$quote, new paid=£$new_paid"
      fi
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      log "  [DRY RUN] Would update Monday: Paid=£$new_paid, Status=Paid"
      if [[ "$mismatch" == "true" ]]; then
        log "  [DRY RUN] Would flag mismatch in Slack"
      else
        log "  [DRY RUN] Would notify Slack: payment received"
      fi
    else
      # Update Monday
      monday_update_paid "$item_id" "$new_paid"
      log "  Updated Monday item $item_id"

      # Notify Slack
      if [[ "$mismatch" == "true" ]]; then
        slack_notify_mismatch "$client" "$invoice_num" "$quote" "$existing_paid" "$amount" "$new_paid" "$monday_url" "${client_invoice_url:-$invoice_url}"
        log "  Flagged mismatch in Slack"
      else
        slack_notify_paid "$client" "$amount" "$paid_date" "${client_invoice_url:-$invoice_url}" "$monday_url"
        log "  Notified Slack"
      fi
    fi

    state_mark_notified "$invoice_id"
    log "  Marked as notified"
  done

  state_set_last_checked "$today"
  log "=== Done. Next check from $today ==="
}

main "$@"

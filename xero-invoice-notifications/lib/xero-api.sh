#!/usr/bin/env bash
# xero-api.sh — Xero API helpers for invoice payment notifications

set -euo pipefail

ENV_PATH="/home/ricky/config/api-keys/.env"

# Get a fresh access token by calling the refresh script
xero_get_access_token() {
  bash /home/ricky/config/xero_refresh.sh
}

# Fetch paid invoices from Xero since a given date
# Usage: xero_fetch_paid_invoices "2026-04-20"
# Returns: JSON array of invoice objects
xero_fetch_paid_invoices() {
  local since_date="$1"
  local access_token
  access_token=$(xero_get_access_token)

  source "$ENV_PATH"

  # Xero uses DateTime(year,month,day) format in where clauses
  local year month day
  year=$(echo "$since_date" | cut -d'-' -f1)
  month=$(echo "$since_date" | cut -d'-' -f2)
  day=$(echo "$since_date" | cut -d'-' -f3)

  curl -s -G "https://api.xero.com/api.xro/2.0/Invoices" \
    -H "Authorization: Bearer $access_token" \
    -H "xero-tenant-id: $XERO_TENANT_ID" \
    -H "Accept: application/json" \
    -d "Statuses=PAID" \
    -d "where=FullyPaidOnDate>=DateTime($year,$month,$day)" \
    | jq -r '.Invoices // []'
}

# Extract or construct invoice URL from Xero invoice object
# Xero sometimes returns null Url, so we construct a fallback
xero_get_invoice_url() {
  local invoice_json="$1"
  local url
  url=$(echo "$invoice_json" | jq -r '.Url // empty')

  if [[ -n "$url" && "$url" != "null" ]]; then
    echo "$url"
    return
  fi

  # Fallback: construct from InvoiceID
  local invoice_id
  invoice_id=$(echo "$invoice_json" | jq -r '.InvoiceID // empty')
  if [[ -n "$invoice_id" ]]; then
    echo "https://go.xero.com/organisationlogin/default.aspx?shortcode=!#AccountsReceivable/View.aspx?InvoiceID=$invoice_id"
  else
    echo ""
  fi
}

# Extract key fields from invoice JSON
xero_get_invoice_number() { echo "$1" | jq -r '.InvoiceNumber // "N/A"'; }
xero_get_contact_name() { echo "$1" | jq -r '.Contact.Name // "Unknown"'; }
xero_get_total() { echo "$1" | jq -r '.Total // 0'; }
xero_get_amount_paid() { echo "$1" | jq -r '.AmountPaid // 0'; }
xero_get_fully_paid_date() {
  local date_field
  date_field=$(echo "$1" | jq -r '.FullyPaidOnDate // empty')
  # Xero returns dates as /Date(1776211200000+0000)/ — parse to YYYY-MM-DD
  if [[ "$date_field" =~ /Date\(([0-9]+) ]]; then
    local timestamp_ms="${BASH_REMATCH[1]}"
    local timestamp_s=$((timestamp_ms / 1000))
    date -u -d "@$timestamp_s" '+%Y-%m-%d'
  else
    echo "$date_field"
  fi
}
xero_get_invoice_id() { echo "$1" | jq -r '.InvoiceID // empty'; }

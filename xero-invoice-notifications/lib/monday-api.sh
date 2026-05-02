#!/usr/bin/env bash
# monday-api.sh — Monday.com GraphQL helpers

set -euo pipefail

ENV_PATH="/home/ricky/config/api-keys/.env"
MONDAY_API="https://api.monday.com/v2"
BOARD_ID="349212843"

monday_query() {
  local query="$1"
  source "$ENV_PATH"

  curl -s -X POST "$MONDAY_API" \
    -H "Authorization: $MONDAY_APP_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$query" | jq -R -s '.')}"
}

# Find Monday item by Xero invoice number
# Michael stores: "INV-3531 - https://in.xero.com/..." in link_mm0a43e0
# Items are in group "new_group6580" (Client Services - To Do) when invoiced
# Returns: JSON with item id and name, or empty if not found
monday_find_by_invoice_number() {
  local invoice_num="$1"

  # Search within the invoiced group only for efficiency
  local query
  query=$(cat <<EOF
query {
  boards(ids: [$BOARD_ID]) {
    groups(ids: ["new_group6580"]) {
      items_page(limit: 500) {
        items {
          id
          name
          column_values(ids: ["link_mm0a43e0", "dup__of_quote_total", "formula74"]) {
            id
            text
            value
          }
        }
      }
    }
  }
}
EOF
)

  monday_query "$query" | jq -r --arg num "$invoice_num" '
    .data.boards[0].groups[0].items_page.items[]
    | select(.column_values[] | select(.id == "link_mm0a43e0") | .text | contains($num))
  '
}

# Extract the client-facing Xero invoice URL from the Monday link column
# Column text looks like: "INV-3531 - https://in.xero.com/..."
# or older format: "Repair - https://in.xero.com/..."
monday_extract_invoice_url() {
  local item_json="$1"
  echo "$item_json" | jq -r '
    .column_values[]
    | select(.id == "link_mm0a43e0")
    | (.text // "")
    | capture("(?<url>https://in\\.xero\\.com/[^ ]+)")
    | .url
  ' 2>/dev/null || true
}

# Get the current Paid amount for an item
monday_get_paid() {
  local item_id="$1"

  local query
  query=$(cat <<EOF
query {
  items(ids: [$item_id]) {
    column_values(ids: ["dup__of_quote_total"]) {
      id
      text
    }
  }
}
EOF
)

  monday_query "$query" | jq -r '.data.items[0].column_values[0].text // "0"'
}

# Get the Quote amount for an item
monday_get_quote() {
  local item_id="$1"

  local query
  query=$(cat <<EOF
query {
  items(ids: [$item_id]) {
    column_values(ids: ["formula74"]) {
      id
      text
    }
  }
}
EOF
)

  monday_query "$query" | jq -r '.data.items[0].column_values[0].text // empty'
}

# Update Monday item: set Invoice Status to Paid and update Paid amount
# Usage: monday_update_paid item_id amount
monday_update_paid() {
  local item_id="$1"
  local amount="$2"

  local column_values
  column_values=$(jq -n \
    --arg status "Paid" \
    --arg amount "$amount" \
    '{"color_mm0pkek6": {"label": $status}, "dup__of_quote_total": $amount}')

  local query
  query=$(cat <<EOF
mutation {
  change_multiple_column_values(
    board_id: $BOARD_ID,
    item_id: $item_id,
    column_values: $(echo "$column_values" | jq -R -s '.')
  ) {
    id
  }
}
EOF
)

  monday_query "$query" | jq -r '.data.change_multiple_column_values.id // empty'
}

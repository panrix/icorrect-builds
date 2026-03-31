# Monday Webhook Map — Board 349212843

**Queried:** 2026-03-30 via Monday GraphQL API
**Total webhooks:** 31

## The Two "Any Column Change" Webhooks (Token Burners)

| ID | Event | Config | Classification |
|----|-------|--------|----------------|
| **537444955** | `change_column_value` | `{}` (no filter) | **ACTIVE, destination unknown.** Fires on every column change. Cannot determine URL via API — Monday automation-created webhooks don't expose their target URL through GraphQL. Need to check Monday UI. |
| **530471762** | `change_column_value` | `{}` (no filter) | **ACTIVE, destination unknown.** Same issue. |

**Note:** These are NOT "likely dead." They are active webhooks firing on every column change. Their destinations are unknown because Monday's API doesn't expose webhook URLs. The automation audit says 537444955 should trigger on parts changes only, and 530471762 should trigger on status changes for Intercom notifications.

**Action required:** Ricky or Ferrari must check the actual destination URLs in the Monday.com automation builder UI before these can be safely disabled.

## Other "Any Column Change" Webhooks

| ID | Event | Config | Notes |
|----|-------|--------|-------|
| 349863361 | `change_column_value` | `{}` | Legacy — predates the two above |
| 349863952 | `change_column_value` | `{}` | Legacy |
| 350113039 | `change_column_value` | `{}` | Legacy |

**3 additional catch-all webhooks** with empty configs. These are also burning tokens if still active.

## Status4 Column Webhooks (Properly Filtered)

| ID | Event | Column | Filter | Likely Consumer |
|----|-------|--------|--------|-----------------|
| 264095774 | `change_specific_column_value` | `status4` | Any change | Cloudflare Worker (status notifications) |
| 337386341 | `change_specific_column_value` | `status4` | Any change | Duplicate? Or different consumer |
| 509016371 | `change_status_column_value` | `status4` | Index 9 | Specific status trigger |
| 520364200 | `change_status_column_value` | `status4` | Index 102 | "Ready To Collect" |
| 554494105 | `change_status_column_value` | `status4` | Index 2 | Specific status trigger |
| 554555283 | `change_status_column_value` | `status4` | Index 160 | "Shipped" → bm-shipping service |

## Other Targeted Webhooks

| ID | Event | Column | Purpose |
|----|-------|--------|---------|
| 520364311 | `change_status_column_value` | `color_mkzkats9` (Parts Deducted) | Index 1 → "Do Now!" |
| 526854222 | `change_specific_column_value` | `board_relation_mm01yt93` (Parts Required) | Parts service |
| 537692848 | `change_status_column_value` | `color_mm0pjwz1` (Invoice Action) | Index 1 → "Create Invoice" |
| 250217665 | `change_specific_column_value` | `text4` (Serial) | iCloud checker |
| 542684924 | `change_specific_column_value` | `text4` (Serial) | iCloud checker (newer) |
| 554493080 | `change_specific_column_value` | `text4` (Serial) | iCloud checker (newest) |
| 554546166 | `change_status_column_value` | `status24` (Repair Type) | Index 12 → "Pay-Out" → bm-payout |
| 530469026 | `create_item` | — | Item creation webhook |
| 349862649 | `create_item` | — | Legacy item creation |
| 349881274 | `create_item` | — | Legacy item creation |

## Key Finding

**Webhook IDs 264095774 and 337386341** are the properly-filtered `status4` webhooks that likely feed the Cloudflare Worker for status notifications. These are `change_specific_column_value` events (only fire on status4 changes, not all columns). The two broken automations (537444955, 530471762) are separate — they fire on ALL column changes and their purpose/destination is unknown without checking the Monday UI.

**This means:** Disabling 537444955 and 530471762 will NOT break the status notification flow, because the notification flow uses the properly-filtered webhooks (264095774 or 337386341). However, we still need to confirm their destinations in the Monday UI to be safe.

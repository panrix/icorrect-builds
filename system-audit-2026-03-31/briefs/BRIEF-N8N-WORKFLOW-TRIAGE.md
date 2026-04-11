# Brief: n8n Workflow Triage and Classification

## Objective

Classify every n8n workflow on the iCorrect Cloud instance. Determine which are actively needed, which are dead experiments, which should be reactivated, and which are duplicates or broken. The previous audit found 39 of 52 workflows inactive but didn't classify them.

## Data Sources

### n8n
- Use n8n Cloud REST API
- Credentials: `N8N_CLOUD_API_TOKEN` from `/home/ricky/config/api-keys/.env`
- Base URL: check the .env file for `N8N_BASE_URL` or use the n8n Cloud API endpoint. Previous audit used n8n Cloud successfully.

### Previous Research
- `n8n-workflow-audit.md` has the initial workflow inventory (37KB, 184 lines)
- Read it first to avoid re-pulling data that's already documented

### Context Files
- `/home/ricky/kb/` for understanding which integrations are supposed to be active
- The systems architecture map at `systems-architecture.md` documents known integration flows

## Analysis

### 1. Full Workflow Inventory
For each workflow, pull:
- ID, name, active/inactive status
- Trigger type (webhook, cron, manual, event)
- Nodes used (what services does it connect?)
- Last execution date and result (success/error)
- Execution count (last 30 days if available)
- Created date, last modified date

### 2. Classification
Classify each workflow into:

**Active & Healthy**: active, executing recently, no errors
**Active & Broken**: active but recent executions are failing
**Inactive & Needed**: inactive but maps to a documented business process that should be running
**Inactive & Redundant**: inactive and superseded by a VPS service, another workflow, or manual process
**Inactive & Experimental**: appears to be a test/experiment, never fully deployed
**Inactive & Unknown**: can't determine purpose from name/nodes alone
**Duplicate**: very similar to another workflow (same trigger + same services)

### 3. Service Coverage Map
Cross-reference workflows against known integration needs:
- Shopify order processing
- Monday status updates
- Intercom routing
- BackMarket notifications
- Xero invoicing
- Typeform intake
- Royal Mail tracking
- Stripe/SumUp payment processing
- Google Sheets/Docs reporting

For each integration need, state whether it's:
- Covered by an active n8n workflow
- Covered by a VPS service instead (e.g. systemd services under `/home/ricky/builds/`)
- Not covered by anything (gap)
- Covered by both (duplication risk)

### 4. Execution History Analysis
- Workflows with recent errors: what's failing and why?
- Workflows with zero executions in 30+ days despite being active: are they waiting for triggers that never fire?
- Highest-volume workflows: what's handling the most traffic?

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/n8n-workflow-triage.md`:

### Section 1: Summary
- Total workflows, active vs inactive
- Classification breakdown
- Execution health summary

### Section 2: Active Workflows (sorted by execution volume)
| ID | Name | Trigger | Services | Last Execution | Executions (30d) | Status | Notes |

### Section 3: Recommended Reactivations
| ID | Name | Purpose | Why Reactivate | Dependencies |

### Section 4: Safe to Delete/Archive
| ID | Name | Classification | Reason | Last Execution |

### Section 5: Broken/Failing
| ID | Name | Error | Last Success | Impact | Fix Suggestion |

### Section 6: Coverage Map
| Integration Need | n8n Workflow | VPS Service | Status | Gap/Overlap |

### Section 7: Recommendations
1. Workflows to reactivate (with any config needed)
2. Workflows to delete
3. Gaps to fill (integration needs with no coverage)
4. Duplications to consolidate

## Constraints

- Read-only. Do not activate, deactivate, modify, or delete any workflows.
- Do not execute any workflows manually.
- If certain API endpoints require different auth or aren't available, document what failed.

When completely finished, run:
openclaw system event --text "Done: n8n workflow triage complete - written to n8n-workflow-triage.md" --mode now

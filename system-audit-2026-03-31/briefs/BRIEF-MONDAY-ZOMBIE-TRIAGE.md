# Brief: Monday Board Zombie Item Triage

## Objective

Classify every non-terminal item on the Monday main board that hasn't been touched in 30+ days. For each one, determine: safe to archive, needs customer follow-up, or has financial implications. Output a structured triage list that operations can action.

## Data Sources

### Monday
- **Main board**: `349212843`
- Pull ALL items that are NOT in terminal statuses: `Ready To Collect`, `Repaired`, `Returned`, `Shipped`, `Collected`, `Cancelled`, `Declined`, `BER`
- For each item, pull: name, status, group, assigned tech, last activity date, all status columns, any linked Xero invoice ID, payment columns, customer contact info, updates (last 3)
- Credentials: `MONDAY_APP_TOKEN` from `/home/ricky/config/api-keys/.env`

### Context
- The Monday data quality audit (`monday-data-quality-audit.md`) identified 535 zombie items and 212 needing review out of 907 non-terminal items
- Only 152 were classified as real WIP

## Classification Rules

### Category 1: Safe to Archive
- Status has not changed in 90+ days AND
- No payment recorded AND
- No Xero invoice linked AND
- Device is not physically in the workshop (status suggests pre-arrival or abandoned)
- Statuses that suggest archivable: `Awaiting Confirmation`, `Booking Confirmed` (if >90 days), `Quote Sent` (if >90 days with no follow-up)

### Category 2: Needs Customer Follow-Up
- Status suggests waiting on customer: `Quote Sent`, `Awaiting Approval`, `Awaiting Parts (customer)`, `Customer Collection`
- Last activity 30-90 days ago
- Device may still be in workshop
- No terminal outcome recorded

### Category 3: Financial Implications
- Has a payment column value OR Xero invoice linked
- But not in a completed/terminal status
- Could represent: unpaid invoice, partial payment, unreturned device with deposit
- These need manual review before any action

### Category 4: Real WIP
- Last activity within 30 days
- Status suggests active work: `Under Repair`, `Under Refurb`, `Awaiting Parts`, `Received`
- Leave these alone

### Category 5: Leads to Chase (special group)
- The audit found 357 items in "Leads to Chase" group, 100% zombie
- Classify each: has any useful contact info? Any follow-up history? Worth re-engaging or pure dead weight?

## Analysis

### Per-Item Classification
For each non-terminal item:
1. Days since last status change
2. Days since last update/activity
3. Has payment data (any amount in payment columns)
4. Has Xero invoice reference
5. Current status and group
6. Assigned technician
7. Classification (1-5 above)
8. Recommended action

### Aggregate Analysis
- Total items per category
- Age distribution of zombies (30-90d, 90-180d, 180-365d, 365d+)
- Financial exposure in Category 3 items
- "Leads to Chase" breakdown

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/monday-zombie-triage.md`:

### Section 1: Summary
- Total non-terminal items analysed
- Breakdown by category (with counts and percentages)
- Total financial exposure in unresolved items

### Section 2: Safe to Archive (sorted by age, oldest first)
| Item | Customer | Status | Group | Last Activity | Days Stale | Reason |

### Section 3: Needs Customer Follow-Up (sorted by days stale)
| Item | Customer | Status | Group | Last Activity | Days Stale | Contact Info Available | Suggested Action |

### Section 4: Financial Implications (sorted by £ amount descending)
| Item | Customer | Status | Payment | Xero Ref | Days Stale | Issue | Required Action |

### Section 5: Leads to Chase Analysis
| Item | Customer | Contact Available | Any History | Worth Re-engaging | Reason |

### Section 6: Recommended Batch Actions
1. Items to archive immediately (with count)
2. Customer follow-up campaign list (with template suggestions)
3. Finance review list (for Ricky/accountant)
4. Leads to purge vs re-engage

## Constraints

- Read-only. Do not modify any Monday items.
- Do not contact any customers.
- Where customer names appear, include them for identification but note this is internal only.

When completely finished, run:
openclaw system event --text "Done: Monday zombie triage complete - written to monday-zombie-triage.md" --mode now

# Xero API Integration — Audit & Reference

**Date:** 2026-02-26
**Audited by:** Claude Code (Phase 0, Session 2)
**Status:** Partially built. Invoice automation Phase 1 deployed to n8n Cloud. VAT forensics scripts exist but contain hardcoded credentials. Token refresh is fragile.

---

## Section 1: Current Integration State

### What Is Connected

| Component | Status | Location |
|-----------|--------|----------|
| Xero OAuth2 app | ACTIVE | Panrix Ltd tenant (72344ba9-f550-453d-86d8-34822817b2bd) |
| n8n Cloud instance | RUNNING | https://icorrect.app.n8n.cloud (Docker on VPS, port 5678) |
| Invoice Creator workflow | ACTIVE on n8n | Workflow ID: 9jD6J2X3yCPk8Rjp |
| Monday.com integration | CONFIGURED | Board 349212843, Monday.com account 3 credential in n8n |
| Xero env vars | PRESENT | 6 vars in /home/ricky/config/api-keys/.env |
| Token refresh script | EXISTS | ~/.openclaw/agents/main/]/scripts/xero_refresh.sh |

### Environment Variables (all in /home/ricky/config/api-keys/.env)

| Variable | Present |
|----------|---------|
| XERO_CLIENT_ID | Yes |
| XERO_CLIENT_SECRET | Yes |
| XERO_REFRESH_TOKEN | Yes |
| XERO_TENANT_ID | Yes |
| FERRARI_XERO_CLIENT_ID | Yes |
| FERRARI_XERO_CLIENT_SECRET | Yes |

**Note:** There are TWO sets of Xero credentials. The FERRARI_ prefixed ones appear to be a separate Xero OAuth app (possibly for Ferrari direct access or a different integration path). The primary set (no prefix) is what the n8n workflows and scripts use.

### n8n Status

n8n is running as a Docker container on the VPS:
- Container: n8nio/n8n, up 2+ weeks
- Port: 0.0.0.0:5678->5678
- Cloud URL: https://icorrect.app.n8n.cloud
- Also accessible locally on port 5678

### Token Refresh Mechanism

Xero uses single-use refresh tokens. Every API call that refreshes the access token also rotates the refresh token. The current mechanism:

1. **xero_refresh.sh** reads XERO_REFRESH_TOKEN from .env, calls Xero token endpoint, saves new refresh token back via sed
2. **n8n workflows** use n8n built-in xeroOAuth2Api credential (handles refresh internally)
3. **Python scripts** (forensics) have HARDCODED credentials — they do NOT read from .env

**CRITICAL ISSUE:** If the refresh token is rotated by one system (e.g., a script), the token stored in .env becomes stale and any other system using .env will fail with 401. There is no locking or coordination between the shell script, n8n, and the Python scripts.

---

## Section 2: Available Xero API Capabilities

### What Has Been Built

#### 1. Invoice Creator (n8n workflow — Phase 1, DEPLOYED)
- **Trigger:** Monday.com webhook (button click on Main Board item)
- **Flow:** Read Monday item -> validate -> calculate invoice total -> refresh Xero token -> find/create Xero contact -> create DRAFT invoice -> write back to Monday -> post comment
- **Webhook URL:** https://icorrect.app.n8n.cloud/webhook/xero-invoice-create
- **Calculation:** invoice_total = formula74 (quote) - dup__of_quote_total (paid) - discount
- **Blocks:** Corporate Warranty, BM, Refurb types; missing email; zero/negative total; duplicate invoices
- **Xero settings:** Account code 201, TaxType OUTPUT2 (20% VAT inclusive), single line item, GBP, DRAFT status
- **Monday columns:** Invoice Status (color_mm0pkek6), Invoice Amount (numeric_mm0pvem5), Xero Invoice ID (text_mm0a8fwb), Xero Invoice URL (link_mm0a43e0)

#### 2. Send Invoice (n8n workflow JSON — NOT DEPLOYED to n8n Cloud)
- **Flow:** Read Monday item -> get Xero Invoice ID -> authorise invoice in Xero -> get online payment URL -> send via Intercom conversation -> update Monday -> notify Slack
- **File:** ~/.openclaw/agents/operations/workspace/docs/workflows/xero-send-invoice.json
- **Issue:** Xero credential IDs are placeholder (REPLACE_WITH_XERO_CRED_ID), Slack channel ID is placeholder
- **Status:** Spec-complete JSON, needs credential binding and deployment

#### 3. Payment Received Webhook (n8n workflow JSON — NOT DEPLOYED)
- **Flow:** Receive Xero webhook (INVOICE.PAID) -> fetch invoice -> extract Monday item ID from reference -> update Monday payment status -> post comment -> send Intercom thank-you -> notify Slack
- **File:** ~/.openclaw/agents/operations/workspace/docs/workflows/xero-payment-received.json
- **Issue:** Same placeholder credential IDs. Xero webhook not registered. Monday item mapping relies on reference field containing "Monday ID:" which the invoice creator does NOT set.
- **Status:** Spec-complete JSON, needs credential binding, webhook registration, and reference field fix

#### 4. VAT Forensics (Python scripts — RAN ONCE, Feb 6 2026)
- **Purpose:** Audit all Xero invoices for reversed payments and potential duplicate payments
- **Results:** 1,781 invoices analyzed, 147 reversed payments found, 1 potential duplicate (INV-1892, Daniel Green, 390 GBP), 78 GBP VAT potentially overpaid
- **Issue:** Token expired partway through (~1760 invoices), last ~20 not checked. Also: HARDCODED CREDENTIALS in script.
- **Scripts:** xero_vat_forensics.py (v1), xero_vat_forensics_v2.py (v2, rate-limited)

#### 5. Payment Reconciliation (Python script — PARTIALLY WORKING)
- **Purpose:** Match Stripe/SumUp payments to Monday board items
- **File:** ~/.openclaw/agents/finance-archived/workspace/docs/payment_reconciliation.py
- **Result:** ~70+ payments reconciled as of Feb 10. ~34 still need Payment 1, ~35 need Payment 2.

#### 6. Xero API Reference Doc (Agent Reference)
- **File:** ~/.openclaw/agents/main/]/tools/xero.md
- **Content:** Token refresh instructions, API examples for P&L, Balance Sheet, Invoices, Contacts, Bank Transactions
- **Used by:** Jarvis agent (main) for ad-hoc Xero queries

### Xero API Endpoints Used

| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| /connect/token | POST | OAuth2 token refresh | All (scripts, n8n, shell) |
| /api.xro/2.0/Invoices | POST | Create draft invoice | n8n Invoice Creator |
| /api.xro/2.0/Invoices/{ID} | POST | Authorise invoice | Send Invoice workflow |
| /api.xro/2.0/Invoices/{ID}/OnlineInvoice | GET | Get payment URL | Send Invoice workflow |
| /api.xro/2.0/Invoices/{ID}/Email | POST | Email invoice to client | Spec only (not built) |
| /api.xro/2.0/Invoices/{ID}/History | GET | Invoice history records | VAT Forensics script |
| /api.xro/2.0/Invoices | GET | List/filter invoices | VAT Forensics, agent queries |
| /api.xro/2.0/Contacts | GET | Search contacts | n8n Invoice Creator |
| /api.xro/2.0/Contacts | POST | Create contact | n8n Invoice Creator |
| /api.xro/2.0/Reports/ProfitAndLoss | GET | P&L report | Agent queries |
| /api.xro/2.0/Reports/BalanceSheet | GET | Balance sheet | Agent queries |
| /api.xro/2.0/BankTransactions | GET | Bank transactions | Agent queries |

### Xero Tenant Details

| Field | Value |
|-------|-------|
| Company | Panrix Limited (t/a iCorrect) |
| Tenant ID | 72344ba9-f550-453d-86d8-34822817b2bd |
| Currency | GBP |
| Default Account Code | 201 |
| Tax Type | OUTPUT2 (20% VAT, inclusive) |
| Invoice URL Pattern | https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID={ID} |

---

## Section 3: Files Found (Complete Inventory)

### /home/ricky/builds/xero-invoice-automation/
| File | Purpose | Notes |
|------|---------|-------|
| BRIEF.md | Phase 1 build specification | Comprehensive — Monday column IDs, Xero API details, calculation logic |
| SETUP.md | Deployment guide | Documents webhook URL, Monday automation setup instructions |
| WEBHOOK_URL.txt | Live webhook URL | https://icorrect.app.n8n.cloud/webhook/xero-invoice-create |
| workflow.json | n8n workflow v1 | Initial version |
| workflow_v2.json | n8n workflow v2 | After Monday credential fix |
| workflow_v3.json | n8n workflow v3 | After challenge response fix |
| workflow_v4.json | n8n workflow v4 | Final — body format fix |
| build_workflow.py | Python to generate workflow JSON | Used n8n Cloud API |
| patch_workflow.py | Python to update deployed workflow | |
| fix_challenge.py | Fix for Monday webhook challenge | |
| fix_query.py | Fix for Monday GraphQL query | |
| fix_body_format.py | Fix for request body format | |
| .git/ | Git repo | 4+ commits tracked |

### ~/.openclaw/agents/operations/workspace/docs/workflows/
| File | Purpose | Notes |
|------|---------|-------|
| xero-generate-invoice.json | Invoice creator workflow (full) | n8n-format JSON, credential IDs are placeholders |
| xero-send-invoice.json | Invoice sender workflow | NOT deployed, placeholder creds |
| xero-payment-received.json | Payment webhook handler | NOT deployed, placeholder creds, Xero webhook not registered |

### ~/.openclaw/agents/processes/workspace/docs/workflows/
| File | Purpose | Notes |
|------|---------|-------|
| xero-generate-invoice.json | Copy of invoice creator | DUPLICATE — old processes agent workspace |
| xero-send-invoice.json | Copy of invoice sender | DUPLICATE |
| xero-payment-received.json | Copy of payment handler | DUPLICATE |

### ~/.openclaw/agents/main/]/scripts/
| File | Purpose | Notes |
|------|---------|-------|
| xero_refresh.sh | Token refresh shell script | Reads from .env, saves back via sed |
| xero_refresh_token.txt | Stored refresh token | STALE — separate from .env, likely out of sync |
| xero_vat_forensics.py | VAT audit v1 | HARDCODED CREDENTIALS (client ID, secret, tenant ID) |
| xero_vat_forensics_v2.py | VAT audit v2 (rate-limited) | HARDCODED CREDENTIALS |

### ~/.openclaw/agents/main/]/docs/finance/
| File | Purpose | Notes |
|------|---------|-------|
| xero-invoice-automation-spec.md | Full invoice automation PRD | 5-step architecture, edge cases, implementation checklist |
| xero_forensics_log.txt | Output log from forensics run | 1,781 invoices, ran Feb 6 2026 |
| xero_vat_forensics_results.json | JSON results from forensics | 147 reversed payments, 1 duplicate |

### ~/.openclaw/agents/main/]/tools/
| File | Purpose | Notes |
|------|---------|-------|
| xero.md | Xero API reference for agents | Token refresh, report endpoints, curl examples |

### ~/.openclaw/agents/finance-archived/workspace/docs/
| File | Purpose | Notes |
|------|---------|-------|
| xero_forensics_log.txt | Copy of forensics log | DUPLICATE from pre-merge |
| xero_refresh_token.txt | Old refresh token | STALE — 43 bytes, from before finance merge |
| xero_vat_forensics.py | Copy of v1 script | HARDCODED CREDENTIALS |
| xero_vat_forensics_v2.py | Copy of v2 script | HARDCODED CREDENTIALS |
| xero_vat_forensics_results.json | Copy of results | DUPLICATE |
| payment_reconciliation.py | Stripe/SumUp reconciliation | 20KB, executable |
| KNOWLEDGE-BASE.md | Finance agent knowledge | KPI data, forensics summary, reconciliation details |
| iCorrect_KPI_Tracker_Updated.xlsx | KPI spreadsheet | Weekly data through W/C 26 Jan 2026 |

### ~/.openclaw/agents/operations/workspace/docs/finance/
| File | Purpose | Notes |
|------|---------|-------|
| KNOWLEDGE-BASE.md | Finance knowledge (migrated) | Same as archived version |
| otter-transcript-insights.md | Ali Greenwood meeting insights | Revenue, profit gaps, debt, KPI framework |

### Other References
| File | Xero Content |
|------|--------------|
| /home/ricky/builds/documentation/raw-imports/finance-cashflow.md | Cash flow model, Xero reconciliation status, Stripe import |
| /home/ricky/builds/agents/FINANCE-MERGE.md | Finance -> Operations merge log, Xero scope transfer |
| /home/ricky/builds/agent-rebuild/archive/2026-04-01/root-docs/08-research-needed.md | Historical rebuild note listing Xero API docs as a research item |
| ~/.openclaw/agents/operations/workspace/CLAUDE.md | Sections 6-9: Xero API ref, HMRC, KPIs, Cash Flow format |

---

## Section 4: Gaps and Issues

### CRITICAL

1. **Hardcoded credentials in Python scripts** — xero_vat_forensics.py (v1 and v2) contain the Xero CLIENT_ID and CLIENT_SECRET in plaintext. These exist in 4 copies across the VPS:
   - ~/.openclaw/agents/main/]/scripts/xero_vat_forensics.py
   - ~/.openclaw/agents/main/]/scripts/xero_vat_forensics_v2.py
   - ~/.openclaw/agents/finance-archived/workspace/docs/xero_vat_forensics.py
   - ~/.openclaw/agents/finance-archived/workspace/docs/xero_vat_forensics_v2.py

2. **Token refresh race condition** — Three independent systems can rotate the refresh token (xero_refresh.sh, n8n internal, Python scripts). No locking mechanism. If two rotate at the same time, one gets a stale token and all subsequent calls fail with 401. There is no locking or coordination between the shell script, n8n, and the Python scripts.

3. **n8n workflow credentials are placeholders** — The send-invoice and payment-received workflow JSONs have REPLACE_WITH_XERO_CRED_ID instead of actual n8n credential IDs. They cannot be deployed as-is.

4. **Xero webhook not registered** — The payment-received workflow expects Xero to POST webhook events, but no Xero webhook subscription has been created in the Xero developer portal.

### HIGH

5. **Payment-received workflow has broken item lookup** — It tries to extract "Monday ID:" from the invoice Reference field, but the invoice creator does NOT embed the Monday item ID in the reference. It sets reference to "{Device Name} Repair". The payment webhook will never find the corresponding Monday item.

6. **Xero reconciliation is behind** — Per finance-cashflow.md: "Xero is not fully reconciled — bank statement data is more reliable than Xero for decision-making." This means any Xero API data for reporting may be incomplete.

7. **FERRARI_XERO credentials unexplained** — Two additional Xero vars (FERRARI_XERO_CLIENT_ID, FERRARI_XERO_CLIENT_SECRET) exist. Purpose unclear. Could be a separate OAuth app intended for Ferrari direct use, or an alternate integration path. No documentation found.

8. **Duplicate files everywhere** — The same workflow JSONs exist in 3 locations (operations, processes, main agent). The forensics scripts and results exist in 2 locations (main, finance-archived). This creates confusion about which is canonical.

### MEDIUM

9. **Invoice automation Phase 2 not started** — "Send Invoice" and "Payment Received" were spec'd and JSON-drafted but never deployed. The Monday button for sending invoices is not connected.

10. **KPI export script broken** — monday_kpi_export.py returned 0 results when tested (column mapping or date field issue). Not Xero-specific but affects the KPI pipeline that depends on Xero + Monday data.

11. **No Xero-to-Supabase pipeline** — Operations agent has Xero as source of truth for financial metrics, but no automated data flow from Xero to Supabase. Financial reporting requires manual Xero queries each time.

12. **VAT forensics incomplete** — Last ~20 invoices failed with 401 (token expired mid-run). INV-1892 (Daniel Green, 390 GBP duplicate) not resolved. 78 GBP potential VAT overpayment not reclaimed.

13. **Stale refresh tokens in files** — xero_refresh_token.txt exists in both main agent and finance-archived workspaces. These are separate from the .env file and almost certainly expired/stale. Any script reading from these files will fail.

---

## Section 5: What a Research Agent Needs to Know

### For research-finance (or whoever owns Xero research):

**Current reality:**
- Xero is the accounting system of record for Panrix Ltd (iCorrect)
- OAuth2 connection exists and works (credentials in .env)
- n8n Cloud has one active workflow: invoice creation from Monday.com
- Two more workflows (send invoice, payment webhook) are drafted but NOT deployed
- Xero is NOT fully reconciled — bank statements are more reliable for current state
- HMRC debt exists — payment plan of ~5k/month, tracked via Xero scheduled payments

**What works today:**
- Ferrari can (in theory) click a button on Monday to create a Xero draft invoice
- The Jarvis agent can query Xero for P&L, Balance Sheet, Invoices, Contacts, and Bank Transactions using the curl patterns in ~/.openclaw/agents/main/]/tools/xero.md
- Token refresh works via xero_refresh.sh IF no other system has rotated the token first

**What does NOT work:**
- Sending invoices to customers (Phase 2 not deployed)
- Automatic payment status updates (Xero webhook not registered)
- Automated KPI reporting from Xero (script broken, no Supabase pipeline)
- Concurrent Xero API access from multiple systems (token rotation conflict)

**Monday board columns for invoicing (Board 349212843):**
- Xero Invoice ID: text_mm0a8fwb
- Xero Invoice URL: link_mm0a43e0
- Invoice Status: color_mm0pkek6
- Invoice Amount: numeric_mm0pvem5

**Key financial context (from Otter transcripts with Ali Greenwood):**
- iCorrect does ~12-13k/week revenue (BM ~10k + non-corporate ~2.5k)
- Profit per repair is unknown — Ali flagged this as the biggest blind spot
- HMRC debt is being managed with monthly payments
- Xero reconciliation backlog means financial reports may be inaccurate
- Weekly KPI tracker goes to Ali (Excel, not automated)

**Before building anything new, fix these first:**
1. Remove hardcoded credentials from all Python scripts (use .env)
2. Establish a single token refresh mechanism (one source of truth for refresh token)
3. Decide: is n8n the invoice automation platform, or should it move to something else?
4. Get Xero reconciliation current before building automated reporting
5. Deploy send-invoice workflow OR decide it is not needed
6. Clean up duplicate files — establish canonical locations

**Xero API rate limits:**
- 60 calls per minute per OAuth app
- 5,000 calls per day
- Minute limit resets every 60 seconds
- The forensics script hit rate limits repeatedly (needed 60s waits)

**Xero OAuth token lifecycle:**
- Access tokens expire after 30 minutes
- Refresh tokens are SINGLE USE — must save new refresh token after every rotation
- If refresh token is used twice (race condition), the second use fails and the connection is broken
- Recovery requires manual re-authorization via Xero developer portal

---

## Appendix: Xero API Quick Reference

### Authentication
```
POST https://identity.xero.com/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
client_id={XERO_CLIENT_ID}
client_secret={XERO_CLIENT_SECRET}
refresh_token={XERO_REFRESH_TOKEN}
```
Response includes new access_token AND new refresh_token (must save both).

### Common Headers
```
Authorization: Bearer {access_token}
Xero-tenant-id: 72344ba9-f550-453d-86d8-34822817b2bd
Content-Type: application/json
```

### Key Endpoints
| Action | Method | URL |
|--------|--------|-----|
| P&L Report | GET | /api.xro/2.0/Reports/ProfitAndLoss?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD |
| Balance Sheet | GET | /api.xro/2.0/Reports/BalanceSheet |
| List Invoices | GET | /api.xro/2.0/Invoices?order=Date%20DESC&page=1 |
| Create Invoice | POST | /api.xro/2.0/Invoices |
| Authorise Invoice | POST | /api.xro/2.0/Invoices/{ID} (body: Status=AUTHORISED) |
| Get Payment URL | GET | /api.xro/2.0/Invoices/{ID}/OnlineInvoice |
| Email Invoice | POST | /api.xro/2.0/Invoices/{ID}/Email |
| Search Contacts | GET | /api.xro/2.0/Contacts?where=Name=="{name}" |
| Create Contact | POST | /api.xro/2.0/Contacts |
| Bank Transactions | GET | /api.xro/2.0/BankTransactions?order=Date%20DESC&page=1 |
| Invoice History | GET | /api.xro/2.0/Invoices/{ID}/History |

### iCorrect Invoice Defaults
- Type: ACCINV (Accounts Receivable)
- LineAmountTypes: Inclusive
- AccountCode: 201
- TaxType: OUTPUT2 (20% VAT)
- CurrencyCode: GBP
- Status: DRAFT (created), AUTHORISED (sent)

# Financial Mapping

Status: evidence-backed, current-state ownership clarified; target-state reconciliation design still open

## Core Accounting Model

- `Observed`: the live Xero tenant is `Panrix Ltd`.
- `Observed`: Xero organisation settings show:
  - `SalesTaxBasis = CASH`
  - `SalesTaxPeriod = QUARTERLY`
  - base currency `GBP`
- `Observed`: this matches operator confirmation that the business uses cash accounting rather than accrual.
- `Observed`: operator confirmation on `2026-04-02` says the business is currently blind on payment status across Monday, Stripe, SumUp, and Xero because no working reconciliation loop exists.

Primary evidence:
- `/home/ricky/data/exports/system-audit-2026-03-31/xero/organisation.json`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

## Finance Systems In Scope

- `Observed`: Shopify is the ecommerce order and prepaid checkout surface.
- `Observed`: Stripe is a live online / invoice-capable payment rail.
- `Observed`: SumUp is a live in-store card rail candidate and the best-supported walk-in card rail in local finance docs.
- `Observed`: Xero is a live accounting ledger with current receivables, payables, payments, bank transactions, and reporting.
- `Observed`: Monday holds operational payment fields and invoice-related state used by operations.
- `Observed`: local finance docs state Xero reconciliation remained ongoing, with bank statements treated as more reliable for decision-making while cleanup continued.

Supporting evidence:
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/shopify.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/stripe.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/sumup.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

## Confirmed Ledger Structure In Xero

- `Observed`: Xero chart of accounts contains `135` accounts.
- `Observed`: bank / finance accounts visible include:
  - `Cash Account`
  - `Starling Business Account`
  - `Starling Business Account#001`
  - `Stripe GBP`
  - `Stripe GBP 1`
  - `Pleo account`
- `Observed`: live Xero also contains channel-specific revenue and fee accounts including:
  - revenue: `SumUp`, `Stripe`, `Shopify`, `Backmarket`
  - costs / fees: `Backmarket - TradeIns`, `Payment Fees - SumUp`, `Payment Fees - Stripe`, `Stripe Fees`
- `Observed`: the live Xero bank-account structure is mixed by channel:
  - `Stripe GBP` and `Stripe GBP 1` are `BANK` accounts with Stripe-style account identifiers in `BankAccountNumber`
  - `Starling Business Account` and `Starling Business Account#001` are active GBP bank accounts
  - no dedicated `SumUp` bank account was observed in the sampled chart of accounts
- `Observed`: April 2026 P&L includes separate revenue accounts for:
  - `Backmarket`
  - `Shopify`
- `Observed`: current balance sheet includes:
  - `Accounts Receivable`
  - cash balances
  - bank balances
  - Stripe balances

Primary evidence:
- `/home/ricky/data/exports/system-audit-2026-03-31/xero/accounts.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/xero/report-profit-and-loss.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/xero/report-balance-sheet.json`

## Channel-Level Financial Mapping

### Shopify / Online Store

- `Observed`: Shopify-origin jobs enter Monday with:
  - `payment_status = Confirmed`
  - `payment_method = Shopify`
  - `dup__of_quote_total` populated
- `User-confirmed`: checkout is using the Shopify payment gateway path, including Stripe-backed processing.
- `Observed`: Xero live reporting already has a `Shopify` revenue account.
- `Observed`: Xero chart of accounts also includes dedicated `Stripe` and `Shopify` revenue accounts plus Stripe bank/fee accounts.
- `Observed`: archived finance knowledge notes `Shopify cash in Xero from W/C 19 Jan`, which is directionally consistent with the live April 2026 `Shopify` revenue account.
- `Inferred`: ecommerce cash collection is happening before or at Monday ingress for this path, while Xero acts as the downstream accounting ledger rather than the operational source of truth. The dedicated Stripe bank accounts in Xero suggest Stripe settlements are represented directly inside the ledger, even though the exact runtime owner is still unclear.

Key evidence:
- `/home/ricky/builds/system-audit-2026-03-31/client_journeys/shopify-online-purchase.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/shopify.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/stripe.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

### Walk-In / In-Store

- `Observed`: Monday operational docs and journey mapping track payment status and payment method on the repair item.
- `Observed`: local finance/data docs position SumUp as the walk-in card rail.
- `Observed`: status-notification copy says card and cash can be taken in person.
- `Observed`: Xero contains a live `Cash Account`, which is consistent with cash-basis, in-person handling.
- `Observed`: archived finance KPI knowledge tracks `SumUp` as a distinct weekly revenue channel in Xero-facing reporting.
- `Observed`: live Xero also contains a dedicated `SumUp` revenue account and `Payment Fees - SumUp` account.
- `Observed`: current `2025+` authorised Xero bank-transaction sample includes `5` `RECEIVE` rows with `SumUp` as contact, all landing in `Starling Business Account#001`.
- `Inferred`: walk-in financial capture likely starts in SumUp or cash collection, then lands in Xero through reconciliation or bank/cash handling rather than through Shopify-style prepaid ingress. In current live evidence, SumUp appears as revenue/fee accounting plus Starling receives, not as a dedicated Xero bank account.

Key evidence:
- `/home/ricky/builds/system-audit-2026-03-31/client_journeys/walk-in-customer.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/sumup.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

### Mail-In / Remote Repair

- `Observed`: Shopify-origin mail-in jobs enter Monday as prepaid ecommerce orders with `payment_method = Shopify`.
- `Observed`: local Monday/Xero docs also support a later invoice path by setting:
  - `Payment Method = Invoiced - Xero`
  - `Payment Status = Pending`
- `Observed`: active Xero automation creates draft invoices from Monday items.
- `Observed`: send-invoice and payment-received write-back workflows are still documented as undeployed.
- `Observed`: the archived drafts for those workflows are not deployment-ready because they still contain placeholder Xero credential IDs and, in the payment-received case, depend on a `Monday ID:` reference pattern that the active invoice creator does not emit.
- `Inferred`: remote repair jobs split between prepaid ecommerce handling and later invoice-led collection, with the latter still operationally incomplete in the automation layer.

Key evidence:
- `/home/ricky/builds/system-audit-2026-03-31/client_journeys/mail-in-send-in-customer.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

### Corporate / B2B

- `Observed`: corporate enquiries flow through website -> n8n -> Intercom company/ticket handling -> Monday routing.
- `Observed`: Xero current-period receivables include business contacts such as `VCCP GROUP LLP`.
- `Observed`: live balance sheet shows `Accounts Receivable = 21821.80`.
- `Observed`: the Xero automation stack is stronger on draft creation than on collections/write-back.
- `Inferred`: corporate work is the clearest place where receivables and invoice-state ownership matter operationally, because outstanding B2B balances are visibly present in Xero while Monday closure remains partially manual.

Key evidence:
- `/home/ricky/builds/system-audit-2026-03-31/client_journeys/corporate-b2b-client.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

### Back Market

- `Observed`: April 2026 Xero P&L has a distinct `Backmarket` revenue account.
- `Observed`: Xero chart of accounts also includes `Backmarket - TradeIns` under direct costs.
- `Observed`: Back Market trade-in, refurb, listing, sale, and shipping operations are heavily managed through Monday, VPS services, and BM scripts.
- `Observed`: current `2025+` authorised Xero bank-transaction sample includes `2` `RECEIVE` rows with `BackMarket` as contact, all landing in `Starling Business Account#001`.
- `Inferred`: BM revenue is visible in Xero at ledger/reporting and bank-transaction level, but the exact ingestion path from BM operations into Xero has not yet been fully proven from live integration evidence.

Key evidence:
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/backmarket.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

## Confirmed Monday -> Xero Automation

- `Observed`: active n8n workflow `Xero Invoice Creator` receives a Monday-triggered webhook on path `xero-invoice-create`.
- `Observed`: the proven live Monday trigger is automation `537692848`:
  - `When Invoice Action changes to Create Invoice, send a webhook`
- `Observed`: current Monday board evidence shows `Invoice Action` as a `Create Invoice` trigger surface, but no separate live `Send Invoice` board action has been found.
- `Observed`: live Monday schema labels currently include:
  - `Payment Status`: `Corporate - Pay Later`, `Confirmed`, `Unsuccessful`, `Pending`, `Warranty`, `No Payment`, `Pay In Store - Pending`
  - `Payment Method`: includes `Invoiced - Xero`
  - `Invoice Status`: `Draft`, `Sent`, `Paid`, `Overdue`, `Error`, `Voided`
- `Observed`: the workflow:
  - refreshes the Xero token
  - reads Monday item data
  - validates invoiceability
  - searches or creates a Xero contact
  - creates a draft invoice
  - writes Xero invoice ID and URL back to Monday
- `Observed`: documented pricing rule:
  - `invoice_total = formula74 - dup__of_quote_total - numeric_mkxx7j1t`
- `Observed`: non-invoiceable types include:
  - `Corporate Warranty`
  - `BM`
  - `Refurb`
- `Observed`: the active exported workflow currently carries embedded auth material and its own refresh-token state rather than using a clean shared secret abstraction.
- `Observed`: Monday automation audit also documents the intended operational state change before Xero settlement:
  - `Invoiced` sets `Payment Method = Invoiced - Xero`
  - `Payment Status = Pending`
  - item is moved back to customer-service follow-up handling

Key evidence:
- `/home/ricky/builds/xero-invoice-automation/BRIEF.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/9jD6J2X3yCPk8Rjp.json`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`

## What Is Live In Xero Today

- `Observed`: current-period `ACCREC` invoices from `2025-01-01` onward include:
  - `41` `AUTHORISED`
  - `6` `DRAFT`
  - `24` `PAID`
  - `23` `VOIDED`
  - `6` `DELETED`
- `Observed`: current-period `ACCPAY` sample includes `73` invoices, mostly `PAID`
- `Observed`: current-period payments are present and tied to invoice numbers
- `Observed`: current-period authorised bank transactions are present
- `Observed`: current `2025+` authorised bank-transaction sample is strongly bank-centric:
  - `20` `RECEIVE` rows totalling `11978.93`
  - all `20` land in `Starling Business Account#001`
  - top receive-side contacts are `Stripe` (`7`), `SumUp` (`5`), `BackMarket` (`2`), `Apple Self Serve` (`2`), and `Royal Mail` (`2`)
- `Observed`: April 2026 reporting is available live from Xero

Interpretation:
- `Observed`: Xero is not dormant.
- `Observed`: Xero is not just a future automation target.
- `Observed`: local finance docs still warn that reconciliation lag exists and bank statements may be more reliable than Xero for near-term operating decisions.
- `Inferred`: Xero is already the live accounting system of record for reporting and ledger state, with strong bank-transaction visibility for Stripe, SumUp, and BackMarket, but not yet the uncontested real-time source of truth for cash movement or payment-state closure.

## Main Gaps

- `Observed`: no live-verified payment-received webhook or write-back from Xero into Monday has been found.
- `Observed`: the only concrete Stripe/SumUp reconciliation implementation found is archived, not live.
- `Observed`: the active Xero invoice workflow currently has control-plane debt because credentials and refresh-token state are embedded inside the workflow export.
- `Observed`: the drafted send-invoice and payment-received workflows are still not deployment-ready in their current form.
- `Observed`: the current operations-workspace `xero-send-invoice.json` still uses placeholder Xero credential IDs and placeholder Slack channel IDs, which confirms that stage-two invoice sending remains a spec/draft path rather than a proven live board control.
- `Observed`: the current operations-workspace `xero-payment-received.json` is also incompatible with current evidence:
  - it expects `Monday ID:` inside Xero invoice references
  - live `2025+` sampled receivable invoices contain `0` `Monday ID:` references
  - it tries to write `payment_status = Paid` and `payment_method = Online (Xero)`, while the live Monday schema exposes `Invoice Status = Paid` and `Payment Method = Invoiced - Xero` instead
- `Observed`: finance docs mention custom CSV processing scripts for Stripe-to-Xero import, but no current owned runtime for that import path has yet been verified.
- `Observed`: the current operations finance knowledge base still references `docs/payment_reconciliation.py`, `docs/xero_vat_forensics.py`, `docs/xero_vat_forensics_v2.py`, `docs/xero_refresh_token.txt`, and `docs/xero_vat_forensics_results.json`, but those files do not exist in the live operations workspace and were found only in the archived finance orphan tree.
- `Observed`: current operations workspace contains Xero cleanup outputs such as `xero_invoice_crossref.csv` and `xero_invoice_cleanup.csv`, which indicate manual/analyst cleanup activity rather than an automated live reconciliation service.
- `Observed`: current operations docs explicitly describe a ghost-invoice backlog of `343` invoices and approximately `£91k` of fake debt while reconciliation remains unresolved.
- `Observed`: `xero_invoice_crossref.csv` currently contains `343` rows:
  - `265` `SAFE TO VOID - payment matched`
  - `78` `REVIEW NEEDED - no payment found`
- `Observed`: `xero_invoice_cleanup.csv` currently contains `450` rows:
  - `343` `VOID - Likely paid/ghost`
  - `107` `KEEP - Corporate`
- `Observed`: Monday appears to have a front-half invoice-state handoff (`Invoiced -> Pending / Invoiced - Xero`) without a proven back-half automated closure from Xero payment receipt back to Monday.
- `Unknown`: whether Stripe and SumUp reach Xero through direct feed, manual import, bank rule, or mixed handling.
- `Inferred`: Stripe likely has a more direct Xero ledger presence than SumUp because dedicated `Stripe GBP` bank accounts exist in Xero, while SumUp appears in revenue/fee accounts and Starling receive-side bank transactions.
- `Unknown`: whether Back Market revenue reaches Xero via direct integration, manual posting, bank feed, or accountant process.
- `Observed`: operator confirmation says Monday payment fields are unreliable, no reconciliation loop exists, and no one currently owns payment-received write-back into Monday.
- `Observed`: operator confirmation says the intended target state is simple: when payment is taken on any rail, it should reconcile back to Monday automatically.
- `Observed`: operator confirmation says the archived reconciliation logic should be treated as reference-only and explicitly retired rather than restored as the live path.

## Current Best Interpretation

- `Observed`: Xero is the live accounting ledger.
- `Observed`: Monday is the live operational workflow system.
- `Observed`: Shopify, Stripe, and SumUp are live cash-collection rails for different channels.
- `Observed`: the current operational truth is that payment status is broken and ownerless, not merely under-documented.
- `Inferred`: the main unresolved finance problem is no longer platform access; it is target-state design and ownership for reconciliation, ghost-invoice cleanup, payment-state closure, and credential/control hygiene across a finance stack where only the draft-invoice stage is clearly fronted by live Monday controls and the documented back-half workflow specs no longer match live references/labels.

## Target-State Design Reference

- `Observed`: the research answer is no longer “restore the old flow.”
- `Observed`: the target state needs a captured-versus-reconciled model that fits cash accounting and current Monday fields.
- See:
  - `/home/ricky/builds/system-audit-2026-03-31/payment-truth-target-state.md`

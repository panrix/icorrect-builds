# Master Questions For Jarvis

Last updated: 2026-04-02

## Purpose

This is the single handoff file for questions that still need operator / Jarvis clarification.

Please answer inline under each question using:

- `Answer:`
- `Evidence / pointer:`
- `Confidence:`

If a question is unknown, say `Unknown` explicitly.

## Already Provided

- Workstation allocation may actually be represented by the technician's repair group on the iCorrect main board.

This is useful, but I still need the exact implementation details below before I can treat it as resolved.

## Priority 1: Queue / Workstation / Monday Operations

### Q1. What exactly is the workstation-allocation proxy on the main board?

- What is the exact column name and column ID?
- Does one repair group equal one physical workstation, or does it mean something looser like tech/team assignment?
- Has this been used consistently across the audit window, or is it only current-state?
- If there is a mapping, what is it? Example:
  - group/label A -> workstation 1
  - group/label B -> workstation 2

Answer: Each tech group on the main board (Andres, Safan short-term group (there are 2 Safan groups), Mykhailo) represents that tech's repair queue and corresponds to their physical workstation. However, the device being in a tech's group does not mean it is physically on their desk. Devices in other groups represent being at or stuck at a different stage of the cycle.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q2. Is there any other bench or allocation source outside the main board?

- hidden board
- whiteboard
- spreadsheet
- ops-queue sheet
- manual daily plan

Answer: No other bench or allocation source outside the main board. The BM Devices board shows how many BM trade-ins are waiting for repair (in the BM trading group at the top). Roni has a QC queue group and a physical queue, but those items are devices marked as beyond economical repair, not active bench allocation.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q3. What should count as the canonical post-quote decision path?

Current working assumption:
- `Invoiced`
- `Quote Rejected`
- `Queued For Repair` when invoicing is skipped

Please confirm if that is correct and complete.

Answer: The canonical path is: Diagnostic Complete → Quote Sent → Invoiced → Queued For Repair. Key timing gaps to track: (1) Diagnostic Complete → Quote Sent (Ferrari's response time), (2) Quote Sent → client acceptance (currently not tracked cleanly), (3) Invoiced → Queued For Repair. Exceptions: Quote Sent can go directly to Queued For Repair if Invoiced is skipped (but shouldn't be). Quote Sent → Quote Rejected if client declines.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q4. Is there another Monday history/export surface for quote and comms events?

The current activity-log surface is too incomplete for clean quote-decision lag analysis.

Answer: All quotes are sent via email. Since 2026 (last 3 months) this is done through Intercom. Prior to that it was Zendesk. Every invoice sent should have a Xero invoice linked to it, normally matched through the customer name, but there is no proper identifier and no reconciliation loop exists. Intercom conversation timestamps and Xero invoice creation dates are the best available proxy sources for quote/comms timing.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

## Priority 2: Customer Identity / Retention

### Q5. What is the canonical customer identity source?

Which system should be treated as the primary customer identity owner?
- Monday
- Intercom
- Shopify
- Xero
- another system

Answer: Monday. It is the canonical customer identity source and links out to everything else.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q6. What is the intended role of `Link - Client Information Capture`?

The main-board relation exists but is currently unbound in the live schema.

- Was it meant to point to a real board?
- If yes, which board ID/name?
- If no, should it be treated as dead legacy structure?

Answer: Dead legacy. It used to link to a board where Typeform pre-repair questionnaire responses were captured and related to the repair item. Now the pre-repair Typeform responses are added as an update/reply within the repair item itself via n8n automation. The Typeform questions need auditing to ensure they ask the right questions per repair type.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q7. Are the tiny Monday `Contacts` and `Leads` boards real or dead/demo?

Current evidence suggests they are not live operational infrastructure.

Answer: Dead.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

## Priority 3: Finance / Cash Accounting / Reconciliation

### Q8. Under cash accounting, what should operations treat as the canonical "paid" truth?

Choose the intended operational truth source:
- Monday payment fields
- payment rail confirmation
- Xero bank-reconciled state
- a channel-specific split

Answer: Currently broken. Monday payment fields are unreliable (don't always get marked correctly). No reconciliation loop exists between Xero, Stripe, SumUp, and Monday. Shopify orders reconcile correctly (Shopify Payments). Stripe/Xero payment links: payment confirmation doesn't flow back to Monday. Corporate invoices: no write-back to Monday at all when paid. The business is currently blind on payment status. The intended state is: when payment is taken on any rail, it should reconcile back to Monday automatically.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q9. Who owns payment-received write-back into Monday?

Please name the actual owner or intended owner:
- finance
- operations
- Jarvis / automation rebuild
- no owner currently

Answer: Nobody. No current owner.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q10. What should happen to the archived reconciliation logic?

Should it be:
- restored
- replaced
- explicitly retired

Answer: Explicitly retired. It should be reviewed only as reference material while a new reconciliation logic is designed to actually work and be operationally useful.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

## Priority 4: Shipping / Supplier Economics

### Q11. Which shipping costs are absorbed by iCorrect and which are customer-paid?

Please split by path if possible:
- walk-in
- mail-in
- courier
- warranty return
- BM return

Answer: Walk-in has no shipping cost. Mail-in customers are charged a flat £20, effectively £10 each direction, and iCorrect absorbs any shipping cost above that. Courier fees are generally charged to the customer. Warranty returns are fully absorbed by iCorrect. Back Market returns are fully absorbed by iCorrect. Normal Back Market client shipping costs are also absorbed by iCorrect.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q12. Is there a better supplier-data source than the current Monday parts board?

Possible examples:
- purchasing board
- stock sheet
- supplier CRM
- Xero-only
- manual ordering system

Answer: Xero only, but it is not good enough. Purchase invoices in Xero can be extracted to confirm individual costs, but there is no strong live supplier-data system beyond that. Going forward, the parts logic needs rebuilding because ordering, acceptance, wastage logging, and device-to-part requirement tracking are currently non-existent.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q13. Which supplier list should be treated as current truth?

Current docs mention:
- Nancy
- MobileSentrix UK
- CPU Technology
- Laptop Power NW
- The Only Phones

Live Xero spend shows major usage of:
- Mobilesentrix
- Sparlay IT
- Cambridge Accessories
- Amazon
- Ebay

Please clarify which of these are actually active and strategically important now.

Answer: All of them are active, but for different reasons depending on the type of part they service. The supplier set should be treated as a segmented active list rather than assuming a single primary supplier.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

## Priority 5: Marketing / Revenue Attribution

### Q14. What should be treated as the canonical conversion truth right now?

Choose the intended truth source:
- PostHog
- GA4
- Shopify orders only
- blended model

Answer: Blended model, but telephone orders also exist and go directly into Monday.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q15. Is there any owned source for total marketing spend outside Meta?

Examples:
- Google Ads
- SEO agency/tooling
- content spend
- offline/local marketing

Answer: No. Meta is the only owned marketing spend source at the moment.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

## Priority 6: Path / Ownership Clarifications

### Q16. What is the live non-Shopify mail-in entry path?

For customers who do not buy through Shopify first:
- Intercom
- email
- phone
- form
- manual Monday item
- mixed path

Answer: Mixed path. For mail-ins, entry can come via Intercom or email. If it does not originate there, it becomes a manual Monday item, but it should always link back to Intercom. Telephone orders also exist as a direct-to-Monday path.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q17. Does corporate / B2B rely only on `Client = Corporate`, or are there hidden boards, automations, or reports?

Answer: Yes. Corporate / B2B currently relies only on `Client = Corporate`.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q18. Which current growth signals are translating into profitable jobs?

This is partly strategic rather than purely technical. If you already have a working business belief here, state it directly.

Answer: The current growth signal translating into profitable jobs is the new Back Market trade-in model for non-functioning used devices.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

## Lower Priority But Still Useful

### Q19. What fixed competitor comparison basket should be used?

Suggested basket:
- iPhone screen
- iPhone battery
- MacBook screen
- MacBook battery
- liquid damage diagnosis

Answer: Use this fixed basket: MacBook screen, MacBook diagnostic, MacBook no power, iPhone screen, and iPhone battery. For iPhone screen comparisons, note that iCorrect uses original screens. iPhone battery is low profit. The core USP to reflect in comparisons is that iCorrect can complete advanced repairs that most competitors cannot.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed

### Q20. Are there any stale docs or boards I should explicitly stop treating as relevant?

Answer: Most older boards and docs should be treated as stale. The boards still in active use are: Main board (soon to change to the v2 board), Annual leave, Parts, Devices, and Products & prices. Older Monday structures reflect a time when much more business data was stored there and should not be assumed live by default.

Evidence / pointer: Ricky (operator), 2026-04-02

Confidence: Confirmed


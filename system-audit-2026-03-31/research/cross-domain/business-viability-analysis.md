# Business Viability Analysis

Last updated: 2026-04-02

## Question

Why is the business loss-making, what are the main inefficiencies, and is the business structurally broken or still recoverable?

## Short Answer

- `Observed`: the business is not obviously dead.
- `Observed`: there are real growth signals in Shopify traffic, paid orders, and search demand.
- `Observed`: the current losses are more consistent with bad work mix, poor lead capture/conversion, BM pricing drift, slow operational throughput, and capital trapped in unfinished/aged work than with absence of customer demand.
- `Inferred`: the business still has recovery potential, but only if it stops funding low-quality BM volume, improves conversion of inbound demand, and clears operational drag that is turning revenue into delayed or unrealised cash.

## Evidence Base

- `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/business-deep-dive-2026-03.md`
- `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/financial-leak-analysis-2026-03.md`
- `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`
- `/home/ricky/builds/system-audit-2026-03-31/financial-mapping.md`
- `/home/ricky/builds/system-audit-2026-03-31/team-operations-summary.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/shopify-agent-brief-mar-2026.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/bounce-rate-report-mar-2026.md`
- `/home/ricky/.openclaw/agents/marketing/workspace/docs/seo-audit-feb-2026.md`
- live Xero exports in `/home/ricky/data/exports/system-audit-2026-03-31/xero/`

## 1. What The Closed-Month Financials Already Say

- `Observed`: March finance research documents `5` loss-making months out of `6`, totaling roughly `-£19.2k` across the six-month period.
- `Observed`: February 2026 was still loss-making despite revenue of roughly `£53.5k`.
- `Observed`: the three biggest cost buckets were:
  - wages
  - BM trade-ins
  - parts
- `Observed`: those three categories alone consumed about `93%` of revenue over the six-month view used in the financial leak analysis.

### What That Means

- `Inferred`: the business is not failing because of one overhead line.
- `Inferred`: it is failing because too much of its operating effort is tied up in low-quality or delayed gross profit.

## 2. The Biggest Structural Problem: Back Market Work Mix

### BM Has Become Too Large A Share Of Revenue

- `Observed`: BM grew from roughly `45%` of revenue to roughly `62%` of revenue in the six-month review.
- `Observed`: that makes the business increasingly dependent on the channel with the worst current margin pressure.

### BM Acquisition Cost Has Drifted Too High

- `Observed`: BM trade-in cost ratio rose from roughly `32-42%` of BM revenue to `66.4%` in February 2026.
- `Observed`: the financial leak analysis concludes that fixing BM trade-in pricing alone would likely have turned February profitable.

### BM Is Not Uniformly Bad

- `Observed`: BM profitability findings show:
  - `NONFUNC_USED` is strong
  - `NONFUNC_CRACK` is materially better than old flat assumptions suggested
  - `FUNC_CRACK` is the weakest large-volume grade
- `Observed`: FC is high volume but low contribution.
- `Observed`: NFU is the strongest grade economically and is where the business moat is sharpest.
- `Observed`: operator confirmation on `2026-04-02` says the current growth signal most clearly translating into profitable jobs is the new Back Market trade-in model for non-functioning used devices.

### Real Diagnosis

- `Inferred`: the problem is not “Back Market exists.”
- `Inferred`: the problem is “too much capital and workshop time are going into the wrong BM inventory at the wrong buy price.”
- `Inferred`: BM is currently behaving more like a cash sink than a controlled profit engine.

## 3. The Biggest Hidden Revenue Leak: Communication Failure

- `Observed`: Ferrari audit found around `80` contact-form leads per period with only about `30%` getting a human reply.
- `Observed`: roster/team docs state Ferrari average response time is `45.3h`.
- `Observed`: financial analysis attributes roughly `£150k/year` of missed revenue to unanswered communications.
- `Observed`: Ferrari’s revenue-generating work is a minority of his measured workload; mornings are fragmented by BM/logistics/admin context switching.

### Real Diagnosis

- `Inferred`: the business is not just losing margin on the supply side.
- `Inferred`: it is also failing to convert demand that already exists.
- `Inferred`: this is one of the rare levers that can improve revenue without increasing cost.

## 4. Growth Signals Exist

### Shopify / Website Demand

- `Observed`: marketing docs confirm Shopify/PostHog session stitching was fixed on 2026-03-11.
- `Observed`: a live Shopify Admin pull for `2026-03-01` through `2026-04-01` found:
  - `64` orders
  - `£13,686.00` gross revenue
  - `58` `paid`
  - `5` `refunded`
  - `1` `partially_refunded`
  - `64/64` using `shopify_payments`
- `Observed`: the marketing workspace also records real conversion around `0.78%` after the March tracking fix.
- `Observed`: earlier GA4/marketing analysis cited around `6,880` sessions/month.

### Organic Search Demand

- `Observed`: SEO docs show meaningful search demand already exists for MacBook, iPhone, and iPad repair terms.
- `Observed`: the site is still leaking traffic because:
  - homepage cannibalises service pages
  - staging got indexed
  - `www` and non-`www` authority were split
  - hundreds of sessions/month were hitting broken URLs
  - contact page and other high-intent surfaces have UX issues

### Real Diagnosis

- `Inferred`: demand is not zero.
- `Inferred`: marketing is not the main reason the business is loss-making.
- `Inferred`: the growth problem is more “conversion and capture quality” than “nobody wants the service.”
- `Observed`: operator confirmation says telephone orders also exist as a direct-to-Monday path, so web-only conversion views undercount total demand capture.
- `Observed`: a fresh full-board Monday source pull on `2026-04-02` shows the current `Source` field is effectively unusable for operational attribution:
  - `4,319 / 4,459` total items blank
  - `1,546 / 1,677` paid non-BM items blank
  - `0` phone-labelled items despite confirmed phone/direct orders
- `Inferred`: some of the business's growth and conversion picture is hidden not because demand is absent, but because the operational attribution field is barely populated.

## 4A. Public Market Position Does Not Look Fundamentally Broken

- `Observed`: competitor benchmarking shows iCorrect’s public entry prices are broadly in-market:
  - iCorrect: iPhone from `£39`, MacBook from `£49`
  - iSmash: iPhone screen repairs from `£35` and MacBook batteries from `£79.99`
  - TommyTech: iPhone screens from `£25-40` on older models and up to `£200` on newer ones
  - premium Mac specialists like I Repair Macs and Mac Repair London use higher-price diagnosis-led models
- `Observed`: same-day or near-same-day repair promises are common across competitors, so turnaround is table stakes.
- `Inferred`: the business is not obviously losing because the headline public price list is wildly out of line with the London market.
- `Inferred`: the problem still points back to conversion quality, operating drag, and margin control rather than simple retail mispricing.

## 5. Output And Throughput Are Too Weak Relative To Spend

### Workshop Productivity Is Mixed, Not Uniformly Bad

- `Observed`: Safan appears to be the highest-value technical operator and the only board-level specialist.
- `Observed`: team/operations research says he is running below theoretical capacity, not because he is slow, but because queue mix and upstream/downstream constraints limit him.
- `Observed`: Mykhailo contributes real revenue but has reliability, lateness, and return-quality concerns.
- `Observed`: Roni is overloaded across QC, parts, and BM diagnostics.

### Aged WIP And Stuck Inventory Are Severe

- `Observed`: the March business deep dive reports:
  - `97` devices in the Hole with average age `454` days
  - `200` leads to chase with average age `984` days
  - `22` items awaiting parts with average `61` days wait
- `Observed`: buyback-monitor analysis also shows large numbers of profitable BM devices stuck in the pipeline, with cash tied up and profit unrealised.
- `Observed`: a live Monday board pull on `2026-04-01` found `900` non-terminal items still open on the main board, including:
  - `232` in `Booking Confirmed` with median open age `835.5 days`
  - `127` in `Awaiting Confirmation` with median open age `810 days`
  - `120` in `Client Contacted` with median open age `317.5 days`
  - `39` in `Repair Paused` with median open age `79 days`
  - `22` in `Quote Sent` with median open age `239.5 days`
  - `22` in `Awaiting Part` with median open age `59.5 days`
- `Observed`: the same live pull found `322` open items in blocked or customer-wait style states and `75` open items with `Diag. Complete` set but no `Quote Sent` date.
- `Observed`: age-bucket split on the open queue shows `440` of the `900` non-terminal items are older than `366` days, while only `158` are `0-30` days old.

### Real Diagnosis

- `Inferred`: the business is not just margin-poor; it is slow at turning work and stock into completed, collected, and banked cash.
- `Inferred`: this is a working-capital and operations-discipline problem as much as a pricing problem.
- `Inferred`: Monday queue hygiene is poor enough that old unresolved records are now obscuring the real live queue, which makes follow-up, prioritisation, and workload reading materially worse.
- `Inferred`: the team is not just fighting live workload; it is carrying a large operational-debt layer inside the same board, which makes the organisation look busier and more blocked than the real current queue alone would suggest.

## 6. Returns, Rework, And Post-Sale Leakage Matter

- `Observed`: BM returns analysis says `47` returns over five months with direct cost around `£3,869`.
- `Observed`: returns are concentrated enough to suggest process failure, not random noise.
- `Observed`: top repeat causes include preventable boot/QC issues.
- `Observed`: there is no strong repeat-return flag or robust automated aftercare/return control loop.

### Real Diagnosis

- `Inferred`: margin is leaking twice:
  - at intake via overpaying for devices
  - at dispatch/post-sale via preventable returns and weak QC enforcement

## 6A. Logistics And Parts Spend Add Real Drag

- `Observed`: identified logistics spend from Xero since `2025-10-01` is `£12,314.35`, mainly Royal Mail `£10,305.21`.
- `Observed`: visible remote-service paid value on the Monday main board is `£99,517.67`, so identified logistics cost is roughly `12.4%` of that visible remote paid surface.
- `Observed`: visible parts/procurement spend across major suppliers and marketplaces in the same Xero window is at least `£31,821.48`.
- `Inferred`: remote work and parts-heavy repairs are carrying meaningful cost drag even before labour, rework, and collection delay are considered.

## 7. Finance Control Is Weak Enough To Hide The Truth

- `Observed`: Xero is live and current.
- `Observed`: Monday -> Xero is clearly live only at the draft-invoice stage.
- `Observed`: payment-received closure and repair-payment reconciliation remain partially manual or archive-only.
- `Observed`: operations finance docs describe `343` ghost invoices and about `£91k` of fake debt distortion.
- `Observed`: `78` invoice rows are still in `REVIEW NEEDED - no payment found`.

### Real Diagnosis

- `Inferred`: some of the business pain is operationally real, but some of it is also obscured by poor finance-state hygiene.
- `Inferred`: the current system makes it harder than it should be to answer simple questions like:
  - what is actually paid
  - what is overdue
  - what channel is profitable after all real costs

## 8. Is The Business Dead?

### Evidence Against “Dead”

- `Observed`: the business has recent paid Shopify orders and live online demand, including `64` March 2026 Shopify orders worth `£13,686.00` gross.
- `Observed`: Xero has live receivables, payments, bank transactions, and current reporting.
- `Observed`: BM still generates revenue, and parts of the BM model are genuinely profitable when grade/pricing discipline is correct.
- `Observed`: the workshop still has high-skill technical capability, especially through Safan.
- `Observed`: corporate invoicing and receivables are still active enough to matter.
- `Observed`: public market benchmarking does not show iCorrect priced out of the London repair market.

### Evidence For “At Risk”

- `Observed`: repeated closed-month losses.
- `Observed`: gross margin fragility.
- `Observed`: communication failure on inbound demand.
- `Observed`: trapped cash in aged WIP and stuck inventory.
- `Observed`: return/rework leakage.
- `Observed`: poor finance reconciliation and weak operational closure loops.
- `Observed`: identified repeat-customer rate on the Monday repair history is only about `8.1%`, so the business still depends heavily on new demand rather than a strong retention engine.

### Current Best Call

- `Inferred`: the business is not dead.
- `Inferred`: it is under-managed at the margin, conversion, and throughput layers.
- `Inferred`: if current patterns continue unchanged, the business remains at high risk of continued monthly losses.
- `Inferred`: if the top leaks are addressed, the business still has room to recover because demand, technical capability, and some profitable channel segments are all still present.

## 9. What The Business Is Fundamentally Doing Wrong

### 1. Letting The Wrong Work Dominate

- too much BM revenue share
- too much FC / weak-margin inventory
- not enough discipline on intake pricing vs expected profit

### 2. Failing To Convert Existing Demand

- slow human response
- too much Ferrari attention diverted into non-revenue work
- site UX/SEO issues leaking high-intent visitors

### 3. Allowing Work To Age Instead Of Flow

- long queue dwell
- parts waits
- aged “Hole” items
- stuck BM inventory
- stale lead backlog
- a polluted non-terminal Monday queue that mixes true WIP with ancient unresolved records

### 4. Using High-Skill Labour On Lower-Value Work

- board-level capability is scarce
- scarce technical capacity is not always reserved for the highest-margin tasks

### 5. Weak Control Systems

- finance closure loops incomplete
- payment reconciliation not owned
- ghost invoices distort reality
- operational ownership across customer service, intake, QC, and finance is too fragmented

## 10. Highest-Value Levers

These are the highest-confidence business levers from current evidence.

### Revenue / Demand

- improve human reply speed and coverage on inbound leads
- protect Ferrari time from low-value fragmentation
- repair high-intent website/contact/SEO leaks
- tighten channel response standards, especially for Instagram and WhatsApp, where the current sample still shows weak or absent human reply coverage
- bias growth effort toward channels and job types already showing profitable signal, especially NFU-style BM trade-ins, rather than assuming all revenue growth is equally good

### Margin

- cap BM trade-in pricing against minimum target profit
- reduce or delist structurally weak FC SKUs
- bias harder toward strong NFU/NFC economics

### Throughput

- clear profitable stuck BM inventory before buying more
- tighten parts and queue management
- reduce aged work-in-progress and unresolved leads
- archive, close, or separate stale non-terminal Monday items so the live queue can be read and owned properly
- add workstation-level allocation tracking only after queue debt is cleaned up, because current evidence does not support physical bench count as the primary constraint

### Quality

- enforce pre-dispatch QC and repeat-return handling
- reduce preventable BM returns

### Finance Clarity

- finish reconciliation ownership
- close the Xero back-half loop
- remove ghost-invoice distortion from decision-making

## 11. Remaining Research Needed

This analysis is strong, but not final.

### Still Needed

- active-vs-stale split on the `900` open Monday items so current WIP is not confused with historical queue debt
- quote-approval/payment lag after `Quote Sent`
- computed active-work versus paused/customer-wait durations from Monday activity data
- clearer mapping of which current marketing sessions become quotes, bookings, and paid jobs
- a more exact channel-level contribution model that includes:
  - acquisition cost
  - labour time
  - parts
  - shipping
  - return/rework burden

## Conclusion

- `Observed`: the business has real revenue, real demand, and real technical capability.
- `Observed`: it is currently being dragged down by avoidable inefficiencies and bad allocation decisions, not by total lack of market.
- `Observed`: live timing evidence now suggests broad quote turnaround is better than expected, so the bigger hidden operational issue is stale backlog ownership and the failure to close, archive, or escalate exception cases.
- `Inferred`: the biggest thing the business may be “not seeing” is that it has a demand-conversion problem, a work-mix problem, and a queue-discipline problem at the same time. Fixing only one will not be enough.
- `Inferred`: the path to recovery is likely:
  - capture and convert more of existing demand
  - stop overfunding weak BM volume
  - turn stuck work into cash faster
  - make finance state trustworthy enough to manage by facts

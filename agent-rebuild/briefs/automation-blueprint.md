# Automation, Scripts & Agent Blueprint

Date: 2026-04-04  
Scope: business-wide automation blueprint for iCorrect across operations, team, revenue, finance, customer service, marketing, and parts  
Method: research + synthesis only; no production files modified

---

## 1. Executive Summary

### Core thesis

iCorrect should be rebuilt around a simple rule:

> **Deterministic work becomes scripts. Judgement, writing, and synthesis stay with agents.**

Today, too much token cost is being spent on agents acting as script runners. The strongest version of the future system is:

1. **Source-of-truth layer**
   - Monday, Xero, Shopify, Intercom, Back Market, Search Console, PostHog, Supabase
2. **Deterministic automation layer**
   - cron jobs
   - webhook services
   - lookup/trigger bot commands
   - reporting scripts
3. **Agent layer**
   - triage
   - drafting
   - analysis
   - anomaly interpretation
   - recommendations
4. **Human approval layer**
   - pricing decisions
   - customer-sensitive replies
   - irreversible financial actions
   - operational policy changes

### Estimated totals

These are the recommended *target estate* counts after rationalisation, not the number of brand-new things from zero.

- **Total scripts / services needed:** ~58
- **Total cron jobs needed:** ~29
- **Total Slack/Telegram commands needed:** ~37
- **Agents that should survive as real LLM agents:** 8 primary agents + 2 specialist/support roles

### Which agents survive

#### Keep as true agents
- **Jarvis (main)** — coordination, synthesis, escalation, planning
- **Alex** — customer-service drafting, quote writing, case judgement
- **Marketing Jarvis** — growth strategy, SEO/content/ad analysis, brief writing
- **Systems** — diagnostics, incident interpretation, infrastructure reasoning
- **Operations** — process analysis, bottleneck interpretation, SOP improvement
- **Team** — people analysis, hiring judgement, coaching recommendations
- **Parts** — supplier strategy, demand/risk interpretation
- **BackMarket / Hugo** — pricing strategy, edge-case profitability judgement, channel decisions
- **Diagnostics / Elek** — technical fault reasoning
- **Build agents (Codex Builder / Reviewer / Orchestrator)** — implementation workflow, not business ops

#### De-emphasise or retire as day-to-day operators
- **customer-service** as a separate live operator layer — fold practical day-to-day work into Alex unless a management/oversight layer is explicitly needed
- **website** as a standalone agent — either fold into Marketing + scripts, or keep only if Shopify workload becomes consistently strategic
- **slack-jarvis / pm / dormant agents** — not needed as core business-operating brains

### Estimated build priority order

#### P1 — build first
1. Operations queue/intake/aging scripts
2. Customer-service metrics + inbox triage support surfaces
3. Finance reconciliation + captured-vs-paid truth
4. Parts stock / reorder / usage automation
5. BackMarket deterministic SOP estate rationalisation

#### P2 — next
6. Marketing data pulls + fixed intelligence cron layer
7. Team KPI / capacity / attendance reporting
8. Unified command layer for Telegram/Slack lookups

#### P3 — later
9. Forecasting / predictive layers
10. Deeper agent-led recommendation loops
11. More advanced optimisation / anomaly scoring

### Strategic conclusion

The right architecture is **not** “replace all agents with scripts.”  
It is:

- replace all **lookups, polling, reconciliation, syncing, and status checks** with scripts
- keep agents for **writing, reasoning, prioritisation, and strategy**

That gives iCorrect:
- lower token spend
- faster responses
- fewer hallucinations
- cleaner operational ownership
- a system that can scale without Ricky manually routing everything

---

## 2. Per-Domain Blueprint

---

## A. OPERATIONS (Workshop Floor)

### Domain view

Operations is the highest-leverage domain after customer-service and finance truth. The business problems already documented are:
- intake inconsistency
- queue chaos
- no intelligent assignment
- stale board debt hiding real work
- weak aging / bottleneck visibility

This domain should be **script-heavy**, with the agent used for interpretation and process improvement.

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | Intake form processor | Normalize intake submissions into Monday/Supabase, validate required fields, create/attach job record | form submit / webhook | Intake system, Monday, Supabase | P1 | PARTIAL |
| 2 | Script | Intake completeness validator | Flag missing serial, issue description, passcode, customer contact, turnaround promise | on item create/update | Monday | P1 | NO |
| 3 | Script | Queue status builder | Build live queue by stage, assignee, age, promised date, and parts status | on demand / scheduled | Monday | P1 | NO |
| 4 | Script | Aging item detector | Detect items stuck beyond SLA by status | hourly + on demand | Monday | P1 | NO |
| 5 | Script | Bottleneck detector | Surface cluster points: waiting for parts, waiting for approval, QC blocked, diag pileups | every 2h | Monday | P1 | NO |
| 6 | Script | Technician capacity snapshot | Show active WIP per tech, completions, stalled items, available slots | on demand + morning | Monday | P1 | NO |
| 7 | Script | Workstation allocation tracker | Pair jobs with workstation/bench capacity for daily planning | morning + on demand | Monday, workshop rules | P2 | NO |
| 8 | Script | Zombie queue triage | Separate stale historical debt from live WIP and produce archive candidates | daily | Monday | P1 | PARTIAL |
| 9 | Script | QC checklist validator | Ensure QC-required items have all required checkpoints before status move | on status change | Monday, SOP rules | P1 | NO |
| 10 | Script | Today board / daily ops summary | Push daily operational summary to Telegram/Slack | 06:30 UTC weekdays | Monday, Supabase | P1 | NO |
| 11 | Script | Intake-to-diagnostic lag tracker | Measure time from intake to diagnosis and flag slow intake handoff | daily | Monday | P2 | NO |
| 12 | Script | Approval wait tracker | Detect devices waiting too long for customer approval | hourly | Monday, Intercom if linked | P1 | NO |
| 13 | Cron | Daily queue summary | Morning snapshot of live queue, aging, blockers | weekday 06:30 UTC | Monday | P1 | NO |
| 14 | Cron | Aging alert run | Alert on items breaching thresholds | hourly weekdays | Monday | P1 | NO |
| 15 | Cron | Bottleneck report | Midday + end-of-day operational bottleneck summary | 11:00 / 17:00 UTC | Monday | P2 | NO |
| 16 | Cron | Zombie archive candidate sweep | Build archive list of stale non-terminal items | daily | Monday | P1 | PARTIAL |
| 17 | Command | `/queue` | Live queue by stage / team member | manual | Monday | P1 | NO |
| 18 | Command | `/status <item>` | Current item stage, owner, age, blockers | manual | Monday | P1 | NO |
| 19 | Command | `/aging` | List oldest live jobs by status | manual | Monday | P1 | NO |
| 20 | Command | `/bench <name>` | View tech capacity / active WIP | manual | Monday | P2 | NO |
| 21 | Command | `/ops-summary` | Same-day operations summary | manual | Monday, Supabase | P2 | NO |
| 22 | Agent task | Bottleneck analysis | Explain why flow is slowing and what to change | ad hoc | outputs from ops scripts + Monday context | P1 | YES |
| 23 | Agent task | SOP improvement recommendations | Translate recurring errors into process changes | weekly / ad hoc | script outputs, docs, team notes | P2 | YES |
| 24 | Agent task | Queue policy design | Recommend prioritisation logic changes | ad hoc | queue data, business goals | P2 | YES |

### Operations data sources
- Monday main board
- intake-system frontend / webhook outputs
- Supabase shadow operational tables
- Intercom (for customer approval dependency if linked)
- optional staff/bench capacity mapping

### Operations conclusion
Operations should become mostly:
- **scripts for visibility and enforcement**
- **agent for interpretation and redesign**

---

## B. TEAM (People Management)

### Domain view

Team work splits cleanly into:
- deterministic KPI and capacity reporting
- judgement-heavy coaching, hiring, and performance interpretation

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | Weekly completions pull | Pull completions by technician / role / category | weekly | Monday | P1 | PARTIAL |
| 2 | Script | Attendance / activity snapshot | Estimate attendance / active touchpoints / gaps | daily | Monday activity logs, optional attendance source | P2 | PARTIAL |
| 3 | Script | KPI dashboard builder | Build standard KPI card per person (completed, paid value, aging, rework proxies) | daily / weekly | Monday, Supabase | P1 | NO |
| 4 | Script | Capacity planning calculator | Calculate team capacity vs queue size / incoming volume | daily | Monday, throughput assumptions | P1 | NO |
| 5 | Script | Hiring trigger calculator | Flag when queue / capacity data justify an additional hire | weekly | Monday, KPI/queue data | P2 | NO |
| 6 | Script | Rework / QC proxy tracker | Estimate avoidable rework or QC drag by technician | weekly | Monday status history / activity logs | P2 | NO |
| 7 | Script | Role coverage map | Show single points of failure (e.g. Roni dependency) | weekly | Monday, staffing config | P2 | NO |
| 8 | Cron | Weekly performance summary | Push weekly team KPI summary | Sunday night / Monday morning | Monday, Supabase | P1 | NO |
| 9 | Cron | Capacity warning | Alert when queue exceeds available capacity | daily | Monday | P1 | NO |
| 10 | Cron | Hiring trigger review | Weekly auto-check of hire thresholds | weekly | KPI + queue outputs | P2 | NO |
| 11 | Command | `/team-status` | Live team summary | manual | Monday, Supabase | P1 | NO |
| 12 | Command | `/kpi <name>` | Individual KPI card | manual | Monday, Supabase | P1 | NO |
| 13 | Command | `/capacity` | Current capacity vs queue pressure | manual | Monday | P1 | NO |
| 14 | Command | `/rework` | Rework / QC risk snapshot | manual | Monday | P2 | NO |
| 15 | Agent task | Performance review analysis | Interpret KPI trends, strengths, concerns, coaching priorities | monthly / ad hoc | script outputs + manager notes | P1 | YES |
| 16 | Agent task | Hiring decision support | Analyse whether a role should be hired and what profile is needed | ad hoc | capacity data, goals, business constraints | P1 | YES |
| 17 | Agent task | Team dynamic assessment | Interpret friction, dependency concentration, morale issues | ad hoc | KPI context + qualitative inputs | P2 | YES |
| 18 | Agent task | Training recommendation writing | Convert recurring quality issues into training suggestions | monthly | KPI + QC proxies + SOP gaps | P2 | YES |

### Team data sources
- Monday main board
- Monday activity logs
- team-audits scripts/reports
- Supabase metrics tables
- optional time tracking / rota system if introduced

### Team conclusion
Team should keep an agent, but only after the reporting surface exists. The agent should not be manually pulling performance facts by hand every time.

---

## C. REVENUE & SALES (BackMarket + Walk-in + Shopify)

### Domain view

Revenue operations split into two parts:
- **BackMarket deterministic operational machinery**
- **pricing / assortment / channel strategy**

This is currently the domain with the most existing scripts.

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | BM sent-orders ingestion | Create Monday records from BM SENT orders | daily cron | BM API, PDFs, Monday | P1 | YES |
| 2 | Script | BM intake checks | iCloud/spec/trade-in intake validation | webhook | Monday, SickW, Apple API, BM | P1 | YES |
| 3 | Script | BM grade/profit check | Evaluate post-diagnostic profitability / risk | webhook | Monday, BM data | P1 | YES |
| 4 | Script | BM trade-in payout validator | Validate payout changes / update records | webhook | BM API, Monday | P1 | YES |
| 5 | Script | BM listing creator | Build and publish device listings with approval gate | on demand | Monday, BM API, resolver truth, pricing data | P1 | YES |
| 6 | Script | Listings reconciliation | Catch oversell risk, missing cost data, orphan listings | daily or on demand | Monday, BM API | P1 | YES |
| 7 | Script | Buy box checker | Check buy-box position and margin, optionally bump | scheduled/on demand | BM API, Monday, pricing truth | P1 | YES |
| 8 | Script | Sale detection | Detect and accept sales orders | hourly | BM API, Monday | P1 | YES |
| 9 | Script | Dispatch automation | Buy shipping labels and update records | twice daily weekdays | BM API, Monday, Royal Mail | P1 | YES |
| 10 | Script | Shipment confirmation | Confirm dispatch back to BM | webhook | Monday, BM API | P1 | YES |
| 11 | Script | Tuesday cutoff monitor | Alert on accepted-but-not-shipped payout-risk orders | Monday / Tuesday cron | BM API, Monday | P1 | NO |
| 12 | Script | Buyback daily monitor | Monitor buyback competitors / bump rules | daily | BM buyback API, local scripts | P1 | YES |
| 13 | Script | Buyback weekly profitability report | Weekly view of pipeline economics | weekly | BM, Monday | P2 | YES |
| 14 | Script | Revenue by channel builder | Daily gross sales by BM / Shopify / repair / corporate | daily | BM, Shopify, Monday, Xero | P1 | NO |
| 15 | Script | Walk-in sales summary | Capture direct repair / walk-in revenue flow view | daily | Monday, Xero, Shopify where relevant | P2 | NO |
| 16 | Script | Shopify sales snapshot | Pull today’s orders / gross / source summary | daily + on demand | Shopify | P1 | NO |
| 17 | Cron | BM sent-orders run | Daily buyback ingestion | daily 06:00 UTC | BM, Monday | P1 | YES |
| 18 | Cron | Sale detection run | Detect new sales | hourly / selected weekend hours | BM, Monday | P1 | YES |
| 19 | Cron | Dispatch run | Buy labels | weekdays 07:00 + 12:00 UTC | BM, Royal Mail, Monday | P1 | YES |
| 20 | Cron | Listings reconciliation run | Daily cross-check before buy-box actions | daily | BM, Monday | P1 | PARTIAL |
| 21 | Cron | Buy box read-only scan | Scheduled buy-box health summary | daily | BM, Monday | P1 | NO |
| 22 | Cron | Tuesday cutoff alert | Protect payout timing | weekly | BM, Monday | P1 | NO |
| 23 | Cron | Revenue summary | Push daily revenue summary by channel | daily | BM, Shopify, Xero, Monday | P1 | NO |
| 24 | Command | `/buybox` | Current buy-box position / risks | manual | BM, Monday | P1 | NO |
| 25 | Command | `/sales-today` | Today’s sales by channel | manual | BM, Shopify, Xero | P1 | NO |
| 26 | Command | `/profitability <model>` | Profit snapshot for specific device/model | manual | pricing scripts, Monday, BM data | P2 | NO |
| 27 | Command | `/stock-value` | Estimated resale inventory value | manual | Monday, BM listing data | P2 | NO |
| 28 | Command | `/bm-cutoff` | Orders at risk before weekly cutoff | manual | BM, Monday | P1 | NO |
| 29 | Agent task | Pricing strategy decisions | Interpret competitive/pricing moves and margin tradeoffs | ad hoc | outputs from pricing scripts + BM data | P1 | YES |
| 30 | Agent task | Assortment / model strategy | Decide which devices/grades to push or avoid | weekly / ad hoc | profitability, stuck stock, demand data | P1 | YES |
| 31 | Agent task | Competitor response planning | Recommend response to market shifts / buy-box pressure | ad hoc | buy-box + profitability outputs | P2 | YES |
| 32 | Agent task | Edge-case profitability judgement | Human-style judgement when data is borderline or contradictory | ad hoc | script outputs + operator context | P2 | YES |

### Revenue & Sales data sources
- Back Market API
- Monday main board + BM devices board
- buyback-monitor outputs
- Shopify API
- Xero
- Royal Mail automation outputs

### Revenue conclusion
This domain already proves the pattern:
- most work is scriptable
- the surviving agent role is **commercial judgement**, not routine SOP execution

---

## D. FINANCE

### Domain view

Finance is currently one of the weakest truth layers in the business. The documented issues are:
- Monday payment truth is unreliable
- Xero is live but not fully integrated back into operations truth
- ghost invoices distort understanding
- no clean captured-vs-paid reconciliation model

This should be rebuilt as a **hard deterministic reporting and reconciliation domain**, with the agent used for interpretation.

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | Revenue-by-channel builder | Daily revenue view by BM / Shopify / direct repair / corporate | daily | Xero, Shopify, BM, Monday | P1 | PARTIAL |
| 2 | Script | Payment reconciliation engine | Match captured payments to invoices / repair jobs / channels | daily | Xero, Shopify, Stripe/SumUp if available, Monday | P1 | NO |
| 3 | Script | Captured-vs-reconciled tracker | Separate money received from money correctly written back and reconciled | daily | Xero, Shopify, Monday | P1 | NO |
| 4 | Script | Outstanding AR tracker | Build current receivables view excluding ghost/noise categories | daily | Xero | P1 | NO |
| 5 | Script | Ghost invoice classifier | Identify ghost invoices / review-needed rows / cleanup candidates | weekly | Xero | P1 | PARTIAL |
| 6 | Script | Cashflow forecast builder | 4-week cashflow forecast with recurring obligations | weekly | Xero, debt schedule, payroll assumptions | P1 | NO |
| 7 | Script | HMRC payment tracker | Track debt, payment plan milestones, due dates, status | weekly / monthly | Xero/manual debt schedule | P1 | NO |
| 8 | Script | Channel margin summary | View gross margin by channel / product family | weekly | Xero, BM, Shopify, Monday | P2 | NO |
| 9 | Script | Repair-value rollup | Estimate open repair book value by stage | daily | Monday, Xero rules | P2 | NO |
| 10 | Cron | Daily revenue summary | Push previous-day revenue and captured payment summary | daily | Xero, Shopify, BM | P1 | NO |
| 11 | Cron | Weekly cashflow forecast | Send 4-week cashflow view | weekly | Xero + forecast inputs | P1 | NO |
| 12 | Cron | Monthly P&L snapshot | High-level monthly snapshot for Ricky/Ali | monthly | Xero | P1 | NO |
| 13 | Cron | Outstanding receivables report | Push AR summary and overdue items | twice weekly | Xero | P1 | NO |
| 14 | Command | `/revenue-today` | Today / yesterday revenue view | manual | Xero, Shopify, BM | P1 | NO |
| 15 | Command | `/cashflow` | Current forecast summary | manual | Xero, forecast model | P1 | NO |
| 16 | Command | `/outstanding` | Current receivables summary | manual | Xero | P1 | NO |
| 17 | Command | `/hmrc` | HMRC plan / status snapshot | manual | debt tracker | P2 | NO |
| 18 | Agent task | Financial trend analysis | Explain trend movement, leak points, improvement areas | weekly / ad hoc | finance scripts + system audit outputs | P1 | YES |
| 19 | Agent task | Planning / target modeling | Translate goals into practical financial milestones | monthly / ad hoc | revenue goals, cashflow, channel data | P1 | YES |
| 20 | Agent task | Anomaly detection interpretation | Judge suspicious movements and propose action | ad hoc | reconciliation and trend outputs | P2 | YES |

### Finance data sources
- Xero
- Shopify
- BM API
- Monday for repair/job linkage
- Stripe / SumUp if accessible
- manual debt schedules / repayment obligations

### Finance conclusion
Finance should become one of the most deterministic domains in the system. The agent should read the outputs, not manually reconstruct them every time.

---

## E. CUSTOMER SERVICE

### Domain view

Customer service is one of the clearest LLM-worthy domains because the core work is:
- reading messy conversations
- judging tone and urgency
- drafting replies
- escalation handling

But the metrics, queue visibility, and tagging should be deterministic.

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | Intercom inbox metrics pull | Pull open conversations, unassigned, no-reply, SLA age, channel mix | daily / on demand | Intercom API | P1 | PARTIAL |
| 2 | Script | Response-time tracker | Track first-response and reply delays by channel/tag | daily | Intercom API | P1 | PARTIAL |
| 3 | Script | No-human-reply detector | Detect conversations with no human reply past threshold | hourly | Intercom API | P1 | NO |
| 4 | Script | Paid-not-contacted detector | Detect customers who paid but saw no follow-up | daily | Shopify, Intercom, Monday | P1 | YES/PARTIAL |
| 5 | Script | Repair-status lookup adapter | Structured lookup for repair status from Monday | on demand / inline | Monday | P1 | NO |
| 6 | Script | Conversation tagging helper | Apply deterministic tags based on source / intent / status where safe | on update / batch | Intercom API | P2 | NO |
| 7 | Script | CSAT / sentiment metrics builder | Build basic service quality indicators | daily / weekly | Intercom, tags, replies | P2 | NO |
| 8 | Script | Complaint pattern report | Aggregate recurring complaint themes from tagged data | weekly | Intercom, optional sentiment output | P2 | NO |
| 9 | Cron | Morning inbox triage support run | Fetch queue / prep material for Alex; actual triage remains agent-driven | daily 07:00 UTC | Intercom | P1 | PARTIAL |
| 10 | Cron | Daily CS metrics summary | Push service-health summary | daily | Intercom | P1 | NO |
| 11 | Cron | No-reply alert | Alert on unanswered backlog breaches | hourly | Intercom | P1 | NO |
| 12 | Command | `/inbox-status` | Current inbox health | manual | Intercom | P1 | NO |
| 13 | Command | `/customer <name>` | Structured status lookup across repair + conversation state | manual | Intercom, Monday | P1 | NO |
| 14 | Command | `/response-times` | Current response metrics | manual | Intercom | P1 | NO |
| 15 | Command | `/paid-not-contacted` | Customers at churn risk after payment | manual | Shopify, Intercom, Monday | P1 | NO |
| 16 | Agent task | Draft replies | Alex’s core job: draft customer messages in the right tone | daily | Intercom + status lookups + SOPs | P1 | YES |
| 17 | Agent task | Escalation handling | Handle complaints, refunds, emotionally loaded cases | daily / ad hoc | Intercom, Monday, customer context | P1 | YES |
| 18 | Agent task | Sentiment / risk analysis | Identify churn, frustration, reputational risk | daily / weekly | Intercom metrics + message bodies | P2 | YES |
| 19 | Agent task | Complaint pattern interpretation | Turn recurring issues into recommendations for ops/website/team | weekly | metrics + tagged cases | P2 | YES |

### Customer service data sources
- Intercom API
- Monday repair status
- Shopify payments/orders
- internal SOPs / quote-building rules

### Customer service conclusion
Keep Alex. Build the script layer around him so he spends time on:
- judgement
- drafting
- escalation
not on manual data gathering.

---

## F. MARKETING & GROWTH

### Domain view

Marketing is a hybrid domain:
- data collection is deterministic
- strategy, prioritisation, and brief writing are LLM work

The major known issue is that the intelligence stack partly exists but is not reliably running.

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | GSC daily pull | Pull search clicks, impressions, CTR, positions | daily | Google Search Console | P1 | PARTIAL |
| 2 | Script | Rank tracking scan | Run keyword / landing-page rank scans | weekly | rank scraper / search tools | P1 | PARTIAL/BROKEN |
| 3 | Script | PostHog daily summary | Pull conversion events, dead clicks, key page friction | daily | PostHog | P1 | NO |
| 4 | Script | Shopify conversion snapshot | Orders, conversion rate, AOV, landing-page performance | daily | Shopify, GA4/PostHog | P1 | PARTIAL |
| 5 | Script | Competitor monitor | Check core competitors / BM / SEO movements | monthly or weekly | web scrapers, GSC, manual sources | P2 | NO |
| 6 | Script | Meta Ads metrics pull | Pull spend, CTR, leads/conversions | daily | Meta Ads | P2 | NO |
| 7 | Script | Google Ads metrics pull | Pull search campaign performance when launched | daily | Google Ads | P2 | NO |
| 8 | Script | Missing-SKU opportunity builder | Join profitability + GSC demand + Shopify listing state | weekly | Shopify, GSC, profitability outputs | P1 | PARTIAL |
| 9 | Script | Content opportunity builder | Turn search demand + conversion gaps into content candidates | weekly | GSC, GA4/PostHog, Shopify | P2 | NO |
| 10 | Script | Conversion issue monitor | Track known high-intent page issues (contact, 404s, service pages) | daily | PostHog, GA4 | P1 | PARTIAL |
| 11 | Cron | Daily GSC pull | Refresh search-demand data | daily | GSC | P1 | NO/PARTIAL |
| 12 | Cron | Weekly rank scans | Scheduled ranking snapshots | weekly | scraper stack | P1 | PARTIAL/BROKEN |
| 13 | Cron | Monthly competitor checks | Snapshot competitor changes | monthly | scrapers/manual list | P2 | NO |
| 14 | Cron | Daily marketing summary | Push key metrics summary | daily | GSC, Shopify, PostHog, Meta | P1 | NO |
| 15 | Command | `/rankings <keyword>` | Return ranking / visibility info | manual | rank data, GSC | P1 | NO |
| 16 | Command | `/traffic-today` | Traffic and conversion summary | manual | GA4/PostHog/Shopify | P1 | NO |
| 17 | Command | `/conversion-rate` | Current conversion snapshot | manual | Shopify, analytics | P1 | NO |
| 18 | Command | `/seo-opportunities` | Best pages / terms to fix or publish next | manual | GSC, profitability, Shopify | P2 | NO |
| 19 | Agent task | Content strategy | Decide what content to create and why | weekly / ad hoc | script outputs, business priorities | P1 | YES |
| 20 | Agent task | Ad campaign planning | Develop campaign structure, messaging, tests | ad hoc | analytics + offer strategy | P2 | YES |
| 21 | Agent task | SEO audit interpretation | Turn data into action plan, not just metrics | weekly / monthly | GSC, rank data, page audits | P1 | YES |
| 22 | Agent task | Brief writing | Write execution-ready briefs for website/content/build work | frequent | script outputs + goals | P1 | YES |

### Marketing data sources
- Google Search Console
- PostHog
- GA4
- Shopify analytics
- Meta Ads
- Google Ads
- product profitability outputs

### Marketing conclusion
Marketing should survive strongly as an agent domain, but the data plane needs to be made reliable and scheduled.

---

## G. PARTS & INVENTORY

### Domain view

Parts/inventory needs a proper deterministic operating layer. Current known problems:
- weak forecasting
- reorder risk
- poor supplier visibility
- parts board not functioning as a real system

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---:|---|---|---|---|---|---|---|
| 1 | Script | Stock level checker | Return live stock level for part/device family | on demand + daily | Monday parts board / parts service DB | P1 | PARTIAL |
| 2 | Script | Low-stock alert generator | Detect below-threshold parts | daily | Monday parts board / parts DB | P1 | NO |
| 3 | Script | Reorder list builder | Build reorder list based on thresholds + forecast + active queue | daily / weekly | parts board, repair queue | P1 | NO |
| 4 | Script | Usage trend calculator | Calculate 30/60/90 day usage | weekly | Monday, repair completion data | P1 | YES/PARTIAL |
| 5 | Script | Demand forecast builder | Forecast future need from repair mix + queue + historical usage | weekly | Monday repairs, parts usage | P1 | NO |
| 6 | Script | Supplier price comparison | Compare supplier prices / latest evidence for a part | weekly / on demand | supplier data, Xero, manual price sheets | P2 | NO |
| 7 | Script | Supplier spend summary | Build supplier spend trend report | monthly | Xero | P2 | NO |
| 8 | Script | Parts reservation checker | Verify parts reserved against live jobs to reduce invisible commitments | on update / daily | parts service, Monday jobs | P1 | PARTIAL |
| 9 | Script | China shipment intake helper | Simplify intake of bulk shipments into inventory system | on intake | Monday / parts service | P2 | NO |
| 10 | Cron | Daily low-stock alert | Alert parts team on risk items | daily | parts system | P1 | NO |
| 11 | Cron | Weekly usage report | Send usage trend summary | weekly | Monday, parts data | P1 | PARTIAL |
| 12 | Cron | Monthly supplier review | Cost review by supplier / category | monthly | Xero, parts system | P2 | NO |
| 13 | Cron | Demand forecast refresh | Refresh projected demand surface | weekly | queue + usage data | P1 | NO |
| 14 | Command | `/stock <part>` | Current stock and commitments | manual | parts board / parts DB | P1 | NO |
| 15 | Command | `/reorder-list` | Current reorder candidates | manual | parts board, queue, forecast | P1 | NO |
| 16 | Command | `/supplier-price <part>` | Best known supplier/price snapshot | manual | supplier data, Xero/manual source | P2 | NO |
| 17 | Command | `/usage <part>` | Usage trend for given part | manual | historical usage data | P2 | NO |
| 18 | Agent task | Supplier negotiation prep | Build negotiation brief or order strategy | ad hoc | spend data, stock risk, supplier history | P2 | YES |
| 19 | Agent task | Demand pattern analysis | Explain why certain parts demand is changing | weekly / ad hoc | usage + queue + repair mix | P2 | YES |
| 20 | Agent task | Inventory strategy | Recommend stocking policy, reorder thresholds, supplier mix | monthly / ad hoc | stock, forecasts, spend, queue | P1 | YES |

### Parts data sources
- Monday parts board
- iCorrect parts service / DB
- repair queue data from Monday
- Xero supplier spend
- supplier APIs if introduced
- manual supplier price files / Nancy relationship inputs

### Parts conclusion
Parts should become heavily deterministic. The agent should be used for strategy and supplier judgement, not for live stock lookups.

---

## 3. Agent Roles (Redefined)

---

## 3.1 Jarvis (main)

**What it does**
- Cross-domain coordination
- Synthesis for Ricky
- Escalation routing
- Priority framing
- Strategic brief creation

**What it does NOT do anymore**
- Run deterministic scripts manually
- Act as a generic cron wrapper
- Serve as a lookup bot for stock, queue, or raw metrics

**Estimated interactions/day**
- 15–40

**Model recommendation**
- **Opus**

---

## 3.2 Alex

**What it does**
- Draft customer replies
- Build quotes
- Triage inbox
- Handle escalations and ambiguous customer situations

**What it does NOT do anymore**
- Manually gather repair statuses
- Manually compute inbox metrics
- Manually hunt for paid-not-contacted cases

**Estimated interactions/day**
- 20–60

**Model recommendation**
- **Sonnet**

---

## 3.3 Marketing Jarvis

**What it does**
- Interpret growth data
- Create strategy
- Write briefs
- Decide where to focus SEO/content/ads effort

**What it does NOT do anymore**
- Run rank scrapers manually
- Pull analytics by hand
- Act as a reporting shell

**Estimated interactions/day**
- 5–20

**Model recommendation**
- **Sonnet**

---

## 3.4 Operations

**What it does**
- Interpret queue/bottleneck outputs
- Recommend workflow changes
- Improve SOPs
- Help redesign intake/queue logic

**What it does NOT do anymore**
- Answer `/queue`-style lookups by hand
- Check aging manually
- Rebuild daily operations summaries manually

**Estimated interactions/day**
- 5–15

**Model recommendation**
- **Sonnet**

---

## 3.5 Team

**What it does**
- Interpret performance
- Support hiring decisions
- Recommend coaching and structure changes

**What it does NOT do anymore**
- Pull KPI numbers by hand
- Act as a manual dashboard

**Estimated interactions/day**
- 2–10

**Model recommendation**
- **Sonnet**

---

## 3.6 Parts

**What it does**
- Inventory strategy
- Supplier judgement
- Demand pattern interpretation

**What it does NOT do anymore**
- Answer stock lookups from memory
- Check Monday stock states manually
- Build reorder lists manually

**Estimated interactions/day**
- 2–10

**Model recommendation**
- **Sonnet**

---

## 3.7 Hugo / BackMarket

**What it does**
- Pricing strategy
- Channel decisions
- Edge-case judgement
- Commercial recommendations

**What it does NOT do anymore**
- Serve as the wrapper for SOP 01/06/06.5/07/08/09 logic
- Do routine BM lookups or report formatting that scripts can do

**Estimated interactions/day**
- 5–20

**Model recommendation**
- **Sonnet**

---

## 3.8 Systems

**What it does**
- Incident interpretation
- Service diagnosis
- Risk analysis
- Infrastructure recommendations

**What it does NOT do anymore**
- Act as a plain status-check shell if a script can answer it

**Estimated interactions/day**
- 2–10

**Model recommendation**
- **Sonnet** for now; **Haiku/Grok-tier** possible later if scripts mature further

---

## 3.9 Diagnostics / Elek

**What it does**
- Deep technical reasoning
- Fault isolation
- Specialist board-level support

**What it does NOT do anymore**
- Nothing major to strip; this is already a genuinely LLM-worthy role

**Estimated interactions/day**
- 0–8 bursty

**Model recommendation**
- **Sonnet**

---

## 3.10 Build agents

### Build Orchestrator
- coordinates implementation tracks
- Sonnet

### Codex Builder
- implementation worker
- Codex

### Codex Reviewer
- review / QA
- Codex or Sonnet depending workflow

These remain part of the build system, not the day-to-day business-ops layer.

---

## 4. Slack / Telegram Bot Command Registry

This is the proposed unified command surface.

### Operations
- `/queue`
- `/status <item>`
- `/aging`
- `/bench <name>`
- `/ops-summary`

### Team
- `/team-status`
- `/kpi <name>`
- `/capacity`
- `/rework`

### Revenue & Sales
- `/buybox`
- `/sales-today`
- `/profitability <model>`
- `/stock-value`
- `/bm-cutoff`

### Finance
- `/revenue-today`
- `/cashflow`
- `/outstanding`
- `/hmrc`

### Customer Service
- `/inbox-status`
- `/customer <name>`
- `/response-times`
- `/paid-not-contacted`

### Marketing
- `/rankings <keyword>`
- `/traffic-today`
- `/conversion-rate`
- `/seo-opportunities`

### Parts
- `/stock <part>`
- `/reorder-list`
- `/supplier-price <part>`
- `/usage <part>`

### Cross-domain / executive
- `/daily-summary`
- `/weekly-summary`
- `/business-health`
- `/alerts`
- `/who-blocked`

### Command design rule
Each command should:
- call a deterministic script or query
- return formatted output directly
- only escalate to an agent when the user asks **why**, **what should we do**, or **draft a response/recommendation**

---

## 5. Build Order

---

## Phase 1 — immediate business protection (P1)

### 1. Finance truth rebuild
Why first:
- decisions are contaminated without revenue/payment truth
- affects HMRC, cashflow, channel profitability, and confidence in all other reporting

Build:
- payment reconciliation engine
- captured-vs-reconciled model
- AR / ghost-invoice reporting
- daily revenue summary

### 2. Customer-service operating surface
Why first:
- unanswered/slow responses are directly leaking revenue
- Alex already adds value, but lacks reliable support tooling

Build:
- inbox metrics pull
- no-human-reply detection
- paid-not-contacted detection
- repair-status lookup adapter
- fix and harden morning inbox triage flow

### 3. Operations queue/aging/bottleneck surface
Why first:
- queue chaos and stale debt distort workshop flow
- unlocks team planning and throughput gains

Build:
- queue builder
- aging detector
- bottleneck detector
- zombie queue triage
- daily ops summary

### 4. Parts stock/reorder/usage surface
Why first:
- stockouts block repairs immediately
- forecasting weakness already harmed the business

Build:
- low-stock alerts
- reorder list builder
- usage trends
- demand forecast v1

---

## Phase 2 — revenue and channel discipline

### 5. BackMarket deterministic estate cleanup
Why now:
- much already exists
- need to stop using Hugo as a script wrapper
- simple wins available

Build / wire:
- schedule listings reconciliation
- build SOP 11 cutoff monitor
- optionally add buy-box read-only scheduled report
- standardise BM command layer

### 6. Marketing data plane repair
Why now:
- demand exists, but conversion and visibility data need reliable refresh
- strategy agent becomes much more useful once data is fresh

Build:
- daily GSC pulls
- weekly rank scans
- PostHog summary
- marketing daily summary
- missing-SKU opportunity output

---

## Phase 3 — management and optimisation

### 7. Team KPI/capacity system
Build:
- weekly KPI summary
- capacity planning calculator
- hiring trigger rules
- rework/QC proxies

### 8. Unified command bot layer
Build:
- Telegram/Slack command registry wrappers
- shared formatting layer
- permission/routing rules

---

## Phase 4 — agent optimisation and higher-order analysis

### 9. Predictive / planning systems
- demand forecasting
- staffing projections
- profitability scenario planning

### 10. Agent recommendation loops
- weekly anomaly review
- recurring strategy memos
- cross-domain issue detection

---

## 6. What Already Exists

This section prevents duplicate rebuilding.

### Already built and worth keeping

#### BackMarket
- `scripts/sent-orders.js`
- `scripts/sale-detection.js`
- `scripts/list-device.js`
- `scripts/reconcile-listings.js`
- `scripts/buy-box-check.js`
- `scripts/board-housekeeping.js`
- `services/bm-grade-check`
- `services/bm-payout`
- `services/bm-shipping`
- `buyback-monitor/run-daily.sh`
- `buyback-monitor/run-weekly.sh`

#### Revenue / Shipping / Ops support
- `/home/ricky/builds/royal-mail-automation/dispatch.js`
- `/home/ricky/builds/icloud-checker/` service
- `/home/ricky/builds/icorrect-parts-service/` parts deduction/reservation service
- `/home/ricky/builds/intake-system/` spec + frontend work
- `/home/ricky/builds/xero-invoice-automation/` existing Xero automation work
- `/home/ricky/mission-control-v2/scripts/kpi/kpi_updater.py` from prior KPI automation summary

#### Marketing / intelligence research stack
- marketing intelligence platform code/assets exist in some form
- multiple audit/research scripts in `system-audit-2026-03-31/`
- `gsc_profitability_crossref.py`
- `repair_profitability_v2.py`
- `shopify_health_audit.py`
- `intercom_deep_metrics.py`
- `monday_zombie_triage.py`
- `product_cards.py`

#### Parts
- `update_usage_columns.py`
- `populate_60d_usage.py`
- `monday_kpi_export.py`
- parts service DB-backed runtime

### Existing things that should be reused, not rebuilt
- Monday webhook services already live
- OpenClaw cron / crontab pattern already proven
- Telegram alerting pattern already exists
- research scripts from `system-audit-2026-03-31/` are a strong seed library

### Existing things that need fixing, not reimagining
- Morning Inbox Triage cron (keep agent task, fix reliability)
- Marketing intelligence scheduled refresh layer
- Buy-box / BM scheduling consistency
- Finance reconciliation truth layer
- Parts board + supplier operating model

---

## 7. Final Recommendation

### Recommended end-state split

#### Scripts / services own:
- lookups
- API syncing
- reconciliation
- status summaries
- alerts
- deterministic SOP runs
- bot commands

#### Agents own:
- drafting
- triage
- judgement
- explanation
- prioritisation
- recommendations
- strategy

### If implemented properly, this blueprint should deliver
- much lower token waste
- fewer hallucinated factual answers
- faster operational response times
- clearer domain ownership
- better daily visibility for Ricky
- a cleaner path from £52k/mo toward the Q4 2026 run-rate target

### Single-sentence version

> **Build iCorrect as a script-first operating system with agents sitting above it as analysts, writers, and decision-support partners — not as expensive wrappers around API calls.**

---

## Sources checked

- `/home/ricky/builds/agent-rebuild/BRIEF-06-AUTOMATION-BLUEPRINT.md`
- `/home/ricky/builds/agent-rebuild/system-rethink.md`
- `/home/ricky/builds/agent-rebuild/vps-audit.md`
- `/home/ricky/builds/agent-rebuild/cron-audit.md`
- `/home/ricky/builds/agents/research.md`
- `/home/ricky/.openclaw/shared/COMPANY.md`
- `/home/ricky/.openclaw/shared/GOALS.md`
- `/home/ricky/.openclaw/shared/PROBLEMS.md`
- `/home/ricky/builds/INDEX.md`
- `/home/ricky/builds/agent-rebuild/hugo-script-audit.md`
- `/home/ricky/builds/agent-rebuild/system-audit-digest.md`
- prior domain research already completed in this rebuild pack, including intake, inventory, quote-building, customer-service, and marketing audits

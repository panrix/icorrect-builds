# iCorrect Data Architecture — The Complete Picture

**Brief for Code + Ricky**
**Date:** 19 Feb 2026
**Purpose:** Define every data source, linkage, and analysis layer needed to fully understand and optimise iCorrect — from individual screw turns to strategic growth decisions.

---

## The Premise

Jarvis has been hired as a business analyst with one job: understand everything about how iCorrect operates, find every inefficiency, every opportunity, every risk — and build the systems to continuously monitor and improve.

To do that, we need data. Not just surface-level dashboards — we need linked, contextual, queryable data that lets us ask questions we haven't thought of yet.

---

## LAYER 1: The Repair Journey (Core Business Data)

Every repair that comes through iCorrect is a story. We need the complete story, end to end.

### Data Sources
- **Monday.com Main Board** (349212843) — repair items, statuses, timestamps, assignees, updates + replies
- **Monday.com Parts/Stock Board** (985177480) — parts used per repair, costs, suppliers
- **Typeform** — 4 intake forms (appointment, collection, walk-in enquiry, walk-in drop-off)
- **Intercom** — all customer conversations linked to repairs
- **Xero** — invoices, payments, credit notes per repair

### What We Build
- **Repair timeline:** For every repair — intake timestamp, diagnostic start, diagnostic complete, quote sent, quote approved, repair start, repair complete, QC start, QC pass/fail, collection/shipping, payment received
- **Touch count:** How many people touched this repair? How many handoffs?
- **Dwell time per stage:** Where do repairs stall? Diagnostic → quote is Ferrari's bottleneck. QC → collection is another.
- **Rework rate:** How often does a repair come back through QC? Which tech? Which repair type?
- **Revenue per repair:** Parts cost, labour time, invoice amount, payment method, margin

### Questions This Answers
- What's our average repair turnaround by device type?
- Where do repairs stall and why?
- Which repairs are profitable and which lose money?
- What's our rework rate by technician?
- How often do we miss our promised timelines?

---

## LAYER 2: Customer Experience

Every customer interaction across every channel — calls, chat, email, in-person. The full picture of how it feels to be an iCorrect customer.

### Data Sources
- **Asterisk CDR** — call records (already have 6 months)
- **Intercom / Finn** — chat conversations, resolution times, handoff rates, CSAT
- **Typeform submissions** — what customers tell us at intake
- **Monday updates** — what we tell customers (via Ferrari's Intercom messages)
- **Google Reviews** — sentiment, themes, response times
- **Shopify** — online orders, mail-in flow

### What We Build
- **Customer journey map:** First contact → intake → updates received → collection → post-repair follow-up
- **Contact reason taxonomy:** New enquiry, status chase, complaint, quote query, collection arrangement, warranty claim, corporate booking
- **Call-to-repair linking:** Match phone numbers from CDR to Monday customer records — which calls are new business vs existing customers chasing updates?
- **Communication gap detection:** Time between last customer contact and next update from us. Gaps > 24h = failure.
- **Repeat caller analysis:** Customers who call 3+ times for one repair = broken communication
- **Finn performance:** What % does the chatbot resolve vs hand off? What questions does it fail on?

### Questions This Answers
- How many calls are customers chasing us for updates we should have proactively sent?
- What's the customer experience timeline for a typical repair?
- Where do customers get frustrated? (repeat calls, long waits, no updates)
- How effective is Finn at deflecting routine queries?
- What's our Google Review trajectory — improving or declining?
- How many potential customers call once, don't get through, and never call back?

---

## LAYER 3: Team Performance

Not surveillance — understanding. Who's strong at what, who's overloaded, who needs training, where the team breaks down.

### Data Sources
- **Monday.com** — task assignments, status changes (with timestamps = proxy for work time)
- **Slack** — message volume, response times, @mentions, channel activity per person
- **Asterisk CDR** — call handling per extension (once mapped to people)
- **Intercom** — response times per agent (Ferrari mainly)
- **Typeform** — intake volume per form (proxy for walk-in traffic)
- **QC data** — pass/fail rates from Monday (Roni's workflow)

### What We Build
- **Per-tech profile:** Repairs completed, avg time per repair type, QC pass rate, rework rate, specialisation areas
- **Workload distribution:** Who's overloaded, who has capacity (already started with Adil analysis)
- **Response time matrix:** Per person, per channel (Slack, phone, Intercom) — who responds fast, who goes dark
- **Skill matrix:** Which techs handle which device types? Where are the gaps?
- **Ferrari activity map:** Calls answered, Intercom responses, Monday updates, quotes sent, decisions made — the full picture of his day
- **Adil front-of-house metrics:** Intake speed, walk-in handling, customer interaction quality

### Questions This Answers
- If Ferrari leaves, exactly which functions need covering and by whom?
- Which tech is most efficient per repair type?
- Who's improving over time and who's plateauing?
- Where are the training gaps? (Roni already identified per-tech weak spots)
- Is Adil utilised enough to justify his role?
- What does Ferrari actually do all day? (not what he says — what the data shows)

---

## LAYER 4: Financial Health

Revenue, costs, margins, cash flow — at the repair level, customer level, and business level.

### Data Sources
- **Xero** — P&L, balance sheet, invoices, payments, aged receivables, bank transactions
- **Stripe** — online payments, invoice payments (INV-xxxx)
- **SumUp** — walk-in card payments
- **Monday.com** — repair values, parts costs
- **Shopify** — online sales, refunds
- **Back Market** — trade-in/buyback revenue

### What We Build
- **Repair-level P&L:** Revenue minus parts minus labour time (estimated from timestamps) = margin per repair
- **Customer lifetime value:** Repeat customers, corporate accounts, referral patterns
- **Revenue leakage tracker:** Free repairs given, discounts applied, unbilled work, expired quotes
- **Aged receivables dashboard:** Who owes money and for how long? (£5K+ currently uncollected from corporates)
- **Payment reconciliation:** SumUp + Stripe + Xero matched to Monday items — automated, daily
- **Channel profitability:** Walk-in vs mail-in vs corporate vs Back Market — which channels are actually profitable?

### Questions This Answers
- What's our true margin per repair type?
- Which customers/accounts are most valuable?
- How much revenue are we leaking through free repairs, unbilled work, and uncollected invoices?
- Which sales channels should we grow vs shrink?
- What's our break-even point? How many repairs/day do we need?
- Cash flow projection — when do we need money vs when does it arrive?

---

## LAYER 5: Operations & Workflow

How work actually flows through the shop vs how it should flow.

### Data Sources
- **Monday.com** — status transitions with timestamps (the full state machine)
- **Slack** — team coordination messages, escalations, questions to Ferrari
- **Typeform** — intake patterns by day/hour
- **Asterisk CDR** — call patterns by hour (demand curve)
- **Google Calendar** — appointments, collection bookings

### What We Build
- **Process flow map:** Actual vs intended workflow — where do repairs deviate from the standard path?
- **Bottleneck detection:** Real-time identification of where repairs are stalling (diagnostic queue, waiting for parts, waiting for quote approval, waiting for collection)
- **Demand forecasting:** Call volume + walk-in volume + mail-in volume by day of week and hour — predict staffing needs
- **Capacity model:** Based on tech speeds per repair type, how many repairs can we actually process per day? Where's the constraint?
- **Automation audit:** Every manual step that could be automated — status notifications, quote generation, collection booking, payment reminders, invoice creation

### Questions This Answers
- What's our actual throughput vs theoretical capacity?
- Which day of the week is busiest? Do we staff for it?
- How many repairs are sitting idle waiting for a human decision?
- What's the longest a repair has ever sat in one status? Why?
- Which manual processes cost the most time and could be automated first?

---

## LAYER 6: Parts & Supply Chain

What we buy, from whom, how fast it arrives, and whether we have what we need.

### Data Sources
- **Monday.com Parts Board** (985177480) — stock levels, orders, suppliers
- **Xero** — purchase invoices, supplier payments
- **Monday.com Main Board** — "waiting for parts" status duration
- **Supplier communications** (email/Slack)

### What We Build
- **Parts usage by repair type:** Which parts move fastest? Which sit on shelves?
- **Supplier performance:** Delivery time, quality, cost per part, return rate
- **Stock-out impact:** How many repairs delayed because parts weren't in stock?
- **Parts cost trending:** Are we paying more over time? Alternative supplier comparison
- **Reorder triggers:** Automatic alerts when stock drops below threshold

### Questions This Answers
- Are we stocking the right parts?
- Which supplier is best for which part type?
- How much revenue do we lose to "waiting for parts" delays?
- Could we negotiate better pricing with volume data?

---

## LAYER 7: Sales & Marketing

Where customers come from and how to get more of the right ones.

### Data Sources
- **Google Business Profile** — search impressions, clicks, calls from listing
- **PostHog** (296651) — website traffic, conversion funnels, heatmaps
- **Google Analytics** — traffic sources, landing pages
- **Shopify** — online conversion rate, cart abandonment
- **Asterisk CDR** — inbound call volume as demand signal
- **Typeform** — "how did you hear about us" data
- **Back Market** — listing performance, buyback volumes
- **Google Ads** (if running) — spend, clicks, conversions

### What We Build
- **Acquisition funnel:** Impression → click → call/visit → intake → repair → payment — conversion rate at each step
- **Channel attribution:** Which marketing channels drive the most (and most profitable) repairs?
- **Local SEO performance:** Search ranking trends, review velocity, competitor comparison
- **Website conversion optimisation:** Where do visitors drop off? Which pages convert?
- **Seasonal demand patterns:** Monthly/quarterly trends — when to push marketing, when to hold back

### Questions This Answers
- Where should we spend marketing budget for best ROI?
- What's our cost per acquired customer by channel?
- Are we visible for the right search terms?
- What's our website conversion rate and how does it compare to industry?
- Which services should we promote vs which sell themselves?

---

## LAYER 8: Quality & Standards

Measuring output quality, not just speed.

### Data Sources
- **Monday.com** — QC status, rework items, warranty claims
- **Slack** — Roni's QC feedback per tech (already tracking weak spots)
- **Intercom** — post-repair complaints
- **Google Reviews** — quality-related feedback
- **Back Market** — return rates, quality disputes

### What We Build
- **QC scorecard per tech:** Pass rate, common failure types, trend over time
- **Warranty claim tracker:** Which repairs come back? How often? Cost of warranty work
- **Customer complaint taxonomy:** What goes wrong, categorised and tracked
- **Quality trend:** Are we getting better or worse over time?
- **Training needs analysis:** Per-tech weak spots → targeted training → measure improvement

### Questions This Answers
- Which tech needs what training?
- What's our true first-time fix rate?
- How much does rework cost us?
- Are quality issues getting better or worse?
- Which repair types have the highest failure rate?

---

## LAYER 9: Competitive & Market Intelligence

Understanding the landscape we operate in.

### Data Sources
- **Google Maps** — competitor listings, reviews, pricing signals
- **Back Market** — market pricing for device types
- **Web scraping** — competitor websites, pricing pages
- **Industry reports** — repair market trends, Apple policy changes

### What We Build
- **Competitor map:** Who else operates in our area? What do they charge? What's their review score?
- **Pricing intelligence:** Are we priced right vs competitors and vs customer willingness to pay?
- **Market trend tracking:** New device launches (affects repair demand), Right to Repair legislation, Apple parts programme changes
- **Service gap analysis:** What do competitors offer that we don't? What do we offer that they can't?

### Questions This Answers
- Are we priced competitively?
- Where are the market gaps we could fill?
- Which competitors are growing and what can we learn from them?
- What external trends could disrupt our business?

---

## LAYER 10: Strategic & Predictive

Combining everything above into forward-looking intelligence.

### What We Build (from combined data)
- **Revenue forecasting:** Based on seasonal patterns, marketing spend, capacity
- **Hiring model:** At what repair volume do we need another tech? Another front-of-house?
- **Automation ROI calculator:** For each potential automation, what's the time saved × cost = payback period?
- **Scenario planning:** "What if Ferrari leaves?" "What if we add a second location?" "What if we focus only on corporate?"
- **Customer health score:** Early warning when a corporate account is at risk (declining volume, complaints)
- **Business health dashboard:** One screen that tells Ricky if things are on track or not — daily

### Questions This Answers
- Where should Ricky focus this week for maximum impact?
- What's the 90-day outlook?
- Which investment (hire, tool, automation) has the best ROI right now?
- Are we growing or shrinking — and why?

---

## Data Architecture Requirements (for Code)

### Central Data Store: Supabase

All data flows into Supabase as normalised, linked tables:

**Core entities:**
- `repairs` — one row per repair (from Monday), linked to customer, tech, parts, invoices
- `customers` — deduplicated from Monday + Intercom + phone numbers
- `team_members` — staff profiles with extension mapping, skills, roles
- `parts` — inventory items with cost, supplier, stock level

**Event/activity tables:**
- `repair_events` — every status change, assignment, update (from Monday webhooks or polling)
- `customer_contacts` — every call, chat, email, walk-in (from CDR, Intercom, Typeform)
- `financial_transactions` — every payment, invoice, refund (from Xero, Stripe, SumUp)
- `quality_events` — QC results, warranty claims, complaints

**Reference/config tables:**
- `repair_types` — device models, repair categories, standard pricing, expected durations
- `suppliers` — supplier profiles, lead times, pricing
- `extensions` — phone extension → person mapping

### ETL Pipeline

1. **Ingest:** Pull raw data from APIs (Monday, Intercom, Xero, CDR exports, Typeform) on schedule
2. **Transform:** Clean, deduplicate, link records (match phone numbers to customers, repairs to invoices)
3. **Load:** Write to Supabase normalised tables
4. **Refresh:** Incremental updates — only process new/changed records

### Agent Access Pattern

- Agents **never process raw data** — they query Supabase or call analysis scripts
- **Pre-built SQL views** for common queries (daily repair summary, tech performance, customer health)
- **Analysis scripts** in Python that output markdown summaries
- **Agent reads summary** and provides interpretation/recommendations

### Data Sources Priority (what to connect first)

| Priority | Source | Data | Effort | Impact |
|----------|--------|------|--------|--------|
| 1 | Monday.com (API) | Repairs, statuses, updates, assignments | Medium | Critical — it's the core |
| 2 | Asterisk CDR (file import) | Call records | Low | High — already have the data |
| 3 | Xero (API, needs re-auth) | Invoices, payments | Medium | High — financial visibility |
| 4 | Intercom (API) | Conversations, resolution times | Medium | High — customer experience |
| 5 | Typeform (API) | Intake data, walk-in patterns | Low | Medium — demand patterns |
| 6 | Stripe + SumUp (APIs) | Payments | Low | Medium — reconciliation |
| 7 | PostHog (API) | Web analytics | Low | Medium — marketing |
| 8 | Google Business (API) | Local SEO, reviews | Low | Medium — market position |
| 9 | Shopify (API) | Online orders | Low | Lower — small channel |
| 10 | Back Market (API) | Trade-in orders | Low | Lower — needs API fix first |

---

## How This Changes Agent Operations

**Before (current):**
- Ricky sends raw file → Jarvis crunches on Opus → burns tokens → analysis lost on compaction

**After (target):**
- Raw data lands in Supabase (automated ETL)
- Analysis scripts run on demand (zero LLM tokens)
- Jarvis reads structured summaries and provides strategic interpretation
- Historical analysis is replayable — no re-ingestion needed
- Any agent can access any data layer through Supabase queries

**Token impact:** ~90% reduction for data analysis tasks. Opus reserved for interpretation and strategy only.

---

## Next Steps

1. **Code:** Review this brief, design Supabase schema, build ETL for Priority 1-3 sources
2. **Ricky:** Re-auth Xero token, confirm extension → person mapping, provide any historical data exports
3. **Jarvis:** Build analysis script templates, define the pre-built SQL views needed
4. **Timeline:** Priority 1-3 sources connected within 2 weeks, full pipeline within 6 weeks

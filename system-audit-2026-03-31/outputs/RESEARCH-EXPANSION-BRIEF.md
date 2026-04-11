# Research Expansion Brief

Created: 2026-04-01
Author: Jarvis (coordinator)
For: system-audit research agent

This brief extends the current system audit with three new research tracks plus several supplementary areas. Follow the same evidence conventions already established in this audit pack (`Observed`/`Inferred` labelling, raw exports to `/home/ricky/data/exports/system-audit-2026-03-31/`, updates to `discovery_log.md` and `findings.md`).

All work is read-only. No production mutations.

---

## Track 1: Marketing and Growth Analytics

### Objective

Map all marketing channels, quantify performance, identify conversion bottlenecks, and determine true customer acquisition cost per channel.

### Verified Access

| Platform | Status | Token/Credential | Endpoint |
|----------|--------|-------------------|----------|
| PostHog | LIVE | `POSTHOG_API_KEY` in `config/api-keys/.env` | `https://us.posthog.com/api/projects/296651/` (US endpoint, NOT EU) |
| GA4 | LIVE | `EDGE_GOOGLE_REFRESH_TOKEN` (not JARVIS token) | Property ID `353983768` |
| Google Search Console | LIVE | `EDGE_GOOGLE_REFRESH_TOKEN` | Site: `https://www.icorrect.co.uk/` (URL-encode as `https%3A%2F%2Fwww.icorrect.co.uk%2F`) |
| Meta/Facebook Ads | LIVE | `META_ACCESS_TOKEN` | Ad Account: `act_513485772889925`, Page: `1768980250003769` |
| Shopify | LIVE | `SHOPIFY_ACCESS_TOKEN` | Store: `i-correct-final.myshopify.com` |
| Intercom | LIVE | Already verified in audit | Conversation/contact search for attribution |

**Important credential notes:**
- GA4 and Search Console require `EDGE_GOOGLE_REFRESH_TOKEN`, NOT `JARVIS_GOOGLE_REFRESH_TOKEN`. The Jarvis token returns 403 on GA4.
- PostHog is on the US endpoint (`us.posthog.com`), not EU. The EU endpoint returns auth failed.
- Google Business Profile is scope-blocked on current tokens.
- No Mailchimp, Klaviyo, or email marketing platform tokens exist.

### Research Areas

#### 1.1 Website Traffic and Behaviour (PostHog + GA4)

- Total sessions, unique visitors, and trends (last 90 days minimum, 6 months if available)
- Traffic source breakdown: organic, paid, direct, referral, social
- Landing page performance: which pages attract traffic, which convert
- Bounce rate by page and source
- Session-to-enquiry conversion: how many sessions result in a Typeform submission, Intercom conversation, or Shopify checkout
- Device split: mobile vs desktop (important for Telegram-formatted Shopify pages)
- PostHog funnel analysis if funnels are configured
- PostHog session recordings or heatmap data availability (document what's configured, don't pull raw recordings)
- Confirm whether the PostHog/Shopify session stitching fix from 2026-03-11 (documented in marketing workspace) is reflected in the data

#### 1.2 Search Performance (Google Search Console)

- Top queries by clicks and impressions (last 90 days)
- Click-through rate by query cluster (brand vs service vs device)
- Page-level performance: which URLs rank, for what terms
- Mobile vs desktop search splits
- Indexation status: how many pages indexed vs submitted
- Any manual actions or security issues flagged
- Cross-reference with SEO audit findings already in `/home/ricky/.openclaw/agents/marketing/workspace/docs/seo-audit-feb-2026.md`

#### 1.3 Paid Advertising (Meta/Facebook)

- Active vs paused campaigns (current state already shows 2 active MacBook campaigns)
- Spend, impressions, clicks, CPC, CTR, and conversions per campaign (last 90 days)
- Cost per acquisition if conversion tracking is configured
- ROAS if revenue tracking is connected
- Audience targeting: who are the ads reaching
- Ad creative performance: which creatives/variants perform best
- Historical spend trend: is ad spend increasing or decreasing
- Whether Google Ads exists anywhere (no token found; document as gap if not)

#### 1.4 Shopify Conversion Funnel

- Sessions to product views to add-to-cart to checkout to paid (Shopify analytics API or PostHog)
- Cart abandonment rate
- Average order value trends
- Top-selling products/services by revenue
- Discount/coupon usage rates
- Checkout drop-off: where do people leave
- Payment method distribution

#### 1.5 Social and Reputation

- Facebook page: followers (`4,500` confirmed), engagement rates, post frequency
- Instagram: check if connected to the same Meta account; pull follower count and engagement if accessible
- Google Reviews: 4.8 star rating confirmed on Facebook; check if Google Business reviews are accessible via any available API or scrape the public listing
- Trustpilot or other review platforms: check if any exist

#### 1.6 Customer Acquisition Cost Model

Synthesise the above into a per-channel CAC estimate:
- Organic web: SEO investment (if any) / organic conversions
- Paid Meta: ad spend / paid conversions
- Shopify direct: any Shopify marketing spend / Shopify orders
- Walk-in/referral: estimate from team operations data
- Back Market: BM commission and fees / BM orders

---

## Track 2: Staff Performance from Repair Data

### Objective

Build a complete technician performance profile from Monday repair data, going deeper than the partial splits already in `timing-mapping.md`.

### Data Source

Monday main board `349212843`. Use the existing verified schema in `/home/ricky/kb/monday/main-board.md` and `/home/ricky/builds/monday/main-board-column-audit.md`.

Known technician user IDs (from team audits):
- Safan Patel: `25304513`
- Misha Kepeshchuk: `64642914`
- Andreas Egas: `49001724`
- Roni Mykhailiuk: `79665360`
- Michael Ferrari: `55780786`

### Research Areas

#### 2.1 Completion Volume

- Total repairs completed per technician per month (last 6 months)
- Breakdown by device type (iPhone, MacBook, iPad, Watch, other)
- Breakdown by repair type (screen, battery, board-level, diagnostic-only, refurb, other)
- Breakdown by client type (walk-in, mail-in, corporate, BM)
- Trend: is each tech's output increasing, stable, or declining

#### 2.2 Speed and Efficiency

- Median and p75 repair duration per tech per job category
- Median diagnostic duration per tech
- Comparison of active bench time vs total elapsed time (using the timing columns: `Repair Time`, `Diagnostic Time`, `Refurb Time`, `QC Time` vs `Total Time`)
- Dwell time in queued/paused states per tech's assigned items
- Same-day completion rate per tech

#### 2.3 Quality

- QC pass rate vs fail rate per tech (from QC status transitions)
- Return/rework rate per tech (items that re-enter repair after QC or after customer collection)
- BM return rate attributable to specific techs if traceable
- Repeat repairs on the same device within 30/60/90 days

#### 2.4 Revenue Attribution

- Revenue value of completed repairs per tech (from `formula74`, `dup__of_quote_total`, or relevant pricing columns)
- Average repair value per tech
- Revenue per hour if bench time is calculable
- High-value vs low-value job distribution per tech

#### 2.5 Capacity and Utilisation

- Working days per tech per month (from Monday activity presence)
- Completions per working day per tech
- Peak vs trough days
- Whether specific techs are consistently idle or overloaded
- Cross-reference with `team-operations-summary.md` roster notes

---

## Track 3: Monday Internal Updates Analysis

### Objective

Mine the free-text update threads on Monday items to surface real operational bottlenecks, delay causes, and communication patterns that status columns alone cannot reveal.

### Data Source

Monday item updates (the comment/activity thread on each item). API: `items { updates { text_body created_at creator { name } } }`.

### Research Areas

#### 3.1 Volume and Pattern

- Total updates per month (last 6 months)
- Updates per item: distribution (how many items have 0, 1-3, 4-10, 10+ updates)
- Human vs automation updates (identify bot/n8n-generated updates vs human-written ones)
- Update frequency by team member
- Time-of-day patterns: when are updates being written

#### 3.2 Delay and Blocker Extraction

This is the highest-value part. From human-written updates, extract and categorise:

- **Parts delays**: mentions of parts waiting, out of stock, wrong part, supplier issues
- **Customer no-response**: mentions of customer not replying, can't reach, no approval
- **Diagnostic complications**: unexpected findings, board-level issues, liquid damage discoveries
- **Rework/return reasons**: why something came back, what failed
- **BM-specific issues**: counter-offers, grade disputes, spec mismatches, shipping problems
- **Internal handoff issues**: mentions of waiting for another team member, QC queues, confusion about ownership
- **Equipment/tooling issues**: any mentions of broken tools, missing equipment, workstation problems

For each category, quantify:
- Frequency (how often does this appear)
- Which device types / repair types are most affected
- Which stage of the repair flow it occurs in
- Average additional delay it causes (if traceable from timestamps)

#### 3.3 Communication Quality

- Are updates informative or just status echoes?
- Do updates contain actionable information for the next person in the chain?
- Are customer-facing decisions being documented or lost?
- Are diagnostic findings being recorded in enough detail to be useful?

#### 3.4 Synthesis

Produce a ranked list of operational bottlenecks by frequency and estimated business impact, cross-referenced with the existing findings in `findings.md`.

---

## Supplementary Research Areas

### S1: Supplier and Parts Economics

- Pull parts board data: suppliers, costs, lead times, stock levels
- Identify top 10 parts by cost and by volume
- Calculate average parts cost as percentage of repair value by job type
- Identify slow-moving or dead stock
- Map supplier concentration risk (how many suppliers, how dependent on each)

### S2: Customer Lifetime Value and Retention

- From Monday: identify repeat customers (same name, email, or phone across multiple items)
- Calculate repeat rate: what percentage of customers have 2+ repairs
- Average time between repeat visits
- Revenue per customer over time
- Channel split: do walk-ins repeat more than mail-ins? Do corporate clients have higher LTV?
- From Intercom: returning conversation rate for known customers

### S3: Competitor Benchmarking

This may require web research rather than API access:
- Identify top 5-10 Apple repair competitors in London
- Compare published pricing for common repairs (iPhone screen, MacBook screen, battery)
- Compare published turnaround times
- Compare Google review ratings and volume
- Note any services competitors offer that iCorrect doesn't
- Note any positioning differences (specialist vs generalist, walk-in vs mail-in focus)

### S4: Physical Space and Capacity

From Monday data and team research:
- 8 workstations: current utilisation rate (items in progress vs capacity)
- Whether workstation assignment is tracked in Monday
- Peak concurrent repairs in progress
- Whether physical capacity is a constraint or if the bottleneck is elsewhere (people, parts, customer approval)

### S5: Shipping and Logistics Economics

- Royal Mail: cost per shipment from dispatch logs or Xero
- Courier costs from Xero (Stuart Couriers already visible in Xero contacts)
- Average shipping cost as percentage of mail-in repair value
- Return shipping costs and who bears them
- Whether current logistics model is optimal or if alternatives exist

---

## Output Format

For each track, produce:
1. A dedicated markdown file in this audit directory (e.g., `marketing-analysis.md`, `staff-performance.md`, `monday-updates-analysis.md`)
2. Raw data exports in `/home/ricky/data/exports/system-audit-2026-03-31/` under appropriate subdirectories
3. Key findings added to `findings.md` following the existing severity/category/evidence format
4. Any new open questions added to `open_questions.md`
5. Update `NEXT-STEPS-TODO.md` with completed and remaining items

---

## Credential Reference

All credentials are in `/home/ricky/config/api-keys/.env`. Source it before API calls.

Key gotchas:
- **PostHog**: US endpoint only (`us.posthog.com`), project `296651`
- **GA4**: use `EDGE_GOOGLE_REFRESH_TOKEN` with `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, property `353983768`
- **Search Console**: use `EDGE_GOOGLE_REFRESH_TOKEN`, site `https://www.icorrect.co.uk/` (URL-encode in API calls)
- **Meta**: `META_ACCESS_TOKEN` is live, ad account `act_513485772889925`, page `1768980250003769`
- **Monday**: `MONDAY_APP_TOKEN`
- **Shopify**: `SHOPIFY_ACCESS_TOKEN`, store `i-correct-final.myshopify.com`
- **Xero**: use `xero_refresh.sh` to get access token; remember to save new refresh token back to `.env`
- **Two .env files exist**: `config/.env` and `config/api-keys/.env`. The canonical source is `config/api-keys/.env`. Some tokens in `config/.env` are stale (Typeform, SumUp, Google).

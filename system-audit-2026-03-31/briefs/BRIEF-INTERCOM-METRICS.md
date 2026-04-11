# Brief: Intercom Full Metrics Deep Dive

## Objective

Pull comprehensive Intercom conversation and support metrics for the last 6 months. Build a complete picture of response times, resolution rates, conversation volumes by channel/source, team performance, and identify where customer service is leaking revenue or causing churn.

## Data Sources

### Intercom
- Use Intercom REST API v2
- Credentials: `INTERCOM_TOKEN` from `/home/ricky/config/api-keys/.env`
- Base URL: `https://api.intercom.io`

### Previous Research
- Read `/home/ricky/builds/system-audit-2026-03-31/intercom-metrics-deep.md` for what was already captured (sample data only)
- The earlier audit confirmed: 1 Support team (round_robin), 3 admins, AI-routed conversations, Help Center with `website_turned_on=false`

## Analysis

### 1. Conversation Volume
- Total conversations per month for the last 6 months
- Breakdown by source/channel: web messenger, email, phone (if logged), social
- Breakdown by type: customer-initiated vs company-initiated vs bot
- Daily/hourly volume patterns (when do customers reach out most?)
- Use `conversations/search` with date filters. Page through all results.

### 2. Response Times
- First response time: median, p75, p90 per month
- Subsequent response times
- Time to close/resolve: median, p75, p90 per month
- Response time by admin/team member
- Response time by day of week and hour
- Use conversation `statistics` object where available, or calculate from conversation parts timestamps

### 3. Resolution & Outcomes
- Conversations closed vs still open per month
- Conversations with customer rating (if CSAT is enabled)
- Conversations that required escalation or reassignment
- Conversations where customer went silent (no reply after agent response, >7 days)
- Conversations reopened (indicator of poor first resolution)

### 4. Team Performance
- Conversations handled per admin
- Response time per admin
- Resolution rate per admin
- Customer satisfaction per admin (if available)

### 5. AI/Bot Performance
- Conversations handled entirely by AI/bot
- Conversations escalated from AI to human
- AI resolution rate
- Common AI handoff triggers

### 6. Revenue Impact Signals
- Conversations mentioning: refund, complaint, unhappy, waiting, slow, cancel, return
- Conversations where customer asked about pricing/quote and no follow-up happened
- Long-open conversations (>7 days) with no resolution
- Customers who had multiple conversations (repeat contact = potential issue)

### 7. Contact/Ticket Analysis
- Use `contacts/search` to get total contact count
- Use `tickets/search` if ticket types are configured
- Identify contact creation rate over time

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/intercom-full-metrics.md`:

### Section 1: Volume Overview
Monthly conversation counts, source breakdown, trend

### Section 2: Response Time Analysis
Tables with median/p75/p90 by month, by admin, by day-of-week

### Section 3: Resolution Metrics
Close rates, reopen rates, silent-customer rates, time-to-resolve

### Section 4: Team Performance
Per-admin breakdown with volume, speed, and resolution

### Section 5: AI/Bot Analysis
Bot volume, escalation rate, resolution rate

### Section 6: Revenue Risk Signals
Flagged conversations and patterns that suggest revenue leakage

### Section 7: Recommendations
- Specific response time targets based on current performance
- Coverage gaps (hours/days with poor response)
- Process improvements to reduce repeat contacts
- Whether to activate the Help Center

## Constraints

- Read-only. Do not send any messages, close any conversations, or modify any contacts.
- Respect Intercom rate limits (handle 429 responses with backoff).
- If certain API endpoints return errors or are version-blocked, document what failed and work with what's available.

When completely finished, run:
openclaw system event --text "Done: Intercom full metrics deep dive complete - written to intercom-full-metrics.md" --mode now

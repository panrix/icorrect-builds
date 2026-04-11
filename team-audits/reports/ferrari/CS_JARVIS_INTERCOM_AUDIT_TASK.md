# Task: Weekly Intercom Audit — Ferrari Client Activity

## For: CS Jarvis
## Priority: HIGH — Action immediately
## Created: 2026-02-26

---

## Objective

Produce a complete, verifiable audit of all Intercom activity for the week **18–25 February 2026** that relates to Ferrari's client services role. The goal is to answer one question: **does the Intercom data support 18+ hours/week of "Clients" work logged on Monday.com?**

---

## Context

Ferrari logs 3–4.2 hours/day under "Clients" on his Monday board (18393875720). A preliminary audit using MCP tools found only ~8 manually composed emails across 4 conversations for the entire week (~28 min of composition time). However, MCP search has limitations — you have direct API access and can do a comprehensive pull.

Ferrari operates as admin ID **9702337** ("Support", admin@icorrect.co.uk). He shares this account — there is no individual admin account for him.

Bot ID **9702338** ("Alex") is automation — exclude from human activity counts.

---

## Step 1: Count ALL Admin-Authored Messages (18–25 Feb)

Query the Intercom API for every conversation part where `author.type = "admin"` and `author.id = 9702337` between 18–25 Feb 2026.

For each message found, record:
- Conversation ID
- Timestamp
- Recipient (customer name/email)
- Subject or first line of content
- `app_package_code` value (if present)

### Separate into two buckets:

**MANUAL (Ferrari's actual work):**
- Messages with NO `app_package_code`, or with a code that is NOT `n8n-automations-nkor`
- These are emails Ferrari typed and sent himself

**AUTOMATED (n8n):**
- Messages where `app_package_code = "n8n-automations-nkor"`
- These are triggered by workflows: device received, repair complete, collection ready, courier booked, typeform logging
- Do NOT count these as Ferrari's work

### Output a table:

```
| # | Date | Time | Conversation | Customer | Subject/Summary | Manual or Auto | Est. Minutes |
```

Estimate composition time for each manual email:
- Short reply (1-2 sentences): 2 min
- Quote with pricing/details: 5 min
- Detailed diagnostic/technical email: 5-10 min
- Simple confirmation: 1 min

**Sum total estimated manual composition time for the week.**

---

## Step 2: Inbound Enquiry Response Audit (18–25 Feb)

Pull all conversations where:
- Source type = email
- Created between 18–25 Feb
- Author is contact `michael.f@icorrect.co.uk` (ID: `69666e7097ed49be200c1b50`) OR any new inbound email enquiry

These are contact form submissions that come in via n8n. They represent potential customers.

For each inbound enquiry, record:
- Conversation ID
- Customer name and email
- Created timestamp
- `read` status (true/false)
- `first_admin_reply_at` (timestamp or null)
- Time to first admin reply (if replied)
- Current state (open/closed/snoozed)
- Whether Fin AI handled it (check for bot participant)
- Fin resolution type if applicable (Assumed Resolution / Confirmed Resolution / Routed to team)

### Output a table:

```
| # | Customer | Created | Read? | Admin Replied? | Reply Time | State | Fin Handled? | Fin Resolution |
```

### Calculate:
- Total inbound enquiries
- % read
- % replied to by human
- Average response time (for those replied to)
- % still open and unread (these are lost leads)

---

## Step 3: Fin AI Health Check

Pull all conversations from 18–25 Feb where the bot (ID 9702338, "Alex") participated.

For each:
- Was it resolved by Fin? (check conversation tags or state)
- Resolution type: "Assumed Resolution" vs "Confirmed Resolution"
- If "Routed to team" — is it still open? Did anyone action it?

### Calculate:
- Total Fin conversations
- Assumed Resolution count and %
- Confirmed Resolution count and %
- Routed to team count
- Routed but still open (unactioned) count and %

**Flag if >50% of resolutions are "Assumed" — means nobody is reviewing Fin's work.**

---

## Step 4: Conversion Funnel

Search for conversations tagged `create-repair` in the period. These represent confirmed bookings.

Count:
- Enquiries received (Step 2 total)
- Quotes sent (admin-initiated conversations containing pricing — look for £ symbol or "quote" in admin messages)
- Bookings confirmed (`create-repair` tag)
- Conversion rate: bookings / enquiries

---

## Step 5: Unread/Unanswered Backlog

Not just this week — pull the CURRENT state of the inbox:
- How many open conversations are assigned to admin 9702337 or team 9725695?
- How many are unread?
- What's the oldest unread conversation? (Date and customer name)

This tells us the size of the backlog Ferrari should be working through.

---

## Output Format

Save to: `/Users/icorrect/Projects/Monday KPIs/Team Reports/ferrari_intercom_audit_2026-02-26.md`

Structure:

```markdown
# Ferrari — Intercom Activity Audit
## Period: 18–25 February 2026
## Generated: [timestamp]
## Data Source: Intercom API (direct)

### 1. Manual vs Automated Email Summary
[Table from Step 1]
**Total manual emails: X**
**Estimated manual composition time: X minutes**

### 2. Inbound Enquiry Response Rate
[Table from Step 2]
**Enquiries: X | Replied: X (Y%) | Unread: X (Y%)**
**Average response time: X hours**

### 3. Fin AI Health
[Stats from Step 3]

### 4. Conversion Funnel
Enquiries → Quotes → Bookings → Rate

### 5. Current Inbox Backlog
Open: X | Unread: X | Oldest unread: [date]

### 6. Key Finding
[One paragraph: does the Intercom data support 18h/week of client work?]
Compare: Monday logged "Clients" hours = ~18h 21m vs Intercom verified manual work = X minutes

### 7. Data Notes
- Admin 9702337 is a shared account — cannot guarantee all activity is Ferrari's
- Phone calls not captured in Intercom unless followed up with email
- Only email channel audited — if live chat or other channels are active, note them
```

---

## Important Notes

- Do NOT modify any conversations, tags, or assignments
- Do NOT contact Ferrari or any customers
- Do NOT send results to anyone — save the file only. Ricky will review.
- If you find activity from OTHER admins using the 9702337 account, note it — this would mean some "Support" messages aren't Ferrari's
- Be precise with timestamps — use GMT (London time) since that's Ferrari's working timezone (8:30am–6pm GMT)
- If the API rate limits you, paginate properly. Get ALL data, not just the first page.

---

*Task created by Claude Code on behalf of Ricky Panesar, 2026-02-26*

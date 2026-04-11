# Spam Audit — 2026-04-11

## Sample

- 100 unique Intercom conversations (200 records with duplicates from open+closed overlap)
- Mix of open and closed conversations
- Pulled via live Intercom API using repo's own client

## Results

| Metric | Count |
|---|---|
| Total unique conversations | 100 |
| Spam | 5 |
| Legitimate | 95 |
| Missed spam (filter said actionable) | 1 |
| Legitimate blocked as non-actionable | 61 |

### Spam rate: 5% of sample

### Current filter effectiveness
- Caught: 4/5 spam (80%)
- Missed: 1/5 spam (20%)
- The 61 "blocked legitimate" are conversations where the last message is from admin (iCorrect already replied). This is correct behaviour, not false positives.

## Spam Breakdown by Type

| Category | Count | Caught | Missed |
|---|---|---|---|
| seo_pitch | 1 | 0 | 1 |
| automated_notification | 3 | 3 | 0 |
| cold_outreach | 1 | 1 | 0 |

## The Miss: SEO Pitch

**Conversation 215473865619328** (Steve Stoce, steve.itservices0150@hotmail.com)
- Subject: "Budget Planning 📘" (deceptive subject designed to pass filters)
- Content: "Your website has several SEO and technical errors that may be affecting its ranking. I have an audit report"
- Why missed: the current filter checks for "seo service" but this phrasing uses "SEO and technical errors" instead. The subject line is deliberately misleading.

This is the exact conversation that triggered this audit after it appeared as a live triage card.

## Current Filter Analysis

The filter in `lib/triage.js` (`isActionableConversation`) uses:
1. Tag check: `spam-auto-closed` tag
2. Sender email patterns: `sales@`, `marketing@`, `noreply@`, `no-reply@`, `newsletter@`, `info@` (non-iCorrect)
3. Sender name patterns: "marketing"
4. Content keyword denylist: 22 fixed phrases
5. Last-message-from-admin check (blocks admin-replied threads)

### What works
- Catches obvious marketing language ("partnership opportunity", "free demo", "boost your")
- Catches automated notification noise from internal systems
- Admin-replied filtering correctly excludes already-handled conversations

### What doesn't work
- No pattern for "SEO errors/audit" phrasing (only "seo service")
- No detection of deceptive subjects (emoji-laden business subjects hiding spam content)
- No sender reputation: first-time senders with no repair history get same treatment as returning customers
- No link density analysis: spam emails typically have high link-to-text ratio
- No repair-intent positive signal: the filter only looks for negatives (spam patterns) but never confirms the message is actually about device repair
- Keyword list is static and brittle: every new spam phrasing requires a code change

## False Positive Risk

Low. The current filter is conservative: it blocks only on explicit spam signals. The 61 "blocked legitimate" conversations are correctly filtered (last message from admin). No evidence of real repair enquiries being incorrectly classified as spam.

## Conclusion

The filter catches most obvious spam but is brittle against:
1. Paraphrased marketing language (SEO pitch without saying "SEO service")
2. Deceptive subject lines
3. Novel cold outreach patterns

The 5% spam rate in a 100-conversation sample means roughly 1-2 spam cards per day will leak through during normal operations. Each one wastes reviewer attention.

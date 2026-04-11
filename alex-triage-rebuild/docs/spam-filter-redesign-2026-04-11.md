# Spam Filter Redesign Spec — 2026-04-11

## Problem

The current spam filter is a static keyword denylist. It catches 80% of spam but misses paraphrased marketing, deceptive subjects, and novel cold outreach. Every new spam pattern requires a code change.

## Options Evaluated

### 1. Expanded keyword list
- Pros: zero latency, zero cost, easy to implement
- Cons: still brittle, needs manual updates for every new pattern, will always lag behind spammers
- Verdict: necessary but insufficient alone

### 2. Sender reputation signals
- Pros: catches first-contact cold outreach regardless of content, no API cost
- Cons: would block legitimate first-time repair enquiries without additional signals
- Verdict: useful as a scoring input, not as a standalone gate

### 3. Content heuristics (scoring model)
- Pros: catches paraphrased spam, adapts to novel patterns when combined with positive repair-intent signals
- Cons: more complex, needs tuning, risk of false positives on edge cases
- Verdict: best balance of coverage and cost

### 4. Lightweight LLM classification
- Pros: highest accuracy, handles novel patterns, can explain decisions
- Cons: adds latency (1-3s per conversation), adds cost (~$0.001 per classification at Qwen rates), another API dependency
- Verdict: overkill for current volume; revisit if heuristic approach proves insufficient

## Recommended Approach: Layered Heuristic Scoring

Three layers, evaluated in order. Each returns a spam score 0-100. If combined score exceeds threshold (default 60), mark as spam.

### Layer 1: Expanded pattern denylist (quick reject)
Add to current `spamPatterns` in `isActionableConversation`:

```javascript
// SEO variations
() => combinedText.includes("seo error"),
() => combinedText.includes("seo audit"),
() => combinedText.includes("technical errors") && combinedText.includes("ranking"),
() => combinedText.includes("audit report") && combinedText.includes("website"),
() => combinedText.includes("domain authority"),
() => combinedText.includes("backlinks"),
() => combinedText.includes("search engine"),
() => combinedText.includes("google ranking"),
() => combinedText.includes("page speed"),
() => combinedText.includes("web traffic"),
// Recruitment/staffing spam
() => combinedText.includes("recruitment agency"),
() => combinedText.includes("staffing solution"),
() => combinedText.includes("hire developers"),
// IT services spam
() => combinedText.includes("it services") && !combinedText.includes("repair"),
() => combinedText.includes("managed services"),
() => combinedText.includes("cloud migration"),
// Follow-up spam (persistent cold emailers)
() => combinedText.includes("still waiting for your reply") && combinedText.includes("website"),
() => combinedText.includes("following up") && (combinedText.includes("proposal") || combinedText.includes("offer")),
```

### Layer 2: Sender reputation scoring
New function `scoreSenderReputation(conversation, existingConversations)`:

| Signal | Score |
|---|---|
| Sender has no prior conversations in DB | +15 |
| Sender email is freemail (hotmail, gmail etc) AND subject contains business/marketing terms | +10 |
| Sender domain matches known spam TLDs (.xyz, .top, .click, .buzz) | +20 |
| Subject contains emoji (common in spam subject lines) | +5 |
| Subject is generic business term with no device/repair mention | +10 |

### Layer 3: Content heuristics scoring
New function `scoreContentSpam(messages)`:

| Signal | Score |
|---|---|
| No device mention (iPhone, iPad, Mac, Watch, Apple) anywhere in thread | +20 |
| No repair-intent keywords (fix, repair, broken, screen, battery, charging, etc.) | +15 |
| High link density (>2 links per message) | +10 |
| Marketing vocabulary density (>3 marketing terms per message) | +10 |
| Thread has only 1-2 messages from sender (typical of cold outreach) | +5 |
| Message length >500 chars with no repair context | +5 |

### Threshold Logic

```javascript
function isLikelySpam(conversation, messages, existingConversations) {
  // Quick reject: existing denylist patterns
  if (matchesDenylist(conversation, messages)) return true;
  
  const senderScore = scoreSenderReputation(conversation, existingConversations);
  const contentScore = scoreContentSpam(messages);
  const totalScore = senderScore + contentScore;
  
  // Hard threshold
  if (totalScore >= 60) return true;
  
  // Soft threshold: flag for review but don't auto-exclude
  // (future: could add a "suspected spam" label to triage card)
  return false;
}
```

## Code Changes Required

All changes in `lib/triage.js`:

1. Add new spam patterns to `spamPatterns` array in `isActionableConversation`
2. Add `scoreSenderReputation(conversation)` function
3. Add `scoreContentSpam(messages)` function  
4. Add `isLikelySpam(conversation, messages)` orchestrator function
5. Update `isActionableConversation` to call `isLikelySpam` before the existing checks
6. Add repair-intent positive word list as a constant

No changes to other files. No new dependencies.

## Test Fixtures to Add

Add to `docs/validation/email-triage-fixtures.json`:

1. **seo-pitch-paraphrased**: SEO spam using "errors" and "ranking" instead of "SEO service"
2. **deceptive-subject-spam**: Business-looking subject hiding marketing content
3. **cold-outreach-followup**: "Still waiting for your reply" + non-repair content  
4. **first-contact-repair**: New customer, first email, legitimate repair enquiry (must NOT be blocked)
5. **business-domain-repair**: Business email domain with genuine repair request (must NOT be blocked)
6. **freemail-legitimate**: Hotmail/Gmail sender with genuine repair enquiry (must NOT be blocked)

## Rollout

1. Implement the expanded denylist first (immediate coverage)
2. Add scoring functions with logging only (shadow mode for 1 week)
3. Review shadow-mode results for false positive rate
4. Enable scoring-based blocking after validation

## Future: LLM Fallback

If the heuristic approach still misses >5% of spam after 2 weeks, add a lightweight LLM classifier as a final layer:
- Only invoked when heuristic score is 30-59 (ambiguous zone)
- Use cheapest available model (Qwen at ~$0.001/call)
- Cache results by conversation ID
- This keeps LLM cost near zero for obvious spam/legitimate and only uses it for edge cases

# 2026 Intercom Spam Audit Summary

Generated: 2026-04-21T01:14:45.714Z

## Scope

- Workspace: `pt6lwaq6`
- Conversation window: created_at >= 2026-01-01T00:00:00Z
- Conversations fetched: 2060
- Observed date range: 2026-01-01T00:19:21.000Z to 2026-04-20T22:56:43.000Z

## Breakdown

- real: 492 (23.9%)
- automated: 635 (30.8%)
- spam: 183 (8.9%)
- unclear: 750 (36.4%)

## Classification Mechanics

- Deterministic first-pass classifications: 1134
- LLM classifications: 926
- LLM fallback-to-unclear classifications: 0
- LLM batches attempted: 39
- LLM batch failures after retry: 0
- Budget cap hit: no
- LLM status note: completed normally

## Cost

- Model: `claude-sonnet-4-20250514`
- Estimated Anthropic cost: £1.0579
- Usage: input 266148, cache write 0, cache read 0, output 36041

## Decisions Made

- The referenced brief file was missing from the workspace, so the task prompt itself was treated as the authoritative instruction set.
- Intercom search results were used as the sole conversation source because the safety contract forbids mutating calls and the search payload already contains the source body, sender, and tags.
- Conversation parts were not available in `/conversations/search` results, so the audit classified on the source message only.
- Empty-body conversations were forced to `unclear` unless another deterministic automated rule matched first.

## Safety Audit

- Intercom HTTP calls observed: 42
- Unique Intercom call shapes: POST /conversations/search
- Non-search Intercom calls observed: no
- Non-POST Intercom calls observed: no

## Unresolved Ambiguities

- Some conversations that look like vague business outreach versus genuine B2B enquiries remain subjective; these are the main source of `unclear` classifications.
- Without conversation parts, follow-up context inside longer threads may be missing from a small subset of classifications.

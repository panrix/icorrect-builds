# QA Prompt: Trusted Buyback Buying Product Rebuild Plan

Use this prompt to have another agent QA the rebuild plan against the real
repo before implementation starts.

```text
You are doing an implementation QA review of a rebuild plan for a Back Market buyback buying product.

Project root:
`/home/ricky/builds/buyback-monitor`

Primary plan to review:
`/home/ricky/builds/buyback-monitor/docs/TRUSTED-BUYBACK-BUYING-PRODUCT-REBUILD-PLAN.md`

Review style references:
- `/home/ricky/QA-PLAN-REVIEW-TEMPLATE.md`
- `/home/ricky/QA-PLAN-REVIEW-HARSH.md`

Current implementation context to inspect:
- `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`
- `/home/ricky/builds/buyback-monitor/run_price_pipeline.py`
- `/home/ricky/builds/buyback-monitor/sell_price_scraper_v7.js`
- `/home/ricky/builds/buyback-monitor/generate_sell_lookup.py`
- `/home/ricky/builds/buyback-monitor/build_cost_matrix.py`
- `/home/ricky/builds/buyback-monitor/pull_parts_data_v3.py`
- `/home/ricky/builds/buyback-monitor/sync_tradein_orders.py`

Supporting docs to inspect:
- `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`
- `/home/ricky/builds/buyback-monitor/docs/V2-V3-ROADMAP.md`
- `/home/ricky/builds/buyback-monitor/docs/BUY-BOX-MONITOR-CRITIQUE.md`

Your task:
Review `TRUSTED-BUYBACK-BUYING-PRODUCT-REBUILD-PLAN.md` critically against the actual repo state and current implementation.

This is not a summary task.
Do not restate the plan unless necessary to explain a flaw.

Review it as if implementation is about to start and your job is to stop wasted engineering time by finding:
- wrong assumptions
- missing contracts
- hidden dependencies
- fake certainty
- vague interfaces
- discovery work disguised as implementation
- unsafe defaults
- unrealistic sequencing
- test gaps
- operational risks
- scope that still needs cutting

What to evaluate:

1. Feasibility
- Is each subsystem in the plan implementable from the current repo and available assets?
- Does the plan assume capabilities that do not yet exist in the current scripts or datasets?
- Is scraper v7 actually structured strongly enough to serve as the canonical sell-price source?
- Is the proposed canonical SKU/spec normalization realistically derivable from current buyback SKUs and existing data?

2. Sequencing and dependencies
- Is the proposed build order correct?
- Should any data-contract or normalization work happen before Postgres schema or engine work?
- Are there hidden dependencies between scraper output shape, cost lookup generation, buyback listing parsing, and execution safety?
- Is anything discovery-heavy being treated like routine implementation?

3. Current-code alignment
- Compare the rebuild plan against the current behavior in:
  - `buy_box_monitor.py`
  - `run_price_pipeline.py`
  - `generate_sell_lookup.py`
  - `build_cost_matrix.py`
- Identify where the plan correctly reflects current weaknesses and where it misses reality.
- Call out any mismatch between the plan and actual script I/O, file paths, data contracts, CLI behavior, or active producers.

4. Architectural sharpness
- Are the proposed interfaces concrete enough to implement without guesswork?
- Are the Postgres tables and module boundaries sufficient, or still too conceptual?
- Are freshness, confidence, fallback, and blocking rules explicit enough for code?
- Are execution, idempotency, and rerun behavior defined well enough?

5. Validation rigor
- Would the proposed tests catch the likely failures?
- What tests are missing before this should control live bids?
- Are acceptance criteria measurable, or still vague?
- Is “shadow mode” defined well enough to validate the new engine safely?

6. Risk assessment
- Rank the riskiest items.
- Separate straightforward engineering from research/discovery.
- Be explicit about what could stall delivery.
- Call out where the plan is likely underestimating parser complexity, scraper normalization, or fallback ambiguity.

7. Scope discipline
- Is anything over-scoped for the first real implementation pass?
- Should some items be split into “ship now” versus “investigate first”?
- Are there areas where the boring reliable version should replace the ambitious version?
- Is full-auto in v1 realistic, or should the plan force a narrower first cut?

Specific questions I want answered:
- Is `sell_price_scraper_v7.js` genuinely strong enough to be the canonical pricing source, or is that still an optimistic assumption?
- Is `Fair for everything` a safe conservative rule, or are there cases where it still creates false confidence?
- Is `same model + lower spec fallback` defined tightly enough to implement safely with the current data?
- Is excluding stuck-device and cancellation economics from live bidding in v1 a safe scope cut, or a dangerous omission?
- Are the proposed Postgres contracts and module boundaries implementation-ready, or still underspecified?
- What is the minimum execution slice you would actually allow a team to build first?

Known hypotheses you should verify rather than blindly accept:
- Current useful scripts can be reused as input producers without dragging current architectural problems into the rebuild.
- Buyback SKU parsing can be made deterministic enough for a canonical internal spec key.
- Existing cost data is good enough to support confident `CostFact` generation.
- The current repo contains enough real data shape to implement lower-spec fallback without extensive new research.
- Daily batch is sufficient for the business and does not invalidate the decision model.
- Full-auto can be made safe in v1 if the plan’s block conditions are implemented strictly.

Rules:
- Be blunt.
- Ground claims in the actual files.
- Cite concrete file paths and line references where useful.
- If something is underspecified, do not fill in the blanks charitably. Call it out.
- If a fallback path is mentioned, judge whether it is actually implementable with the current repo and tools.
- If a recommendation changes execution order, say so explicitly.
- If some part of the plan is solid, say so briefly and move on.

Deliverable format:
1. Findings
- Ordered by severity.
- For each finding include:
  - Severity: critical / high / medium / low
  - What is wrong
  - Why it matters
  - Evidence from repo/plan
  - Recommended fix

2. What a weaker first-pass QA might miss
- Only include points that go beyond a normal shallow review.

3. Required plan changes
- List the minimum edits needed before implementation is safe to start.

4. Recommended revised execution order
- Give the concrete sequence you would actually allow a team to follow.
- Split into practical batches if that is safer than the current phase layout.

5. Go / no-go assessment
- State whether `TRUSTED-BUYBACK-BUYING-PRODUCT-REBUILD-PLAN.md` is ready for execution as written.
- If not, state the minimum changes needed before execution.

Review style:
- Findings first.
- No fluff.
- No generic summary.
- Optimize for preventing wasted engineering time.
```

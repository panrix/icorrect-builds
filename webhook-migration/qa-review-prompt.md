# Webhook Migration QA Review Prompt

Use this prompt to QA `/home/ricky/builds/webhook-migration/plan.md` against the actual code/docs before implementation starts.

```text
You are doing a hard-nosed implementation QA review of a build plan. Use the normal findings-first QA structure, but review with the attitude of a harsh senior engineer trying to stop a team from wasting time on a plan that still has hidden unknowns.

This is not a summary task. Review the plan against the actual repo/files and pressure-test whether execution is realistically safe to start.

Workspace root:
`/home/ricky`

Primary plan to review:
`/home/ricky/builds/webhook-migration/plan.md`

Current implementation and reference files you must inspect:
- `/home/ricky/builds/backmarket/services/bm-shipping/index.js`
- `/home/ricky/builds/backmarket/services/bm-shipping/bm-shipping.service`
- `/home/ricky/builds/telephone-inbound/server.py`
- `/home/ricky/builds/icorrect-shopify-theme/assets/contact-form-interceptor.js`
- `/home/ricky/builds/icorrect-shopify-theme/sections/quote-wizard.liquid`
- `/home/ricky/builds/server-config/nginx-mission-control.conf`
- `/home/ricky/builds/monday/icorrect-status-notification-documentation.md`

Supporting docs you must inspect:
- `/home/ricky/mission-control-v2/docs/integrations/n8n-intercom-monday-flows.md`
- `/home/ricky/mission-control-v2/docs/intercom/intercom-audit-2026-02.md`

Repo/context facts to keep in mind:
- The plan spans multiple code locations, not one isolated service.
- Some claimed source-of-truth behavior is documented in local markdown, not yet exported live workflow JSON.
- The plan explicitly says it is only “Approved for Phase 0 discovery”, so treat any later implementation phase as provisional unless Phase 0 actually resolves its blockers.
- The current Shopify form path points at n8n Cloud, and the plan proposes cutover to VPS-hosted Express services.
- The current Monday notification migration depends on live webhook destination discovery and live Intercom API behavior that the repo does not fully prove today.

Your task:
Review `/home/ricky/builds/webhook-migration/plan.md` critically against the actual repo state and implementation. Do not just restate the plan. QA it as if coding is about to begin tomorrow and you want to catch wrong assumptions, missing dependencies, vague contracts, operational gaps, sequencing mistakes, unsafe cutover logic, and fake certainty.

What to evaluate:
1. Feasibility
- Is each phase implementable from the current repo and referenced assets?
- Does the plan rely on capabilities that are only assumed, documented second-hand, or still require live discovery?
- Are any steps written like routine engineering even though they are actually research/spike work?

2. Sequencing and dependency honesty
- Is the execution order correct?
- Are discovery tasks isolated early enough?
- Are later build/cutover steps pretending they are ready before live exports/API proofs exist?
- Does the cutover order create downtime, duplicate sends, or rollback gaps?

3. Current-code alignment
- Compare the plan to the actual existing code and docs.
- Validate whether the claimed reuse points are real:
  - Express immediate-200 webhook pattern from `bm-shipping`
  - systemd `EnvironmentFile=/home/ricky/config/.env` pattern
  - Intercom token fallback pattern in `telephone-inbound/server.py`
  - Shopify form/browser timeout and error contract from `contact-form-interceptor.js` and `quote-wizard.liquid`
  - Monday status notification routing/templates from `icorrect-status-notification-documentation.md`
- Call out where the plan misstates current behavior, misses constraints, or uses the wrong source of truth.

4. Contract sharpness
- Are the inbound request contracts explicit enough for both webhook services?
- Are Intercom write payloads, fallback behavior, and returned browser error semantics defined well enough to implement without guesswork?
- Are CORS, auth, health checks, env vars, nginx routing, and async failure handling specified clearly enough?
- If something is underspecified, treat that as a flaw. Do not fill in blanks charitably.

5. Validation strategy
- Would the proposed verification steps actually catch the likely failures?
- What tests/smoke tests/acceptance criteria are missing?
- Are there places where “got 200” is being confused with “the right side effect happened”?
- Are shadow mode, parity checks, and post-cutover monitoring rigorous enough?

6. Operational and delivery risk
- Rank the riskiest items.
- Separate straightforward implementation from discovery-heavy or externally dependent work.
- Identify where this plan is most likely to cause thrash, duplicate messages, silent drops, bad attribution in Intercom, or broken storefront UX.

7. Scope control
- Is anything over-scoped for one execution pass?
- What should be split into “ship now” vs “investigate first”?
- Where should the boring reliable option be preferred over the more ambitious option?

Specific questions I want answered:
- Is the plan too confident about porting the Monday notification logic before the live n8n exports in Phase 0c actually exist?
- Is the “no parallel live sending” cutover for status notifications operationally safe, or does it create unnecessary delivery risk without replay/retry?
- Does the contact-form service have a sufficiently explicit request/response contract to preserve current browser behavior for all three sources?
- Are the rollback paths real, concrete, and fast for both the Monday notification flow and the Shopify form flow?
- Which exact phases or substeps should be reclassified from “implementation” to “discovery/spike” before execution starts?

Specific things to challenge hard:
- Undefined output contracts
- Vague acceptance criteria
- Reliance on markdown docs where live workflow exports should be the real source of truth
- Assumptions about Intercom Conversations API support
- Assumptions that Monday automation IDs are dead and safe to disable
- Any place the plan assumes nginx/systemd/env/CORS details will “just work”
- Any silent-failure design where Monday gets a 200 but work is then lost
- Any fallback path that sounds plausible but is not actually proven from the current repo/docs

Known hypotheses you must verify rather than accept:
- The local status notification documentation is accurate enough to port all 14 routes/templates safely before live workflow export.
- `POST /conversations` on behalf of a user will work for the Shopify contact/quote flows; otherwise the Tickets fallback is sufficient and equally compatible with current UX.
- Copying the `bm-shipping` service pattern is enough for both new services without hidden ingress/auth/ops differences.
- The current browser clients only require 2xx + JSON `{success:true}` / `{success:false,error}` and no other response semantics.
- The two Monday automation IDs in the plan are dead or disposable once destination proof is gathered.

Rules:
- Be blunt.
- Ground claims in the actual files.
- Cite concrete file paths and line references where useful.
- Findings first. No long generic summary.
- If something is unclear, say exactly what is unclear and why it matters.
- If a recommendation changes sequencing, say so explicitly.
- If an area is solid, say so briefly and move on.

Deliverable format:
1. Findings
- Ordered by severity.
- For each finding include:
  - Severity: critical / high / medium / low
  - What is wrong
  - Why it matters
  - Evidence from repo/plan
  - Recommended fix before implementation starts

2. What a weaker first-pass reviewer might miss
- Only include genuinely second-pass observations: fake certainty, hidden complexity, bad defaults, weak rollback, vague contracts, unproven fallbacks.

3. Open questions / assumptions
- Only include questions that materially affect execution.

4. Required plan changes
- Minimum edits needed before the plan is safe to execute.

5. Recommended revised execution order
- Give the concrete build/cutover order you would actually permit.
- Split into practical batches if that is safer than the current phase layout.

6. Final assessment
- One of:
  - Ready to execute
  - Ready after minor edits
  - Not ready
- Defend that judgment briefly and directly.

Review style:
- Direct.
- Findings first.
- No fluff.
- Optimize for preventing wasted engineering time.
```

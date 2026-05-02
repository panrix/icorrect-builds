# Website Conversion SPEC

## 1) Problem Statement

Website traffic is adequate, but conversion is constrained by large funnel leaks before checkout. Collection and product journeys currently underperform expected UX standards, especially on mobile.

## 2) Business Case and Metrics

Primary objective: improve conversion from current baseline toward 1% then 2%.

Key funnel metrics:
- Collection -> product click-through.
- Product -> add-to-cart rate.
- Checkout completion.
- Dead-click and rage-click reduction on key templates.

## 3) Scope

### In Scope
- Collection page conversion fixes.
- Mobile interaction quality improvements.
- Trust/urgency cues on product pages.
- Instrumented measurement plan for rollout validation.

### Out of Scope
- Full site redesign.
- Traffic acquisition strategy changes.
- Platform migration away from Shopify.

## 4) Consolidated Findings

Source audits point to:
- Large drop-off between collection and product views.
- Significant dead-click concentration on collection and CTA-adjacent elements.
- Product pages lacking trust/urgency reinforcement.
- Mobile tap target and responsiveness feedback issues.

## 5) Recommended Fix Set (Consolidated)

Priority fixes:
1. Add clearer price anchors ("from £X") in collection cards.
2. Make collection cards fully clickable with clear interaction feedback.
3. Improve model-selection pages with clearer pricing/repair context.
4. Add trust strip near booking CTAs on product pages.
5. Increase tap target reliability for FAQ/interactive rows.
6. Add model-identification helper content for uncertain users.

## 6) Implementation Guidance

- Apply changes in theme templates used by collection and product surfaces.
- Preserve SEO pathways and existing collection hierarchy intent.
- Roll out in measurable increments to isolate effect by change batch.

## 7) Measurement Plan

Before/after tracking in analytics:
- Collection exits.
- Product page views.
- Add-to-cart events.
- Dead/rage click density on edited templates.

Success criteria:
- Clear uplift in collection click-through.
- Clear uplift in product engagement and cart starts.

## 8) Risks and Dependencies

- Theme implementation quality and QA discipline.
- Existing JS-rendered elements that may delay visible interactivity.
- Need to avoid regressions in checkout flow while improving pre-checkout pages.

## 9) Open Questions

- Final copy/positioning for urgency and trust strips.
- Whether to enrich cards with dynamic repair counts in phase 1 or phase 2.
- Rollout sequencing with current paused theme-change governance.

## 10) Source Map

- `~/.openclaw/agents/website/workspace/docs/ux-audit-brief.md`
- `~/.openclaw/agents/website/workspace/docs/specs/collection-page-conversion-spec.md`
- `/home/ricky/.openclaw/agents/website/workspace/MEMORY.md`
# Website Conversion SPEC

## 1) Problem Statement

Website traffic is adequate, but conversion is constrained by large funnel leaks before checkout. Collection and product journeys currently underperform expected UX standards, especially on mobile.

## 2) Business Case and Metrics

Primary objective: improve conversion from current baseline toward 1% then 2%.

Key funnel metrics:
- Collection -> product click-through.
- Product -> add-to-cart rate.
- Checkout completion.
- Dead-click and rage-click reduction on key templates.

## 3) Scope

### In Scope
- Collection page conversion fixes.
- Mobile interaction quality improvements.
- Trust/urgency cues on product pages.
- Instrumented measurement plan for rollout validation.

### Out of Scope
- Full site redesign.
- Traffic acquisition strategy changes.
- Platform migration away from Shopify.

## 4) Consolidated Findings

Source audits point to:
- Large drop-off between collection and product views.
- Significant dead-click concentration on collection and CTA-adjacent elements.
- Product pages lacking trust/urgency reinforcement.
- Mobile tap target and responsiveness feedback issues.

## 5) Recommended Fix Set (Consolidated)

Priority fixes:
1. Add clearer price anchors ("from £X") in collection cards.
2. Make collection cards fully clickable with clear interaction feedback.
3. Improve model-selection pages with clearer pricing/repair context.
4. Add trust strip near booking CTAs on product pages.
5. Increase tap target reliability for FAQ/interactive rows.
6. Add model-identification helper content for uncertain users.

## 6) Implementation Guidance

- Apply changes in theme templates used by collection and product surfaces.
- Preserve SEO pathways and existing collection hierarchy intent.
- Roll out in measurable increments to isolate effect by change batch.

## 7) Measurement Plan

Before/after tracking in analytics:
- Collection exits.
- Product page views.
- Add-to-cart events.
- Dead/rage click density on edited templates.

Success criteria:
- Clear uplift in collection click-through.
- Clear uplift in product engagement and cart starts.

## 8) Risks and Dependencies

- Theme implementation quality and QA discipline.
- Existing JS-rendered elements that may delay visible interactivity.
- Need to avoid regressions in checkout flow while improving pre-checkout pages.

## 9) Open Questions

- Final copy/positioning for urgency and trust strips.
- Whether to enrich cards with dynamic repair counts in phase 1 or phase 2.
- Rollout sequencing with current paused theme-change governance.

## 10) Source Map

- `~/.openclaw/agents/website/workspace/docs/ux-audit-brief.md`
- `~/.openclaw/agents/website/workspace/docs/specs/collection-page-conversion-spec.md`
- `/home/ricky/.openclaw/agents/website/workspace/MEMORY.md`

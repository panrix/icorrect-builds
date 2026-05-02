# Intercom Agent SPEC

## 1) Problem Statement

Current Intercom behavior is inconsistent and underperforming:
- Fin guidance fixes were identified but not implemented.
- Fin engages where it should route or defer.
- Silent handoff patterns create poor customer experience.
- Intercom-to-Monday automation reliability is weak in known flows.

Goal: keep Intercom as front-end, replace/augment backend decisioning with a controlled agent service and auditable data model.

## 2) Business Case and Metrics

Expected outcomes:
- Higher conversion quality on real customer enquiries.
- Lower misrouting and reduced false-positive bot engagement.
- Better auditability and context continuity across Intercom/Monday.

Core success metrics:
- Fin/agent first-response correctness by conversation type.
- Route-to-human correctness for BM/high-risk cases.
- Intercom -> Monday sync success rate.
- Time-to-first-meaningful-response.
- Escalation quality (context completeness).

## 3) Scope

### In Scope
- Consolidated Intercom backend spec for intent classification, routing, escalation, and data logging.
- Supabase schema baseline for conversations, customers, pricing metadata, and activity logs.
- Monday integration policy for status and repair context.
- Phased migration approach with explicit cutover criteria.

### Out of Scope
- Front-end Intercom UI replacement.
- Unapproved direct customer-policy changes.
- Any production cutover without staged verification.

## 4) Consolidated Architecture

`Intercom UI -> webhook -> agent service -> Supabase + integrations (Monday/Intercom API/notifications)`

Key behaviors:
- Classify inbound intent.
- Route basic vs must-speak paths.
- Respond with grounded context where allowed.
- Escalate with complete summary where required.
- Persist conversation and decision trails.

## 5) Data Model (Supabase)

Consolidated core entities (from source spec/audits):
- `ic_devices`
- `ic_repairs`
- `ic_customers`
- `ic_conversations`
- `ic_spam_patterns`
- policy configuration in shared state table

Required characteristics:
- Contact identity linkage across Intercom and Monday.
- Conversation lifecycle status with explicit escalation states.
- Resolution outcome capture for audit and optimization.

## 6) Routing and Communication Rules

Principle from audit/spec:
- Agent handles basic, low-risk, policy-safe queries.
- Human-only routing for high-risk/complex cases (complaints, BM operational warnings, sensitive escalations).
- No silent handoff. Escalation always includes customer-visible continuity and internal context package.

## 7) n8n / Integration Transition Notes

Known risks:
- Existing Intercom<->Monday flows include high failure points.
- Flow logic visibility is fragmented.

Required before full cutover:
- Catalog active/inactive flows and ownership.
- Eliminate non-repair-tag trigger errors in relevant workflow(s).
- Decide which automations remain in n8n vs migrate to service code.

## 8) Build Phasing

1. **Baseline hardening**
   - Fix routing rules and escalation behavior.
   - Enforce no-silent-handoff.
2. **Data and observability**
   - Stand up schema and audit logging.
   - Track conversation outcomes and route quality.
3. **Service integration**
   - Controlled webhook path, Monday context integration, policy-driven responses.
4. **Cutover**
   - Run in parallel, verify metrics, then switch default handling.

## 9) Risks and Blockers

- Incomplete production config documentation in version-controlled docs.
- Dependency on stable routing and policy ownership.
- Existing automation reliability issues.
- Need clear human escalation ownership windows.

## 10) Open Questions

- Final cutover strategy: full disable vs staged coexistence windows.
- Ownership of policy updates for pricing/eligibility.
- Exact BM handling policy and fallback behavior during off-hours.

## 11) Source Map

- `~/.openclaw/agents/customer-service/workspace/docs/intercom-agent-build/SPEC.md`
- `/home/ricky/mission-control-v2/docs/intercom/intercom-audit-2026-02.md`
- `/home/ricky/mission-control-v2/docs/intercom/intercom-audit-part2-conversations.md`
- `/home/ricky/mission-control-v2/docs/intercom/intercom-agent-led-comms-spec.md`
- `/home/ricky/mission-control-v2/docs/integrations/n8n-intercom-monday-flows.md`
- `/home/ricky/.openclaw/agents/customer-service/workspace/MEMORY.md`

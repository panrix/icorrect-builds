# Inventory System SPEC

## 1) Problem Statement

Current inventory management lacks reservation integrity and operational visibility. Parts are frequently only deducted at late workflow stages, causing false availability, repair delays, and avoidable operational churn.

## 2) Business Case and Success Metrics

Expected impact:
- Fewer stalled repairs due to hidden part contention.
- Better ETA reliability at intake.
- Lower stockout surprises and emergency ordering stress.

KPIs:
- Reservation coverage rate on active repairs.
- Parts Required population rate.
- Negative stock incident count.
- Awaiting-part cycle time.
- Wastage logging completeness.

## 3) Scope

### In Scope
- Reservation-first inventory operating model.
- Intake-time and queue-time stock commitment logic.
- Refurb pipeline tracking requirements.
- Supplier/order visibility requirements.
- Data quality prerequisites for automation confidence.

### Out of Scope
- Full hardware QR rollout in phase 1.
- Complete predictive demand engine in first release.

## 4) Consolidated Requirements

Must-have requirements (merged from sources):
- Reserve stock before repair execution, not only at completion.
- Fix misleading multi-part availability interpretation.
- Add wastage capture and part-fault logging.
- Define and enforce reorder levels for high-priority parts.
- Track stock velocity and ageing over time.
- Track supplier alternatives and emergency procurement paths.
- Support refurb pipeline and cross-model compatibility/substitution logic.

## 5) Architecture and Data Flow

Operational path:
1. Intake identifies required parts.
2. System checks and reserves stock.
3. In-progress repair consumes reserved stock.
4. Cancellation/reversal releases reservations safely.
5. Receiving flow reconciles ordered stock.

System dependencies:
- Monday boards for repairs and stock.
- Automation layer for reservation lifecycle.
- Dashboard/reporting layer for stock health.

## 6) Refurb Pipeline Integration

Refurb must be first-class:
- Track donor/source status.
- Track per-stage progress and outcomes.
- Capture conversion success/failure and cycle time.
- Publish converted stock availability back into usable inventory.

## 7) Phasing

1. **Data foundation**
   - clean critical stock data and links
2. **Stock engine**
   - reservation, consumption, release, receiving flows
3. **Visibility layer**
   - dashboard for stock, reservations, reorder signals
4. **Alerting and optimization**
   - low stock, stale reservations, anomaly notifications

## 8) Risks and Blockers

- Board data quality and column semantics inconsistency.
- Process discipline gaps in physical stock handling.
- Ownership ambiguity for reorder levels and supplier mappings.

## 9) Open Questions

- Reservation policy for unpaid vs paid demand.
- Canonical model for substitutions and compatibility data ownership.
- QR introduction sequence and hardware procurement timing.
- Website-demand coupling and where that data contract lives.

## 10) Source Map

- `~/.openclaw/agents/main/workspace/docs/inventory-system/RICKY-REQUIREMENTS.md`
- `~/.openclaw/agents/main/workspace/docs/inventory-system/PHASE-1-PLAN.md`
- `~/.openclaw/agents/main/workspace/docs/inventory-system/SUMMARY.md`
- `~/.openclaw/agents/main/workspace/docs/inventory-system/refurb-pipeline-board-spec.md`
- parts agent duplicates for cross-check
- `/home/ricky/.openclaw/agents/parts/workspace/MEMORY.md`
- `/home/ricky/.openclaw/agents/systems/workspace/MEMORY.md`

# Office Hours: Parts Shortage Alerting Tool
Date: 2026-04-29
Status: planning draft
Owner: Ops / Ricky
Related live tool: `docs/tools/repair-stock-check.md`

## 1. Working goal

Build a parts shortage alerting tool that catches repair jobs which are blocked, likely to become blocked, or operationally risky because parts are missing or too low before the workshop discovers it late.

The tool should protect:
- repair queue flow
- customer expectations
- technician time
- parts ordering urgency
- Ricky visibility on operational risk

This is not just a stock lookup. It is an exception-control layer.

## 2. Current live foundation

There is already a live read-only stock-check layer:

- Monday Main Board: `349212843`
- Watched column: `board_relation` / Requested Repairs
- Webhook: `https://mc.icorrect.co.uk/stock-check-webhook`
- Service: `icorrect-parts-service`, route `/stock-check-webhook`
- Behaviour: when Requested Repairs changes, it reads linked Products & Pricing items, resolves linked Parts via `connect_boards8`, fetches stock from Parts/Stock Levels, and posts a `Stock Check` update back to the repair item.
- Safety: read-only for stock. It does not reserve, deduct, or allocate parts.

Operational implication: shortage alerting should build on this stock-resolution path, not re-invent product-to-part mapping.

## 3. Problem statement

Today, parts risk can surface too late:

- job reaches technician queue before stock has been truly allocated
- technician may only discover the missing part when trying to start
- payment may be confirmed while parts are missing
- customer expectations may already be set before the shortage is visible
- Monday may show movement while physical readiness has not happened
- current stock-check update is passive; someone still has to notice and act

The gap is not lookup. The gap is escalation and ownership.

## 4. Target behaviour

When a job requires a part and stock is insufficient, the system should create a visible operational alert with an owner and next action.

Minimum useful behaviour:

1. Detect low/no stock from Requested Repairs mapping.
2. Classify the risk:
   - `NO_STOCK`: required linked part has 0 available
   - `LOW_STOCK`: part is at or below defined threshold
   - `MISSING_MAPPING`: repair has no authoritative linked part
   - `MULTI_PART_RISK`: repair maps to multiple parts and one or more are low/no stock
3. Post a clear Monday update on the repair item.
4. Notify the right internal surface.
5. Avoid repeat spam for the same unresolved shortage.
6. Give the next action: order, allocate alternative, confirm ETA, or manually verify mapping.

## 5. Alert recipients / ownership model

Recommended owner split:

- Parts owner / parts agent: stock shortage, reorder, ETA, supplier action
- Ops / repair queue: whether job should remain queued, pause, or have customer expectation reset
- Alex-CS / customer layer: only after ops confirms the external customer message is needed

Ricky should not be first-line recipient for every shortage. Ricky should see summaries or escalations when the shortage creates revenue, corporate, or reputational risk.

## 6. Proposed alert surfaces

### V0: Monday-native and low-risk

- Keep posting stock-check updates on the repair item.
- Add shortage-specific update text with `ACTION REQUIRED`.
- Optionally write to a dedicated Monday column if one exists or is added later, e.g. `Parts Alert Status`.
- Deduplicate by storing alert state in a lightweight local store or a Monday update marker.

### V1: Ops issue visibility

- Create or update an issue record when a shortage blocks a live repair.
- Include:
  - Monday item ID
  - customer / company
  - repair requested
  - required part
  - stock count
  - payment / queue status if available
  - owner
  - next action
  - last customer update evidence if connected later

### V2: Proactive reorder risk

- Watch stock levels independently of repair events.
- Alert when available stock falls below threshold, even before a specific repair is blocked.
- Rank by demand velocity once enough data exists.

## 7. Recommended build sequence

### Phase 1 — shortage detection inside existing stock-check webhook

Extend the existing `/stock-check-webhook` path to classify each linked part as OK / LOW / NO_STOCK / MISSING_MAPPING.

Output should remain safe and read-only.

Acceptance criteria:
- A Requested Repairs change with stock 0 posts a clear shortage update.
- A repair with no linked part posts a manual mapping alert.
- Normal stock still posts a standard stock check.
- Repeated identical webhook events do not create spam.

### Phase 2 — owner-facing alert routing

Send shortage alerts to the internal owner surface.

Recommended first route:
- Monday item update + Telegram Operations > Parts topic, if topic ID is available.

If topic routing is not ready, keep V0 in Monday only and create a daily shortage digest instead.

Acceptance criteria:
- Parts owner can see every active shortage without scanning all repair item updates.
- Ops can tell which repair jobs are blocked by parts within one view.

### Phase 3 — alert lifecycle

Track whether the shortage is still active.

States:
- `new`
- `acknowledged`
- `ordered`
- `eta_confirmed`
- `resolved`
- `mapping_required`

Acceptance criteria:
- When stock returns above threshold, the alert can be resolved or marked ready.
- Old alerts do not stay noisy after the part is back in stock.

### Phase 4 — queue/customer risk integration

Join shortage alerting to repair queue and customer expectation logic.

Acceptance criteria:
- If a paid/queued repair has no stock, the system flags that customer timing may need resetting.
- If a corporate or high-value case is blocked, it is escalated above normal shortage noise.

## 8. Data needed before implementation

Required:
- Exact stock column names / IDs on Parts/Stock Levels board.
- Whether `available stock` already accounts for parts allocated but not deducted.
- Whether there is an existing low-stock threshold per part, category, or default global threshold.
- Telegram topic ID for Operations > Parts if alerts should go there.
- Whether a Monday column should be added for `Parts Alert Status`, or whether V0 should stay update-only.

Nice to have:
- supplier lead time per part
- reorder quantity rules
- historical demand rate by part / repair
- open purchase orders / inbound shipment ETAs

## 9. Decision recommendation

Build Phase 1 first, inside the existing `icorrect-parts-service`, because the live webhook already resolves repair -> product -> part -> stock.

Do not build a separate service yet. A separate service adds deployment surface without solving the main business problem.

Do not start with AI summaries. Start with deterministic shortage states and clear owner routing.

## 10. Open decisions for Ricky

1. Should low stock mean `0 only`, or should we alert when stock is `<= 1` / `<= 2`?
2. Who owns first response to a shortage alert: Roni/parts owner, Ops Jarvis, or both?
3. Should V0 create a Monday column/status, or stay as Monday updates until the workflow proves itself?
4. Should customer communication be automatic later, or always require human/agent confirmation first?

## 11. Build brief seed

Task: Extend the live repair stock-check tool into a parts shortage alerting layer.

Context:
- Existing docs: `/home/ricky/builds/operations-system/docs/tools/repair-stock-check.md`
- Existing CLI: `/home/ricky/builds/operations-system/tools/repair-stock-check.js`
- Live service: `/home/ricky/builds/icorrect-parts-service`
- Live route: `/stock-check-webhook`

Implement:
- shortage classification for linked repair parts
- low/no stock alert update copy
- dedupe to avoid repeated identical alerts
- manual mapping alert when no linked part is found
- tests or a dry-run harness for stock scenarios

Safety:
- read-only for stock
- no automatic part deduction
- no customer messaging in V0
- no queue status changes in V0

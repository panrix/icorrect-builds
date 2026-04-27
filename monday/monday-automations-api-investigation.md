# Monday Automations API Investigation

**Board:** `iCorrect Main Board v2` (id `18401861682`)
**Date:** 2026-04-26
**Goal:** can the ~80-automation rebuild be done via API instead of clicking Monday's UI?

---

## 1. Verdict

**Possible via Monday's PRIVATE `/lite-builder/*` REST API. The PUBLIC GraphQL API has zero automation mutations.**

The private API is the same set of endpoints the in-browser automations builder calls. It is reachable from any authenticated browser session (cookie + `X-CSRF-Token` header). It is **not** reachable with the public `MONDAY_APP_TOKEN` — the GraphQL token is rejected (HTTP 406) by `/lite-builder/*`. So "API" here means *cookie-authed private REST*, not *clean public API*.

Browser-harness can stay involved purely as the auth-context provider (one signed-in tab opens, scripts then bulk-POST workflows). No per-step UI clicks needed.

---

## 2. Public GraphQL surface (`api.monday.com/v2`)

Introspection (`query { __schema { mutationType { fields { name } } } }`):

- **0** mutations match `automat|trigger|recipe|workflow`
- 4 read-only queries exist for telemetry only:
  - `trigger_events` / `trigger_event` — past trigger fires
  - `account_trigger_statistics` / `account_triggers_statistics_by_entity_id` — counts
- 171 mutations total (`create_board`, `create_webhook`, `execute_integration_block`, etc.) but nothing for creating automation rules.

**Conclusion: the public GraphQL API cannot create, update, or delete automations.** It can only read execution stats after the fact.

---

## 3. Private API surface (`icorrect.monday.com/lite-builder/*`)

Discovered by sniffing `Network.requestWillBeSent` while opening Automate on the v2 board, plus regex over the `mf-lite-builder` and `mf-automations-board` JS bundles.

**Auth:** Session cookie (already present in any signed-in browser) + `X-CSRF-Token` header from `<meta name="csrf-token">`. A separate `Authorization` JWT from `GET /automations/generate_service_token` is needed for `/lite-builder/blocks`, `/blocks-catalog`, `/templates`, `/categories`, `/composers` — but the exact token shape that satisfies these wasn't fully reverse-engineered (Bearer + cookie still 401'd; likely a different JWT-bound header or scope).

### Endpoints confirmed working (cookie + CSRF only)

| Method | Path | Purpose | Verified |
|--------|------|---------|----------|
| GET | `/lite-builder/workflows?hostInstanceId={boardId}&hostType=board` | List all custom automations on a board | ✓ 200, returns array |
| GET | `/lite-builder/workflows/{workflowId}` | Full workflow definition | ✓ 200, returns blocks+variables |
| GET | `/lite-builder/workflows/count-active?boardId={boardId}` | Active automation count | ✓ 200, `{"count":N}` |
| GET | `/automations-activity-log/get-automations-trigger-statistics` | Trigger telemetry | ✓ 200 |
| GET | `/automations/generate_service_token` | JWT for blocks/templates/etc. | ✓ 200 |

### Endpoints discovered but not yet validated

`POST /lite-builder/workflows` (create), `PUT /lite-builder/workflows/{id}` (update), `DELETE /lite-builder/workflows/{id}` (delete), `/lite-builder/blocks`, `/lite-builder/blocks-catalog`, `/lite-builder/templates`, `/lite-builder/categories`, `/lite-builder/composers`, `/lite-builder/ai/workflow-block-selector`, `/lite-builder/billing/is-quota-exceeded`, `/automations-framework`, `/automations-ms`, `/automations-app-features`.

The CREATE/UPDATE/DELETE shape is **inferred from the GET response**: the same JSON body the GET returns is what the builder PUTs back. Confirmed structure (excerpt from real workflow `7918164969` — yesterday's pilot):

```json
{
  "id": 7918164969, "userId": 1034414, "active": true,
  "title": "When status changes to something, set item date column to date",
  "workflowHostData": {"type":"board","id":"18401861682"},
  "workflowBlocks": [
    { "workflowNodeId": 1, "blockReferenceId": 10380154,
      "title": "When status changes to something",
      "inboundFieldsSourceConfig": {
        "boardId":              {"workflowVariableKey": 1},
        "statusColumnId":       {"workflowVariableKey": 81},
        "desiredStatusColumnValue":{"workflowVariableKey": 82},
        "fieldsUsages":         {"workflowVariableKey": 86}
      },
      "nextWorkflowBlocksConfig":{"type":"directMapping","mapping":{"nextWorkflowNode":{"workflowNodeId":2}}}},
    { "workflowNodeId": 2, "blockReferenceId": 10505052, "title": "Set date",
      "inboundFieldsSourceConfig": {
        "itemId":          {"workflowVariableKey": 80},
        "boardId":         {"workflowVariableKey": 1},
        "dateColumnId":    {"workflowVariableKey": 83},
        "dateColumnValue": {"workflowVariableKey": 85}}}
  ],
  "workflowVariables":[
    {"workflowVariableKey":1,  "sourceKind":"host_metadata","sourceMetadata":{"hostMetadataKey":"hostInstanceId"}},
    {"workflowVariableKey":81, "appFeatureReferenceId":10380084,"sourceKind":"user_config",
     "config":{"value":"repair_status_v2","title":"Repair Status"}},
    {"workflowVariableKey":82, "sourceKind":"user_config","config":{"value":"<status_index>","title":"Received"}},
    {"workflowVariableKey":83, "sourceKind":"user_config","config":{"value":"<date_col_id>","title":"Received"}},
    {"workflowVariableKey":84, "sourceKind":"user_config","config":{"value":"today","title":"Today"}},
    {"workflowVariableKey":85, "primitiveType":"date","sourceKind":"user_config",
     "transformationType":"date","config":{"value":"84","dependencies":[84]}},
    {"workflowVariableKey":80, "appFeatureReferenceId":10380092,"sourceKind":"node_results",
     "sourceMetadata":{"workflowNodeId":1,"outboundFieldKey":"itemId"}}
  ],
  "blocksAppReferenceIds":[10035827]
}
```

`blockReferenceId`s are stable per-trigger / per-action in Monday's catalog (e.g. `10380154` = "when status changes", `10505052` = "set date"). `appFeatureReferenceId`s identify the column-type pickers. Once we have one working POST capture, we templatise this and substitute column IDs / status indices for the other 79 automations.

---

## 4. Recommendation

**Use the private API + scripted batching. Skip browser-harness UI clicks for the rebuild.**

Concrete plan:

1. One-off: harness opens a signed-in Monday tab, runs `GET /lite-builder/workflows?hostInstanceId={oldBoard}` to dump every existing automation as JSON.
2. Transform: rewrite each workflow JSON's `workflowHostData.id` to `18401861682`, remap any column IDs from old board to v2 board IDs (already known — see `monday-reference.md`), strip `id` / `createdAt` / `updatedAt`.
3. Bulk POST each one to `/lite-builder/workflows` from the same tab context (or via Python with the cookie jar exported once). 80 automations should run in <1 minute.
4. Read back `count-active` and the workflows list to verify all 80 created.
5. Audit: any failed POSTs get inspected, fixed, retried — vs UI-builder where each failure is a 30s manual reopen.

**Why not pure GraphQL:** doesn't exist for automations.
**Why not pure UI clicks:** 80 × ~30s/each = 40 min if every click works first time, plus high fragility on timing/scroll/dropdown selection.
**Why not the sub-token approach:** the cookie alone is enough for the workflows endpoint; the service-token-gated routes (blocks-catalog) are only needed if we want to *list available block types* — we already know our block IDs from the existing pilot.

---

## 5. Limits and unknowns

- **POST/PUT/DELETE shape inferred, not directly captured.** The transfer-ownership modal blocked the click into the actual builder during this session (it's a true `<dialog>` not `[role=dialog]` and our dismiss button selectors didn't catch it). Next investigator should: dismiss the transfer dialog manually in Chrome first, then re-run the sniffer to capture the exact POST body when the builder's "Save" is clicked once.
- **Service-token auth pattern for `/lite-builder/blocks*` not solved.** Both cookie+CSRF and Bearer+cookie returned 401. There is likely a third header the builder sends — capturing one real successful builder request will reveal it. Not blocking for the rebuild because we don't need block discovery.
- **Old-board column ID -> v2-board column ID map** must exist (or be built) before transformation. `workflowVariables[].config.value` carries column IDs and status indices that are board-scoped.
- **`blocksAppReferenceIds`** appears to be an opaque enrichment list — safe to copy from the source workflow but unverified whether POST requires it.
- **Rate limits on `/lite-builder/workflows` POST unknown.** Pilot the first 5 with a 500ms delay; if all succeed, ramp to bulk.
- **The CSRF token rotates per session.** Re-fetch from `<meta name=csrf-token>` if the script runs across reloads.

---

## Files captured during investigation

- `/Users/icorrect/.tmp_monday/probe2.py` — endpoint probe shell
- `/Users/icorrect/.tmp_monday/sniff2.py` — Automate-button network capture
- `/Users/icorrect/.tmp_monday/sniff3.py` — bundle grep + endpoint discovery
- `/Users/icorrect/.tmp_monday/sniff5.py` — CSRF auth probe
- `/Users/icorrect/.tmp_monday/sniff6.py` — service-token + GET single workflow
- `/Users/icorrect/.tmp_monday/sniff_dump.json`, `sniff2_dump.json` — raw event dumps

Token from `MONDAY_APP_TOKEN` was used **only** for public-GraphQL introspection (read-only). No automations were created, modified, or deleted on the v2 board (`count-active` verified `{"count":1}` before and after).

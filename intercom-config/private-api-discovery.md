# Intercom Private API — Discovery Report

**Date:** 2026-04-26  **Workspace:** `pt6lwaq6` (iCorrect)  **Admin:** `9702337`
**Service prefix:** `/ember/` on `https://app.intercom.com`

## 1. Verdict — can the 8 configs be deployed via the discovered API?

| # | Config | Verdict | Endpoint family |
|---|---|---|---|
| 1 | Spam auto-close (by domain) | **Yes** | `/ember/matching_system/rulesets` (workflow with close-conversation step), or simpler `/ember/escalation_rules` if route-only |
| 2 | Back Market routing to admin 9702337 | **Yes** | `/ember/escalation_rules` (proven shape: predicate_group + state — pattern of existing "Route to Sales" rule) |
| 3 | Auto-acknowledge contact-form workflow | **Yes** | `/ember/matching_system/rulesets` with a send-message step in `visual_builder_object.groups[].steps[]` |
| 4 | 24h no-reply alert (Telegram ping) | **Partial** | `/ember/inbox/conversation_slas` exists (returns []), but reply-out integration goes via `/ember/workflow_connector/actions` (custom HTTP) — both confirmed live |
| 5 | Contact-form triage Inbox view | **Yes** | View JSON shape captured fully; create via POST to `/ember/inbox/inbox_folders/` (POST shape inferred from GET shape — see Gaps) |
| 6 | Follow-up sequence (Series) | **Partial** | `/ember/content_service/contents/search?object_types[]=2` is the Series surface and returns 200 (workspace currently has 0 Series). Create-Series body shape not captured — needs follow-up sniff |
| 7 | Channel priority workflow (IG/WA = P1) | **Yes** | Same `matching_system/rulesets` engine; predicate `conversation.current_channel in [5,7,8]` proven in inbox_folders data |
| 8 | Auto-tag by intent | **Yes** | Workflow with `apply-tag` step + `ai_content_segment_ids` attached to ruleset (proven by AI segment data shape) |

## 2. Endpoint surface (confirmed live)

Service prefix `/ember/`. Full inventory at `/tmp/intercom-api-inventory.json` — **61 confirmed endpoints, 318 surfaced via bundle grep**. Highlights:

**Rules & workflows:**
- `GET /ember/escalation_rules` (list) and `/ember/escalation_rules/{id}` — routing rules with `predicate_group + state + name + ai_content_segment_ids + target_channels`. iCorrect already has 5 active.
- `GET /ember/matching_system/rulesets/{id}` — full workflow object, including `visual_builder_object.groups[].steps[]` graph. Step types: `operator/visual-builder/step/fin|assign-conversation|send-message|...`.
- `GET /ember/channel_identity_rules` — per-channel verification config (IG/WA/FB/email).
- `GET /ember/ai_content_segments` — semantic segments (each is a ruleset with predicates).
- `GET /ember/conversation_attributes/descriptors` — full custom attribute list (used inside predicate_group `attribute` fields).

**Inbox / views / SLAs / tickets:**
- `GET /ember/inbox/inboxes/`, `/ember/inbox/inbox_folders/` — both contain `view_summary.predicates` blocks (this is the inbox view schema).
- `GET /ember/inbox/conversation_slas`, `/ember/office_hours_schedules` — SLA & schedule data.
- `GET /ember/inbox/ticket_types`, `ticket_custom_states`, `assignees`, `tags`.

**Content / replies / series / connector actions:**
- `GET /ember/saved_replies` and `/ember/inbox/saved_replies` (paginated `{total, results}` vs flat).
- `GET /ember/content_service/contents/search?object_types[]=2` — Series surface (object_type 2 = Series).
- `GET /ember/workflow_connector/actions` — custom HTTP actions (use this for the Telegram-out webhook on the 24h SLA): body shape `{name, http_method, url, body, headers, app_package_code, usage}`.

**Tags & meta:** `/ember/tags` (flat), `/ember/inbox/tags` (paginated).

**Path-style app_id (not `?app_id=`):** `/ember/operator_settings/ai_agent_quick_replies/{app_id}`, `/ember/operator_bot_inbox_settings/{app_id}`, `/ember/admins/notification_settings/{admin_id}`.

## 3. Auth pattern

**Cookie session + `X-CSRF-Token` header.** Same-origin requests, no CORS preflight (OPTIONS returns 404). The token is read from `<meta name="csrf-token">` on every page load.

```python
import json
def api(method, path, body=None):
    csrf = js("(document.querySelector('meta[name=csrf-token]')||{}).content")
    body_arg = f", body: {json.dumps(json.dumps(body))}" if body else ""
    expr = f"""(async()=>{{
      const r = await fetch({json.dumps(path)}, {{
        method: {json.dumps(method)},
        headers: {{
          'Content-Type':'application/json',
          'Accept':'application/json',
          'X-CSRF-Token': {json.dumps(csrf)},
        }},
        credentials: 'include'{body_arg}
      }});
      return {{status: r.status, body: await r.text()}};
    }})()"""
    r = js(expr); 
    if r and r.get('body'):
        try: r['parsed'] = json.loads(r['body'])
        except: pass
    return r
```

The CSRF token is required for POST/PUT/PATCH/DELETE — GETs work with cookies alone but include the header anyway for consistency.

Cookies attached: `intercom-session-tx2p130c`, `intercom-id-tx2p130c`, `intercom-device-id-tx2p130c`, plus standard analytics cookies.

## 4. Sample bodies for create

Schema captured directly from existing-record GETs (full samples in `/tmp/intercom-api-inventory.json` → `sample_objects`):

**Escalation rule (routing) — POST /ember/escalation_rules:**
```json
{
  "app_id": "pt6lwaq6",
  "name": "Back Market - Route to Admin 9702337",
  "state": 1,
  "predicate_group": {"predicates": [
    {"attribute": "conversation.from_email",
     "type": "string",
     "comparison": "eq",
     "value": "merchant.no-reply@backmarket.com"}
  ]},
  "ai_content_segment_ids": [],
  "target_channels": null
}
```

**Workflow (matching_system ruleset) — POST /ember/matching_system/rulesets:**
Top-level keys: `id, app_id, environment_ids, state (1=live, 0=draft), match_behavior (3=on_message), predicate_group, role_predicate_group, default_predicate_group, ruleset_links[], matching_timetable, goal, segment_ids, tag_ids, scheduled_activation, scheduled_deactivation`. `ruleset_links[].object` carries the visual builder graph: `groups[].steps[]` where step types include `operator/visual-builder/step/fin`, `operator/visual-builder/step/assign-conversation`, `operator/visual-builder/step/send-message`, with `outward_connection_points[].edge.to_group_id` connecting nodes.

**Predicate format (universal across rules/views/segments):**
```json
{"attribute": "conversation.tag_ids|conversation.current_channel|conversation.custom_attribute.<id>|role|conversation.from_email",
 "comparison": "eq|ne|in",
 "type": "manual_tag|channel|conversation_attribute_list|role|string",
 "value": "<id-or-string-or-array>"}
```
Channel IDs seen: 0=Messenger, 3=Email, 5=WhatsApp, 6=in-app, 7=IG, 8=FB.

## 5. Gaps requiring follow-up sniff

1. **Workflow LIST endpoint** — single GET by ID works; bare `/ember/matching_system/rulesets` 404s. The UI workflows-index URL kept redirecting before any list-fire; need to sniff the Inbox v2 Workflows tab when accessible. Workaround: address rulesets directly by ID (IDs cross-referenced via `/ember/procedures/referable_entities/workflows`).
2. **CREATE bodies (3 surfaces with no existing records to infer from):** SLA (`conversation_slas` returns `[]`), Series (`content_service/contents` empty), Custom Answers (`custom_answers/custom_answers` empty). All need a single UI-driven create-and-capture session.
3. **POST `/ember/inbox/inbox_folders/`** create body — read shape complete; create body inferred but unconfirmed. Sniff "Create view" click.
4. The `/a/apps/{app_id}/automation/workflows-overview/all-workflows` URL redirects away — the workflows index lives at a different route (likely under Inbox v2 settings, role-gated).

**Raw artifacts** (all in `/tmp/`): `intercom-api-inventory.json` (consolidated), `intercom-bundle-grep.json` (344 bundle eps), `intercom-key-probe*.json` (probe responses with sample bodies), `intercom-network-explore.json`, `intercom-network-real.json`, `intercom-workflow-editor.{json,png}`.

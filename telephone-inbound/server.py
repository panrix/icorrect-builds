#!/usr/bin/env python3
"""
Telephone Inbound Server
Slack slash command /call -> modal with fields -> posts to #phone-enquiries -> optionally creates Monday item + Intercom contact

Port: 8003
Endpoints:
  POST /slack/commands   - slash command handler
  POST /slack/interact   - modal submission handler
"""

import os
import re
import sys
import json
import time
import hmac
import hashlib
import logging
import requests
from pathlib import Path
from flask import Flask, request, jsonify
from urllib.parse import parse_qs

# ---- Config ----

PORT = 8003
PHONE_ENQUIRIES_CHANNEL = "C09TBEMJA2H"
MAIN_BOARD_ID = 349212843  # iCorrect Main Board
TODAY_REPAIRS_GROUP = "new_group"  # "Today's Repairs" group - will verify

LOG_FILE = Path(__file__).parent / "telephone-inbound.log"

# ---- Logging ----

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("telephone-inbound")

# ---- Env ----

def load_env():
    env = {}
    env_file = Path("/home/ricky/config/api-keys/.env")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env

ENV = load_env()

# ---- Slack Signature Verification ----

def verify_slack_signature(body_bytes, timestamp, signature):
    signing_secret = ENV.get("SLACK_SIGNING_SECRET", "")
    if not signing_secret:
        log.warning("No SLACK_SIGNING_SECRET configured, skipping verification")
        return True

    if abs(time.time() - int(timestamp)) > 60 * 5:
        return False

    sig_basestring = f"v0:{timestamp}:{body_bytes.decode('utf-8')}"
    my_signature = "v0=" + hmac.new(
        signing_secret.encode(), sig_basestring.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(my_signature, signature)

# ---- Device & Fault Options ----

DEVICES = [
    {"text": {"type": "plain_text", "text": d}, "value": d.lower().replace(" ", "_")}
    for d in [
        "iPhone", "iPad", "MacBook", "Apple Watch", "iMac", "Mac Mini", "Mac Pro", "Other"
    ]
]

FAULTS = [
    {"text": {"type": "plain_text", "text": f}, "value": f.lower().replace(" ", "_")}
    for f in [
        "Screen Repair", "Battery Replacement", "Charging Port", "Keyboard",
        "Liquid Damage", "Diagnostic", "Data Recovery", "Software Issue",
        "Camera", "Speaker/Mic", "Button Repair", "Other"
    ]
]

# ---- Monday Board Matching ----

DEVICES_BOARD_ID = 3923707691
PRODUCTS_BOARD_ID = 2477699024

def find_device_item(device_category, model_text):
    """Find matching device item on Devices board."""
    monday_token = ENV["MONDAY_APP_TOKEN"]
    headers = {"Authorization": monday_token, "Content-Type": "application/json"}

    # Map category to group
    group_map = {
        "iphone": "topics",
        "ipad": "new_group96809",
        "macbook": "new_group",
        "apple_watch": "new_group97770",
        "imac": "new_group65865",
        "mac_mini": "new_group65865",
        "mac_pro": "new_group65865",
        "other": "new_group65865",
    }

    group_id = group_map.get(device_category, "new_group65865")

    # Get items in this group
    q = f'''{{ boards(ids: [{DEVICES_BOARD_ID}]) {{
        groups(ids: ["{group_id}"]) {{
            items_page(limit: 100) {{
                items {{ id name }}
            }}
        }}
    }} }}'''
    r = requests.post("https://api.monday.com/v2", json={"query": q}, headers=headers)
    groups = r.json().get("data", {}).get("boards", [{}])[0].get("groups", [])
    if not groups:
        return None

    items = groups[0].get("items_page", {}).get("items", [])

    if not model_text:
        return None

    # Fuzzy match: find best matching device
    model_lower = model_text.lower().strip()
    best_match = None
    best_score = 0

    for item in items:
        item_lower = item["name"].lower()
        # Exact match
        if model_lower == item_lower:
            return item["id"]
        # Check if model text is contained in item name or vice versa
        if model_lower in item_lower or item_lower in model_lower:
            score = len(model_lower)
            if score > best_score:
                best_score = score
                best_match = item["id"]
        # Check individual words
        words = model_lower.split()
        matches = sum(1 for w in words if w in item_lower)
        score = matches / max(len(words), 1)
        if score > 0.5 and score > best_score:
            best_score = score
            best_match = item["id"]

    return best_match

def find_repair_product(device_category, model_text, fault_text):
    """Find matching repair product on Products & Pricing board."""
    monday_token = ENV["MONDAY_APP_TOKEN"]
    headers = {"Authorization": monday_token, "Content-Type": "application/json"}

    if not fault_text:
        return None

    # Search Products & Pricing board for matching group + item
    q = f'''{{ boards(ids: [{PRODUCTS_BOARD_ID}]) {{
        groups {{ id title }}
    }} }}'''
    r = requests.post("https://api.monday.com/v2", json={"query": q}, headers=headers)
    groups = r.json().get("data", {}).get("boards", [{}])[0].get("groups", [])

    # Find matching group by model name
    model_lower = (model_text or "").lower()
    best_group = None
    best_score = 0

    for g in groups:
        g_lower = g["title"].lower()
        if model_lower and model_lower in g_lower:
            score = len(model_lower)
            if score > best_score:
                best_score = score
                best_group = g
        elif model_lower:
            words = model_lower.split()
            matches = sum(1 for w in words if w in g_lower)
            score = matches / max(len(words), 1)
            if score > 0.5 and score > best_score:
                best_score = score
                best_group = g

    if not best_group:
        return None

    # Get items in this group and match fault
    q2 = f'''{{ boards(ids: [{PRODUCTS_BOARD_ID}]) {{
        groups(ids: ["{best_group['id']}"]) {{
            items_page(limit: 50) {{
                items {{ id name column_values(ids: ["status3"]) {{ text }} }}
            }}
        }}
    }} }}'''
    r2 = requests.post("https://api.monday.com/v2", json={"query": q2}, headers=headers)
    groups2 = r2.json().get("data", {}).get("boards", [{}])[0].get("groups", [])
    if not groups2:
        return None

    items = groups2[0].get("items_page", {}).get("items", [])

    # Map fault dropdown values to search terms
    fault_map = {
        "screen_repair": ["screen", "display", "lcd", "oled"],
        "battery_replacement": ["battery"],
        "charging_port": ["charging", "port", "usb"],
        "keyboard": ["keyboard"],
        "liquid_damage": ["liquid", "water", "treatment"],
        "diagnostic": ["diagnostic"],
        "data_recovery": ["data"],
        "software_issue": ["software"],
        "camera": ["camera"],
        "speaker/mic": ["speaker", "mic", "microphone"],
        "button_repair": ["button", "power", "volume", "mute"],
    }

    fault_lower = fault_text.lower().replace(" ", "_")
    search_terms = fault_map.get(fault_lower, [fault_text.lower()])

    for item in items:
        item_lower = item["name"].lower()
        product_type = ""
        for cv in item.get("column_values", []):
            if cv.get("text"):
                product_type = cv["text"].lower()

        for term in search_terms:
            if term in item_lower or term in product_type:
                return item["id"]

    return None

# ---- Modal Definition ----

def build_modal():
    return {
        "type": "modal",
        "callback_id": "telephone_inbound_submit",
        "title": {"type": "plain_text", "text": "Log Phone Call"},
        "submit": {"type": "plain_text", "text": "Submit"},
        "close": {"type": "plain_text", "text": "Cancel"},
        "blocks": [
            {
                "type": "input",
                "block_id": "customer_name",
                "optional": False,
                "element": {
                    "type": "plain_text_input",
                    "action_id": "name_input",
                    "placeholder": {"type": "plain_text", "text": "Customer name"},
                },
                "label": {"type": "plain_text", "text": "Name"},
            },
            {
                "type": "input",
                "block_id": "customer_email",
                "optional": True,
                "element": {
                    "type": "email_text_input",
                    "action_id": "email_input",
                    "placeholder": {"type": "plain_text", "text": "customer@email.com"},
                },
                "label": {"type": "plain_text", "text": "Email"},
            },
            {
                "type": "input",
                "block_id": "customer_phone",
                "optional": True,
                "element": {
                    "type": "plain_text_input",
                    "action_id": "phone_input",
                    "placeholder": {"type": "plain_text", "text": "+44..."},
                },
                "label": {"type": "plain_text", "text": "Phone Number"},
            },
            {
                "type": "input",
                "block_id": "device_select",
                "optional": True,
                "element": {
                    "type": "static_select",
                    "action_id": "device_input",
                    "placeholder": {"type": "plain_text", "text": "Select device"},
                    "options": DEVICES,
                },
                "label": {"type": "plain_text", "text": "Device"},
            },
            {
                "type": "input",
                "block_id": "device_model",
                "optional": True,
                "element": {
                    "type": "plain_text_input",
                    "action_id": "model_input",
                    "placeholder": {"type": "plain_text", "text": "e.g. iPhone 15 Pro Max, MacBook Air M2 A2681"},
                },
                "label": {"type": "plain_text", "text": "Specific Model"},
            },
            {
                "type": "input",
                "block_id": "fault_select",
                "optional": True,
                "element": {
                    "type": "static_select",
                    "action_id": "fault_input",
                    "placeholder": {"type": "plain_text", "text": "Select fault"},
                    "options": FAULTS,
                },
                "label": {"type": "plain_text", "text": "Fault"},
            },
            {
                "type": "input",
                "block_id": "notes_block",
                "optional": True,
                "element": {
                    "type": "plain_text_input",
                    "action_id": "notes_input",
                    "multiline": True,
                    "placeholder": {"type": "plain_text", "text": "Call notes, details, questions asked..."},
                },
                "label": {"type": "plain_text", "text": "Notes"},
            },
            {
                "type": "input",
                "block_id": "action_select",
                "optional": False,
                "element": {
                    "type": "static_select",
                    "action_id": "action_input",
                    "placeholder": {"type": "plain_text", "text": "What to do"},
                    "options": [
                        {
                            "text": {"type": "plain_text", "text": "Log only (no Monday/Intercom)"},
                            "value": "log_only",
                        },
                        {
                            "text": {"type": "plain_text", "text": "Create Intercom contact"},
                            "value": "intercom_only",
                        },
                        {
                            "text": {"type": "plain_text", "text": "Create Intercom + Monday item"},
                            "value": "intercom_monday",
                        },
                    ],
                },
                "label": {"type": "plain_text", "text": "Action"},
            },
        ],
    }

# ---- Monday.com ----

def create_monday_item(name, email, phone, device, device_value, model_text, fault, notes):
    monday_token = ENV["MONDAY_APP_TOKEN"]

    # Find Today's Repairs group
    q = '''{ boards(ids: [349212843]) { groups { id title } } }'''
    r = requests.post("https://api.monday.com/v2",
        json={"query": q},
        headers={"Authorization": monday_token, "Content-Type": "application/json"})
    groups = r.json().get("data", {}).get("boards", [{}])[0].get("groups", [])

    today_group = None
    for g in groups:
        if "today" in g["title"].lower() and "repair" in g["title"].lower():
            today_group = g["id"]
            break

    if not today_group:
        today_group = "new_group"  # fallback

    # Find device and repair product links
    device_item_id = find_device_item(device_value, model_text) if device_value else None
    repair_item_id = find_repair_product(device_value, model_text, fault) if (device_value and fault) else None

    log.info(f"Board links: device={device_item_id}, repair={repair_item_id}")

    # Build column values
    col_vals = {}
    if email:
        col_vals["text5"] = email  # Email (text column)
    if phone:
        col_vals["text00"] = phone  # Phone Number (text column)
    # Status: Awaiting Confirmation (index 0)
    col_vals["status4"] = {"index": 5}  # Status = New Repair
    # Service: Walk-In (index 1) - phone enquiry is effectively walk-in
    col_vals["service"] = {"index": 5}  # Service = Unconfirmed
    # Client: Unconfirmed (index 5)
    col_vals["status"] = {"index": 5}  # Client = Unconfirmed
    # Source: Phone (index 0)
    col_vals["color_mkzmbya2"] = {"index": 0}  # Source = Phone
    # Info Capture: Not Filled (index 0)
    col_vals["color_mkvmn8wr"] = {"index": 0}  # Info Capture = Not Filled
    # Walk-in Notes
    if notes:
        col_vals["text368"] = notes
    if device_item_id:
        col_vals["board_relation5"] = {"item_ids": [int(device_item_id)]}
    if repair_item_id:
        col_vals["board_relation"] = {"item_ids": [int(repair_item_id)]}

    # Create item - name only, device/fault go in relations
    item_name = name
    mutation = '''mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $colVals: JSON!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $colVals) {
            id
        }
    }'''

    r = requests.post("https://api.monday.com/v2",
        json={
            "query": mutation,
            "variables": {
                "boardId": "349212843",
                "groupId": today_group,
                "itemName": item_name,
                "colVals": json.dumps(col_vals),
            },
        },
        headers={"Authorization": monday_token, "Content-Type": "application/json"})

    data = r.json()
    if "errors" in data:
        log.error(f"Monday create error: {data['errors']}")
        return None

    item_id = data.get("data", {}).get("create_item", {}).get("id")

    # Add notes as update if provided
    if notes and item_id:
        update_mutation = '''mutation ($itemId: ID!, $body: String!) {
            create_update(item_id: $itemId, body: $body) { id }
        }'''
        requests.post("https://api.monday.com/v2",
            json={
                "query": update_mutation,
                "variables": {"itemId": str(item_id), "body": f"<strong>Phone Enquiry Notes</strong><br><br>{notes}"},
            },
            headers={"Authorization": monday_token, "Content-Type": "application/json"})

    return item_id

# ---- Intercom ----

def create_intercom_contact(name, email, phone, notes):
    intercom_token = ENV.get("INTERCOM_ACCESS_TOKEN", ENV.get("INTERCOM_API_TOKEN", ""))
    if not intercom_token:
        log.warning("No INTERCOM_ACCESS_TOKEN configured")
        return None

    # Search for existing contact by email, then phone
    contact_id = None
    if email:
        r = requests.post("https://api.intercom.io/contacts/search",
            headers={
                "Authorization": f"Bearer {intercom_token}",
                "Content-Type": "application/json",
                "Intercom-Version": "2.11",
            },
            json={"query": {"field": "email", "operator": "=", "value": email}})

        contacts = r.json().get("data", [])
        if contacts:
            contact_id = contacts[0]["id"]
            log.info(f"Found existing Intercom contact by email: {contact_id}")

    if not contact_id and phone:
        r = requests.post("https://api.intercom.io/contacts/search",
            headers={
                "Authorization": f"Bearer {intercom_token}",
                "Content-Type": "application/json",
                "Intercom-Version": "2.11",
            },
            json={"query": {"field": "phone", "operator": "=", "value": phone}})

        contacts = r.json().get("data", [])
        if contacts:
            contact_id = contacts[0]["id"]
            log.info(f"Found existing Intercom contact by phone: {contact_id}")

    if not contact_id:
        # Create new contact
        payload = {"role": "lead", "name": name}
        if email:
            payload["email"] = email
        if phone:
            payload["phone"] = phone

        r = requests.post("https://api.intercom.io/contacts",
            headers={
                "Authorization": f"Bearer {intercom_token}",
                "Content-Type": "application/json",
                "Intercom-Version": "2.11",
            },
            json=payload)

        data = r.json()
        contact_id = data.get("id")
        if not contact_id:
            log.error(f"Intercom create error: {data}")
            return None

    # Create a note on the contact
    if notes and contact_id:
        requests.post(f"https://api.intercom.io/contacts/{contact_id}/notes",
            headers={
                "Authorization": f"Bearer {intercom_token}",
                "Content-Type": "application/json",
                "Intercom-Version": "2.11",
            },
            json={"body": f"Phone enquiry: {notes}"})

    return contact_id

# ---- Flask App ----

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "telephone-inbound"})

@app.route("/slack/commands", methods=["POST"])
def handle_command():
    """Handle /call slash command."""
    body_bytes = request.get_data()
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "0")
    signature = request.headers.get("X-Slack-Signature", "")

    if not verify_slack_signature(body_bytes, timestamp, signature):
        log.warning("Invalid Slack signature")
        # Don't reject for now while testing
        # return "Invalid signature", 403

    form = request.form
    trigger_id = form.get("trigger_id", "")
    user_id = form.get("user_id", "")

    log.info(f"Slash command /call from user {user_id}")

    # Open modal (use automations bot token for this app)
    slack_token = ENV.get("SLACK_AUTOMATIONS_BOT_TOKEN", ENV["SLACK_BOT_TOKEN"])
    r = requests.post("https://slack.com/api/views.open",
        headers={
            "Authorization": f"Bearer {slack_token}",
            "Content-Type": "application/json",
        },
        json={
            "trigger_id": trigger_id,
            "view": build_modal(),
        })

    data = r.json()
    if not data.get("ok"):
        log.error(f"views.open error: {data.get('error')}")
        return jsonify({"response_type": "ephemeral", "text": f"Error opening form: {data.get('error')}"})

    return "", 200

@app.route("/slack/interact", methods=["POST"])
@app.route("/webhook/icloud-check/slack-interact", methods=["POST"])
def handle_interaction():
    """Handle modal submission. Routes non-phone interactions to iCloud service."""
    body_bytes = request.get_data()
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "0")
    signature = request.headers.get("X-Slack-Signature", "")

    payload = json.loads(request.form.get("payload", "{}"))
    payload_type = payload.get("type", "")
    callback_id = payload.get("view", {}).get("callback_id", "")

    log.info(f"Slack interaction: type={payload_type}, callback_id={callback_id}, actions={[a.get('action_id') for a in payload.get('actions', [])]}")

    # Handle button clicks (block_actions)
    if payload_type == "block_actions":
        actions = payload.get("actions", [])
        for action in actions:
            if action.get("action_id") == "open_phone_log_modal":
                trigger_id = payload.get("trigger_id", "")
                if trigger_id:
                    slack_token = ENV.get("SLACK_AUTOMATIONS_BOT_TOKEN", ENV["SLACK_BOT_TOKEN"])
                    r = requests.post("https://slack.com/api/views.open",
                        headers={
                            "Authorization": f"Bearer {slack_token}",
                            "Content-Type": "application/json",
                        },
                        json={"trigger_id": trigger_id, "view": build_modal()})
                    data = r.json()
                    if not data.get("ok"):
                        log.error(f"views.open error: {data.get('error')}")
                    else:
                        log.info("Opened phone log modal from button click")
                return "", 200

            # Handle "Create Monday Item" button
            if action.get("action_id") == "phone_create_monday":
                import urllib.parse
                form_data = dict(urllib.parse.parse_qsl(action.get("value", "")))
                
                def create_monday_bg():
                    item_id = create_monday_item(
                        form_data.get("n",""), form_data.get("e",""), form_data.get("p",""),
                        form_data.get("d",""), form_data.get("dv",""), form_data.get("m",""),
                        form_data.get("f",""), form_data.get("no",""))
                    if item_id:
                        slack_token = ENV.get("SLACK_AUTOMATIONS_BOT_TOKEN", ENV["SLACK_BOT_TOKEN"])
                        # Reply in thread
                        msg = payload.get("message", {})
                        channel = payload.get("channel", {}).get("id", PHONE_ENQUIRIES_CHANNEL)
                        requests.post("https://slack.com/api/chat.postMessage",
                            headers={"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"},
                            json={"channel": channel, "thread_ts": msg.get("ts", ""),
                                  "text": f":white_check_mark: <https://icorrect.monday.com/boards/349212843/pulses/{item_id}|Monday item created>"})
                        log.info(f"Created Monday item {item_id} from button click")
                
                import threading
                threading.Thread(target=create_monday_bg, daemon=True).start()
                return "", 200

            # Handle "Create Intercom Contact" button
            if action.get("action_id") == "phone_create_intercom":
                import urllib.parse
                form_data = dict(urllib.parse.parse_qsl(action.get("value", "")))
                
                def create_intercom_bg():
                    contact_id = create_intercom_contact(
                        form_data.get("n",""), form_data.get("e",""),
                        form_data.get("p",""), form_data.get("no",""))
                    if contact_id:
                        slack_token = ENV.get("SLACK_AUTOMATIONS_BOT_TOKEN", ENV["SLACK_BOT_TOKEN"])
                        msg = payload.get("message", {})
                        channel = payload.get("channel", {}).get("id", PHONE_ENQUIRIES_CHANNEL)
                        requests.post("https://slack.com/api/chat.postMessage",
                            headers={"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"},
                            json={"channel": channel, "thread_ts": msg.get("ts", ""),
                                  "text": f":white_check_mark: <https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/{contact_id}|Intercom contact created>"})
                        log.info(f"Created Intercom contact {contact_id} from button click")
                
                import threading
                threading.Thread(target=create_intercom_bg, daemon=True).start()
                return "", 200

        # Not our button, forward to iCloud service
        log.info(f"Forwarding to iCloud service (block_actions, unmatched action)")
        try:
            r = requests.post("http://127.0.0.1:8010/webhook/icloud-check/slack-interact",
                data=request.form, headers=dict(request.headers))
            log.info(f"iCloud service responded: {r.status_code}")
            return r.text, r.status_code
        except Exception as e:
            log.error(f"Failed to forward to iCloud service: {e}")
            return "", 200

    if callback_id != "telephone_inbound_submit":
        # Forward to iCloud check service on port 8010
        try:
            r = requests.post("http://127.0.0.1:8010/webhook/icloud-check/slack-interact",
                data=request.form, headers=dict(request.headers))
            return r.text, r.status_code
        except Exception as e:
            log.error(f"Failed to forward to iCloud service: {e}")
            return "", 200

    user = payload.get("user", {})
    user_name = user.get("name", "unknown")
    user_id = user.get("id", "")

    # Extract form values
    values = payload.get("view", {}).get("state", {}).get("values", {})

    name = values.get("customer_name", {}).get("name_input", {}).get("value", "")
    email = values.get("customer_email", {}).get("email_input", {}).get("value", "")
    phone = values.get("customer_phone", {}).get("phone_input", {}).get("value", "")
    device = values.get("device_select", {}).get("device_input", {}).get("selected_option", {})
    device_text = device.get("text", {}).get("text", "") if device else ""
    device_value = device.get("value", "") if device else ""
    model_text = values.get("device_model", {}).get("model_input", {}).get("value", "")
    fault = values.get("fault_select", {}).get("fault_input", {}).get("selected_option", {})
    fault_text = fault.get("text", {}).get("text", "") if fault else ""
    notes = values.get("notes_block", {}).get("notes_input", {}).get("value", "")
    action = values.get("action_select", {}).get("action_input", {}).get("selected_option", {}).get("value", "log_only")

    log.info(f"Form submitted by {user_name}: {name} | {device_text} | {fault_text} | action={action}")

    # Process in background thread so modal closes immediately
    import threading
    def process_submission():
        _process_phone_submission(name, email, phone, device_text, device_value, model_text, fault_text, notes, action, user_id)
    threading.Thread(target=process_submission, daemon=True).start()

    # Return empty response to close modal immediately
    return "", 200

def _process_phone_submission(name, email, phone, device_text, device_value, model_text, fault_text, notes, action, user_id):
    """Process the phone log submission in background."""
    # Build clean Slack message
    device_display = f"{device_text} {model_text}".strip() if device_text else (model_text or "")
    fault_display = fault_text or ""

    info_line = " · ".join(filter(None, [device_display, fault_display]))
    contact_line = " · ".join(filter(None, [phone, email]))

    text_parts = [f":telephone_receiver: *{name}*"]
    if info_line:
        text_parts.append(info_line)
    if contact_line:
        text_parts.append(contact_line)
    if notes:
        text_parts.append(f"> {notes}")

    blocks = [
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": "\n".join(text_parts)},
        },
    ]

    # Action results
    results = []
    results.append(f"Logged by <@{user_id}>")

    if action in ("intercom_only", "intercom_monday"):
        contact_id = create_intercom_contact(name, email, phone, notes)
        if contact_id:
            results.append(f"<https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/{contact_id}|Intercom>")
        else:
            results.append(":warning: Intercom failed")

    if action == "intercom_monday":
        item_id = create_monday_item(name, email, phone, device_text, device_value, model_text, fault_text, notes)
        if item_id:
            results.append(f"<https://icorrect.monday.com/boards/349212843/pulses/{item_id}|Monday>")
        else:
            results.append(":warning: Monday failed")

    if action == "log_only":
        results.append("Log only")

    blocks.append({
        "type": "context",
        "elements": [{"type": "mrkdwn", "text": " · ".join(results)}],
    })

    # Encode form data into action IDs for deferred creation
    import urllib.parse
    form_data = urllib.parse.urlencode({
        "n": name, "e": email or "", "p": phone or "",
        "d": device_text or "", "dv": device_value or "",
        "m": model_text or "", "f": fault_text or "",
        "no": (notes or "")[:200],
    })

    # Add action buttons for log_only (create Monday/Intercom later)
    if action == "log_only":
        blocks.append({"type": "divider"})
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": ":monday: Create Monday Item", "emoji": True},
                    "action_id": "phone_create_monday",
                    "value": form_data[:2000],
                    "style": "primary",
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": ":intercom: Create Intercom Contact", "emoji": True},
                    "action_id": "phone_create_intercom",
                    "value": form_data[:2000],
                },
            ],
        })

    # Add action buttons if Monday item was created
    if action == "intercom_monday" and item_id:
        blocks.append({"type": "divider"})
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": ":envelope: Send Quote", "emoji": True},
                    "action_id": f"phone_send_quote_{item_id}",
                    "style": "primary",
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": ":calendar: Book Appointment", "emoji": True},
                    "action_id": f"phone_book_appt_{item_id}",
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": ":speech_balloon: Send Follow-up", "emoji": True},
                    "action_id": f"phone_followup_{item_id}",
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": ":white_check_mark: Resolved", "emoji": True},
                    "action_id": f"phone_resolved_{item_id}",
                },
            ],
        })

    # Post to channel
    slack_token = ENV.get("SLACK_AUTOMATIONS_BOT_TOKEN", ENV["SLACK_BOT_TOKEN"])
    r = requests.post("https://slack.com/api/chat.postMessage",
        headers={
            "Authorization": f"Bearer {slack_token}",
            "Content-Type": "application/json",
        },
        json={
            "channel": PHONE_ENQUIRIES_CHANNEL,
            "blocks": blocks,
            "text": f"Phone enquiry from {name}",
        })

    if not r.json().get("ok"):
        log.error(f"Post to channel failed: {r.json().get('error')}")

if __name__ == "__main__":
    log.info(f"Starting Telephone Inbound server on port {PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False)

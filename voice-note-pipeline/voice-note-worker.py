#!/usr/bin/env python3
"""
Voice Note Pipeline: Slack thread voice notes → Whisper transcription → Monday.com update

Monitors intake Slack channels for thread replies containing audio files.
When found:
1. Downloads the audio file
2. Transcribes via OpenAI Whisper API
3. Extracts Monday.com item ID from the parent message
4. Posts the transcription as an update on the Monday item

Channels monitored:
- walk-in-form-responses (C05KVLV2R6Z)
- appointment-form-responses (C09GW4LNBL7)
- collection-form-responses (C09G72DRZC7)
- pre-repair-form-responses (C09EVAHCLM6)
- walk-in-enquiries (C09LTQLRZUH)
"""

import os
import re
import sys
import json
import time
import tempfile
import logging
import requests
from pathlib import Path
from datetime import datetime, timezone

# ---- Config ----

CHANNELS = {
    "C05KVLV2R6Z": "walk-in-form-responses",
    "C09GW4LNBL7": "appointment-form-responses",
    "C09G72DRZC7": "collection-form-responses",
    "C09EVAHCLM6": "pre-repair-form-responses",
    "C09LTQLRZUH": "walk-in-enquiries",
    "C09TBEMJA2H": "phone-enquiries",
}

POLL_INTERVAL = 30  # seconds
STATE_FILE = Path(__file__).parent / ".voice-note-state.json"
LOG_FILE = Path(__file__).parent / "voice-note-worker.log"

AUDIO_MIMETYPES = {
    "audio/mp4", "audio/mpeg", "audio/ogg", "audio/webm",
    "audio/wav", "audio/x-m4a", "audio/aac", "audio/opus",
    "video/mp4", "video/webm",  # Slack sometimes marks voice notes as video
}

AUDIO_EXTENSIONS = {
    "mp3", "m4a", "mp4", "ogg", "webm", "wav", "aac", "opus", "oga",
}

# ---- Logging ----

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("voice-note-worker")

# ---- State ----

def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"processed": [], "last_check": {}}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

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

# ---- Slack ----

def slack_get(endpoint, params, token):
    r = requests.get(
        f"https://slack.com/api/{endpoint}",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
    )
    data = r.json()
    if not data.get("ok"):
        log.error(f"Slack API error ({endpoint}): {data.get('error', 'unknown')}")
    return data

def get_recent_messages(channel_id, token, oldest=None):
    """Get recent messages from a channel."""
    params = {"channel": channel_id, "limit": 20}
    if oldest:
        params["oldest"] = oldest
    return slack_get("conversations.history", params, token)

def get_thread_replies(channel_id, thread_ts, token):
    """Get all replies in a thread."""
    return slack_get("conversations.replies", {
        "channel": channel_id,
        "ts": thread_ts,
        "limit": 50,
    }, token)

def download_slack_file(url, token, dest_path):
    """Download a file from Slack."""
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, stream=True)
    if r.status_code == 200:
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    log.error(f"Failed to download file: {r.status_code}")
    return False

# ---- Whisper ----

def transcribe_audio(file_path, openai_key):
    """Transcribe audio file using OpenAI Whisper API."""
    with open(file_path, "rb") as f:
        r = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {openai_key}"},
            files={"file": (os.path.basename(file_path), f)},
            data={"model": "whisper-1", "response_format": "text"},
        )
    if r.status_code == 200:
        return r.text.strip()
    log.error(f"Whisper API error: {r.status_code} {r.text[:200]}")
    return None

# ---- Monday.com ----

def extract_monday_item_id(text, blocks=None):
    """Extract Monday.com item/pulse ID from message text or blocks."""
    # Check main text
    match = re.search(r"monday\.com/boards/\d+/pulses/(\d+)", text)
    if match:
        return match.group(1)
    # Check blocks (context elements, section text, etc.)
    if blocks:
        block_str = json.dumps(blocks)
        match = re.search(r"monday\.com/boards/\d+/pulses/(\d+)", block_str)
        if match:
            return match.group(1)
    return None

def post_monday_update(item_id, body, monday_token):
    """Post an update (comment) on a Monday.com item."""
    mutation = '''mutation ($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) {
            id
        }
    }'''
    r = requests.post(
        "https://api.monday.com/v2",
        json={"query": mutation, "variables": {"itemId": str(item_id), "body": body}},
        headers={
            "Authorization": monday_token,
            "Content-Type": "application/json",
        },
    )
    data = r.json()
    if "errors" in data:
        log.error(f"Monday API error: {data['errors']}")
        return None
    return data.get("data", {}).get("create_update", {}).get("id")

MONDAY_BOARD_ID = 349212843  # iCorrect Main Board

def extract_customer_name_from_typeform(text, blocks=None):
    """Extract customer name from a Typeform Slack notification."""
    # Typeform posts blocks with the form response. The name usually appears
    # after "Please confirm your name" or similar field label.
    if blocks:
        for i, block in enumerate(blocks):
            block_text = block.get("text", {}).get("text", "") if isinstance(block.get("text"), dict) else ""
            # Look for name field: the value is on the line after the label
            if "name" in block_text.lower():
                lines = block_text.strip().split("\n")
                if len(lines) >= 2:
                    name = lines[-1].strip()
                    if name and name != "*" and len(name) > 1:
                        return name
    # Fallback: parse from plain text (e.g. "Please confirm your name\nTimothy Githinji")
    if text:
        match = re.search(r"(?:name\s*\*?\s*\n)(.+)", text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def search_monday_item_by_name(customer_name, monday_token):
    """Search the iCorrect Main Board for an item matching the customer name.

    Matching priority:
    1. Items with ticket numbers (#XXXX) are preferred (active repairs)
    2. Among matches, prefer the newest item (highest ID = most recent)
    3. Exact name match beats partial match
    """
    parts = customer_name.strip().split()
    search_terms = []
    if len(parts) >= 2:
        search_terms.append(parts[-1])  # last name
    search_terms.append(customer_name)  # full name

    for term in search_terms:
        query = '''{ boards(ids: %d) { items_page(limit: 10, query_params: {rules: [{column_id: "name", compare_value: ["%s"], operator: contains_text}]}) { items { id name } } } }''' % (MONDAY_BOARD_ID, term.replace('"', '\\"'))
        r = requests.post(
            "https://api.monday.com/v2",
            json={"query": query},
            headers={
                "Authorization": monday_token,
                "Content-Type": "application/json",
            },
        )
        data = r.json()
        items = data.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("items", [])

        if not items:
            continue

        if len(items) == 1:
            log.info(f"Monday search: found '{items[0]['name']}' (id {items[0]['id']}) for '{term}'")
            return items[0]["id"]

        # Multiple results: score and rank them
        def score_item(item):
            name = item["name"]
            item_id = int(item["id"])
            s = 0
            # Prefer items with ticket numbers (#XXXX) - these are active repairs
            if re.match(r"#\d+", name):
                s += 1000000
            # Prefer exact name match over partial
            if customer_name.lower() == name.lower().split(" - ", 1)[-1].strip().lower():
                s += 500000
            # Prefer newer items (higher ID)
            s += item_id // 1000000  # normalize to reasonable range
            return s

        ranked = sorted(items, key=score_item, reverse=True)
        winner = ranked[0]
        log.info(f"Monday search: {len(items)} results for '{term}', ranked winner: '{winner['name']}' (id {winner['id']}) over {[i['name'] for i in ranked[1:]]}")
        return winner["id"]

    log.warning(f"Monday search: no items found for '{customer_name}'")
    return None

def post_slack_reply(channel_id, thread_ts, text, token):
    """Post a reply in a Slack thread."""
    r = requests.post(
        "https://slack.com/api/chat.postMessage",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "channel": channel_id,
            "thread_ts": thread_ts,
            "text": text,
        },
    )
    return r.json().get("ok", False)

# ---- Core Logic ----

def is_audio_file(file_info):
    """Check if a Slack file is an audio/voice note."""
    mimetype = file_info.get("mimetype", "")
    filetype = file_info.get("filetype", "")
    name = file_info.get("name", "")
    subtype = file_info.get("subtype", "")

    # Slack voice huddle clips
    if subtype == "slack_audio":
        return True
    # Check mimetype
    if mimetype in AUDIO_MIMETYPES:
        return True
    # Check extension
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext in AUDIO_EXTENSIONS:
        return True
    # Check filetype
    if filetype in AUDIO_EXTENSIONS:
        return True
    return False

def process_channel(channel_id, channel_name, env, state):
    """Check a channel for threads with voice note replies."""
    slack_token = env["SLACK_BOT_TOKEN"]
    openai_key = env.get("OPENAI_API_KEY", "")

    # Get OpenAI key from auth profiles if not in env
    if not openai_key:
        auth_file = Path("/home/ricky/.openclaw/agents/main/agent/auth-profiles.json")
        if auth_file.exists():
            with open(auth_file) as f:
                auth = json.load(f)
            openai_key = auth.get("profiles", {}).get("openai:default", {}).get("key", "")

    monday_token = env["MONDAY_APP_TOKEN"]

    # Get recent messages (no oldest filter - thread replies can be new on old parents)
    data = get_recent_messages(channel_id, slack_token)

    if not data.get("ok"):
        return

    messages = data.get("messages", [])
    processed_keys = set(state.get("processed", []))

    for msg in messages:
        ts = msg.get("ts", "")
        thread_ts = msg.get("thread_ts", ts)

        # Check for Monday link in parent message
        monday_item_id = extract_monday_item_id(msg.get("text", ""), msg.get("blocks"))

        # Check for thread replies
        if int(float(msg.get("reply_count", 0))) == 0:
            continue

        thread_data = get_thread_replies(channel_id, ts, slack_token)
        if not thread_data.get("ok"):
            continue

        # If parent has no Monday link, scan thread replies for one
        if not monday_item_id:
            for reply in thread_data.get("messages", [])[1:]:
                monday_item_id = extract_monday_item_id(reply.get("text", ""), reply.get("blocks"))
                if monday_item_id:
                    break

        # Still no Monday link? Try searching Monday by customer name from parent message
        if not monday_item_id:
            customer_name = extract_customer_name_from_typeform(msg.get("text", ""), msg.get("blocks"))
            if customer_name:
                monday_item_id = search_monday_item_by_name(customer_name, monday_token)

        if not monday_item_id:
            continue

        for reply in thread_data.get("messages", [])[1:]:  # skip parent
            reply_ts = reply.get("ts", "")
            reply_key = f"{channel_id}:{reply_ts}"

            if reply_key in processed_keys:
                continue

            # Skip bot's own messages
            if reply.get("bot_id") or reply.get("user") == "U0AD23M53CZ":
                processed_keys.add(reply_key)
                continue

            # Check for audio files
            files = reply.get("files", [])
            audio_files = [f for f in files if is_audio_file(f)]

            if not audio_files:
                continue

            # Process each audio file
            for audio_file in audio_files:
                file_name = audio_file.get("name", "voice_note")
                file_url = audio_file.get("url_private_download", audio_file.get("url_private", ""))

                if not file_url:
                    log.warning(f"No download URL for file {file_name}")
                    continue

                log.info(f"Processing voice note: {file_name} in #{channel_name} -> Monday item {monday_item_id}")

                # Download - use filetype from Slack metadata for extension
                ext = audio_file.get("filetype", "m4a") or "m4a"
                with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                    tmp_path = tmp.name

                try:
                    if not download_slack_file(file_url, slack_token, tmp_path):
                        continue

                    # Transcribe
                    transcript = transcribe_audio(tmp_path, openai_key)
                    if not transcript:
                        log.error(f"Transcription failed for {file_name}")
                        continue

                    log.info(f"Transcription ({len(transcript)} chars): {transcript[:100]}...")

                    # Get poster info
                    poster = reply.get("user", "unknown")
                    poster_info = slack_get("users.info", {"user": poster}, slack_token)
                    poster_name = poster_info.get("user", {}).get("real_name", poster)

                    # Post to Monday
                    timestamp = datetime.fromtimestamp(float(reply_ts), tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                    body = f"<strong>Voice Note Transcription</strong><br>From: {poster_name}<br>Time: {timestamp}<br><br>{transcript}"

                    update_id = post_monday_update(monday_item_id, body, monday_token)

                    if update_id:
                        log.info(f"Posted to Monday item {monday_item_id} (update {update_id})")

                        # Confirm in Slack thread
                        post_slack_reply(
                            channel_id, ts,
                            f":white_check_mark: Voice note transcribed and added to Monday item.\n> _{transcript[:200]}{'...' if len(transcript) > 200 else ''}_",
                            slack_token,
                        )
                    else:
                        log.error(f"Failed to post to Monday item {monday_item_id}")

                finally:
                    # Cleanup temp file
                    try:
                        os.unlink(tmp_path)
                    except OSError:
                        pass

            # Mark as processed
            processed_keys.add(reply_key)

    # Keep only last 500 processed keys
    state["processed"] = list(processed_keys)[-500:]
    state.setdefault("last_check", {})[channel_id] = str(time.time())

def main():
    log.info("Voice Note Worker starting...")
    env = load_env()

    # Validate required keys
    required = ["SLACK_BOT_TOKEN", "MONDAY_APP_TOKEN"]
    for key in required:
        if key not in env:
            log.error(f"Missing required env var: {key}")
            return

    state = load_state()

    while True:
        try:
            for channel_id, channel_name in CHANNELS.items():
                try:
                    process_channel(channel_id, channel_name, env, state)
                except Exception as e:
                    log.error(f"Error processing #{channel_name}: {e}", exc_info=True)

            save_state(state)
            log.debug("Poll cycle complete")
            sys.stdout.flush()
            sys.stderr.flush()

        except KeyboardInterrupt:
            log.info("Shutting down...")
            save_state(state)
            break
        except Exception as e:
            log.error(f"Error in main loop: {e}", exc_info=True)

        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()

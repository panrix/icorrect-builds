#!/usr/bin/env python3
"""
Intercom Cleanup Tool
Phase 1: Baseline hardening for Intercom Agent SPEC

Tasks:
1. Bulk close conversations pre-2025 (legacy Zendesk imports)
2. Tag/archive Zendesk imports with zendesk-archive tag
3. Contact cleanup (duplicates, anonymous leads)
4. Tag sanitation (remove deprecated tags)
5. Resolve unassigned open conversations

Usage:
  python cleanup.py audit          # Run audit without making changes
  python cleanup.py close-legacy   # Close pre-2025 conversations
  python cleanup.py tag-zendesk    # Apply zendesk-archive tag
  python cleanup.py cleanup-tags   # Remove deprecated tags
  python cleanup.py fix-unassigned # Assign/close unassigned conversations
  python cleanup.py contacts       # Audit contact cleanup needs
"""

import os
import sys
import json
import time
import logging
import argparse
from datetime import datetime
from pathlib import Path

import requests

# ---- Config ----

WORKSPACE_ID = "xnj51kwx"
ADMIN_ID = "9702338"  # Alex/Fin admin ID

LOG_FILE = Path(__file__).parent / "cleanup.log"

# Deprecated tags to remove
DEPRECATED_TAGS = ["Feature Request", "create"]

# Pre-2025 cutoff (Unix timestamp: 2025-01-01 00:00:00 UTC)
LEGACY_CUTOFF = 1735689600

# ---- Logging ----

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("intercom-cleanup")

# ---- Env ----

def load_env():
    env = {}
    env_file = Path("/home/ricky/config/api-keys/.env")
    if not env_file.exists():
        log.warning(f"Env file not found: {env_file}")
        return env
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env

ENV = load_env()

def get_token():
    token = ENV.get("INTERCOM_ACCESS_TOKEN", ENV.get("INTERCOM_API_TOKEN", ""))
    if not token:
        log.error("No INTERCOM_ACCESS_TOKEN configured in env")
        sys.exit(1)
    return token

# ---- API Helpers ----

def api_request(method, endpoint, data=None, params=None):
    """Make Intercom API request with rate limiting."""
    token = get_token()
    url = f"https://api.intercom.io{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Intercom-Version": "2.11",
    }

    for attempt in range(3):
        try:
            if method == "GET":
                r = requests.get(url, headers=headers, params=params)
            elif method == "POST":
                r = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                r = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                r = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unknown method: {method}")

            # Handle rate limiting
            if r.status_code == 429:
                retry_after = int(r.headers.get("Retry-After", 10))
                log.warning(f"Rate limited, waiting {retry_after}s...")
                time.sleep(retry_after)
                continue

            r.raise_for_status()
            return r.json() if r.text else {}

        except requests.exceptions.HTTPError as e:
            log.error(f"API error: {e} - {r.text}")
            if attempt < 2:
                time.sleep(2 ** attempt)
            else:
                raise

    return {}

def search_conversations(query, per_page=50):
    """Search conversations with pagination."""
    all_conversations = []
    starting_after = None

    while True:
        payload = {
            "query": query,
            "pagination": {"per_page": per_page},
        }
        if starting_after:
            payload["pagination"]["starting_after"] = starting_after

        result = api_request("POST", "/conversations/search", data=payload)
        conversations = result.get("conversations", [])
        all_conversations.extend(conversations)

        # Check for more pages
        pages = result.get("pages", {})
        if pages.get("next"):
            starting_after = pages["next"].get("starting_after")
            if not starting_after:
                break
        else:
            break

        log.info(f"Fetched {len(all_conversations)} conversations so far...")
        time.sleep(0.5)  # Rate limit protection

    return all_conversations

def search_contacts(query, per_page=50):
    """Search contacts with pagination."""
    all_contacts = []
    starting_after = None

    while True:
        payload = {
            "query": query,
            "pagination": {"per_page": per_page},
        }
        if starting_after:
            payload["pagination"]["starting_after"] = starting_after

        result = api_request("POST", "/contacts/search", data=payload)
        contacts = result.get("data", [])
        all_contacts.extend(contacts)

        # Check for more pages
        pages = result.get("pages", {})
        if pages.get("next"):
            starting_after = pages["next"].get("starting_after")
            if not starting_after:
                break
        else:
            break

        log.info(f"Fetched {len(all_contacts)} contacts so far...")
        time.sleep(0.5)

    return all_contacts

# ---- Cleanup Functions ----

def audit_all():
    """Run full audit without making changes."""
    log.info("=" * 60)
    log.info("INTERCOM CLEANUP AUDIT")
    log.info("=" * 60)

    # 1. Count pre-2025 open conversations
    log.info("\n--- Legacy Conversations (pre-2025) ---")
    legacy_query = {
        "operator": "AND",
        "value": [
            {"field": "created_at", "operator": "<", "value": LEGACY_CUTOFF},
            {"field": "state", "operator": "=", "value": "open"},
        ],
    }
    legacy_convs = search_conversations(legacy_query)
    log.info(f"Open conversations pre-2025: {len(legacy_convs)}")

    # 2. Count conversations with CSV Import tag (Zendesk imports)
    log.info("\n--- Zendesk Imports (CSV Import tag) ---")
    # Search for conversations with specific tags
    zendesk_query = {
        "operator": "AND",
        "value": [
            {"field": "tag_ids", "operator": "IN", "value": ["CSV Import"]},
        ],
    }
    try:
        zendesk_convs = search_conversations(zendesk_query)
        log.info(f"Conversations with CSV Import tag: {len(zendesk_convs)}")
    except Exception as e:
        log.warning(f"Could not search by tag: {e}")
        log.info("Manual check required for CSV Import tagged conversations")

    # 3. Count contacts without email
    log.info("\n--- Anonymous Contacts (no email) ---")
    anon_query = {
        "operator": "AND",
        "value": [
            {"field": "email", "operator": "=", "value": None},
            {"field": "role", "operator": "=", "value": "lead"},
        ],
    }
    try:
        anon_contacts = search_contacts(anon_query)
        log.info(f"Anonymous leads (no email): {len(anon_contacts)}")
    except Exception as e:
        log.warning(f"Could not search anonymous contacts: {e}")

    # 4. Count unassigned open conversations
    log.info("\n--- Unassigned Open Conversations ---")
    unassigned_query = {
        "operator": "AND",
        "value": [
            {"field": "state", "operator": "=", "value": "open"},
            {"field": "admin_assignee_id", "operator": "=", "value": None},
        ],
    }
    try:
        unassigned_convs = search_conversations(unassigned_query)
        log.info(f"Unassigned open conversations: {len(unassigned_convs)}")
    except Exception as e:
        log.warning(f"Could not search unassigned: {e}")

    # 5. List all tags
    log.info("\n--- Tags Audit ---")
    try:
        tags = api_request("GET", "/tags")
        all_tags = tags.get("data", [])
        log.info(f"Total tags: {len(all_tags)}")
        for tag in all_tags:
            log.info(f"  - {tag.get('name')} (id: {tag.get('id')})")

        # Check for deprecated
        deprecated_found = [t for t in all_tags if t.get("name") in DEPRECATED_TAGS]
        if deprecated_found:
            log.info(f"\nDeprecated tags found: {[t['name'] for t in deprecated_found]}")
    except Exception as e:
        log.warning(f"Could not list tags: {e}")

    log.info("\n" + "=" * 60)
    log.info("AUDIT COMPLETE")
    log.info("=" * 60)

def close_legacy_conversations(dry_run=True):
    """Close all open conversations pre-2025."""
    log.info("Searching for pre-2025 open conversations...")

    query = {
        "operator": "AND",
        "value": [
            {"field": "created_at", "operator": "<", "value": LEGACY_CUTOFF},
            {"field": "state", "operator": "=", "value": "open"},
        ],
    }
    conversations = search_conversations(query)
    log.info(f"Found {len(conversations)} conversations to close")

    if dry_run:
        log.info("DRY RUN - no changes made")
        for conv in conversations[:10]:  # Show first 10
            created = datetime.fromtimestamp(conv.get("created_at", 0))
            log.info(f"  Would close: {conv.get('id')} (created: {created})")
        if len(conversations) > 10:
            log.info(f"  ... and {len(conversations) - 10} more")
        return

    closed = 0
    for conv in conversations:
        try:
            api_request("POST", f"/conversations/{conv['id']}/parts", data={
                "message_type": "close",
                "admin_id": ADMIN_ID,
                "body": "Closed as part of legacy cleanup (pre-2025 Zendesk import)",
            })
            closed += 1
            log.info(f"Closed conversation {conv['id']}")
            time.sleep(0.5)  # Rate limiting
        except Exception as e:
            log.error(f"Failed to close {conv['id']}: {e}")

    log.info(f"Closed {closed}/{len(conversations)} conversations")

def tag_zendesk_imports(dry_run=True):
    """Apply zendesk-archive tag to CSV Import conversations."""
    log.info("Searching for Zendesk imports...")

    # First, ensure zendesk-archive tag exists
    if not dry_run:
        try:
            api_request("POST", "/tags", data={"name": "zendesk-archive"})
            log.info("Created zendesk-archive tag")
        except Exception as e:
            log.info("zendesk-archive tag may already exist")

    # Search for CSV Import tagged conversations
    query = {
        "field": "tag_ids",
        "operator": "IN",
        "value": ["CSV Import"],
    }

    try:
        conversations = search_conversations({"query": query})
        log.info(f"Found {len(conversations)} Zendesk imports to tag")

        if dry_run:
            log.info("DRY RUN - no changes made")
            return

        tagged = 0
        for conv in conversations:
            try:
                api_request("POST", f"/conversations/{conv['id']}/tags", data={
                    "id": "zendesk-archive",
                })
                tagged += 1
                log.info(f"Tagged conversation {conv['id']}")
                time.sleep(0.3)
            except Exception as e:
                log.error(f"Failed to tag {conv['id']}: {e}")

        log.info(f"Tagged {tagged}/{len(conversations)} conversations")

    except Exception as e:
        log.error(f"Search failed: {e}")
        log.info("May need to manually identify Zendesk imports")

def cleanup_deprecated_tags(dry_run=True):
    """Remove deprecated tags."""
    log.info("Fetching all tags...")

    tags = api_request("GET", "/tags")
    all_tags = tags.get("data", [])

    deprecated = [t for t in all_tags if t.get("name") in DEPRECATED_TAGS]
    log.info(f"Found {len(deprecated)} deprecated tags to remove")

    if dry_run:
        log.info("DRY RUN - no changes made")
        for tag in deprecated:
            log.info(f"  Would delete: {tag['name']} (id: {tag['id']})")
        return

    for tag in deprecated:
        try:
            api_request("DELETE", f"/tags/{tag['id']}")
            log.info(f"Deleted tag: {tag['name']}")
        except Exception as e:
            log.error(f"Failed to delete tag {tag['name']}: {e}")

def fix_unassigned_conversations(dry_run=True):
    """Assign or close unassigned open conversations."""
    log.info("Searching for unassigned open conversations...")

    query = {
        "operator": "AND",
        "value": [
            {"field": "state", "operator": "=", "value": "open"},
            {"field": "admin_assignee_id", "operator": "=", "value": None},
        ],
    }

    conversations = search_conversations(query)
    log.info(f"Found {len(conversations)} unassigned conversations")

    if dry_run:
        log.info("DRY RUN - no changes made")
        for conv in conversations[:10]:
            created = datetime.fromtimestamp(conv.get("created_at", 0))
            log.info(f"  {conv.get('id')} (created: {created})")
        if len(conversations) > 10:
            log.info(f"  ... and {len(conversations) - 10} more")
        return

    # Strategy: Close old ones, assign recent ones to team
    now = time.time()
    one_week_ago = now - (7 * 24 * 60 * 60)

    for conv in conversations:
        try:
            created_at = conv.get("created_at", 0)
            if created_at < one_week_ago:
                # Old conversation - close it
                api_request("POST", f"/conversations/{conv['id']}/parts", data={
                    "message_type": "close",
                    "admin_id": ADMIN_ID,
                    "body": "Closed - unassigned for over a week",
                })
                log.info(f"Closed old unassigned conversation {conv['id']}")
            else:
                # Recent - assign to team inbox
                api_request("PUT", f"/conversations/{conv['id']}", data={
                    "admin_assignee_id": ADMIN_ID,
                })
                log.info(f"Assigned conversation {conv['id']} to default admin")

            time.sleep(0.3)
        except Exception as e:
            log.error(f"Failed to process {conv['id']}: {e}")

def audit_contacts():
    """Audit contact cleanup needs."""
    log.info("Auditing contacts...")

    # Count anonymous leads
    log.info("\n--- Anonymous Leads ---")
    try:
        # Get all leads without email
        result = api_request("POST", "/contacts/search", data={
            "query": {
                "operator": "AND",
                "value": [
                    {"field": "role", "operator": "=", "value": "lead"},
                ],
            },
            "pagination": {"per_page": 1},
        })
        total = result.get("total_count", 0)
        log.info(f"Total leads: {total}")
    except Exception as e:
        log.warning(f"Could not count leads: {e}")

    # Note: Full duplicate detection would require iterating all contacts
    # and comparing emails, which is expensive. Recommend using Intercom's
    # built-in merge functionality or a dedicated ETL job.

    log.info("\n--- Duplicate Detection ---")
    log.info("NOTE: Full duplicate detection requires manual review or")
    log.info("using Intercom's built-in contact merge functionality.")
    log.info("Recommendation: Export contacts and use pandas to identify duplicates.")

# ---- Main ----

def main():
    parser = argparse.ArgumentParser(description="Intercom Cleanup Tool")
    parser.add_argument("command", choices=[
        "audit", "close-legacy", "tag-zendesk", "cleanup-tags",
        "fix-unassigned", "contacts"
    ], help="Cleanup command to run")
    parser.add_argument("--execute", action="store_true",
        help="Actually make changes (default is dry run)")

    args = parser.parse_args()
    dry_run = not args.execute

    if dry_run and args.command != "audit" and args.command != "contacts":
        log.info("Running in DRY RUN mode. Use --execute to make changes.")

    if args.command == "audit":
        audit_all()
    elif args.command == "close-legacy":
        close_legacy_conversations(dry_run)
    elif args.command == "tag-zendesk":
        tag_zendesk_imports(dry_run)
    elif args.command == "cleanup-tags":
        cleanup_deprecated_tags(dry_run)
    elif args.command == "fix-unassigned":
        fix_unassigned_conversations(dry_run)
    elif args.command == "contacts":
        audit_contacts()

if __name__ == "__main__":
    main()

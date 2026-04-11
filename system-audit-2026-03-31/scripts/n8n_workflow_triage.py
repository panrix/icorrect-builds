#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


BASE_URL = "https://icorrect.app.n8n.cloud/api/v1"
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
ROOT = Path("/home/ricky/builds/system-audit-2026-03-31")
AUDIT_MD = ROOT / "n8n-workflow-audit.md"
ARCH_MD = ROOT / "systems-architecture.md"
DATA_FLOWS_MD = ROOT / "data_flows.md"
OUTPUT_MD = ROOT / "n8n-workflow-triage.md"


INTEGRATION_NEEDS = [
    "Shopify order processing",
    "Monday status updates",
    "Intercom routing",
    "BackMarket notifications",
    "Xero invoicing",
    "Typeform intake",
    "Royal Mail tracking",
    "Stripe/SumUp payment processing",
    "Google Sheets/Docs reporting",
]


KNOWN_REACTIVATE = {
    "jFO6pZajYehztkBr": {
        "purpose": "Move Back Market received devices from Incoming Future to Today's Repairs.",
        "why": "The intake-flow and previous audit both say this handoff is still manual and remains a documented gap.",
        "dependencies": "Validate BM received-state logic, confirm schedule guard, and re-check Monday group IDs before reactivation or rebuild.",
    },
    "qFL8bw5M3dO7dudw": {
        "purpose": "Create Intercom ticket/context when a Monday item is created manually.",
        "why": "Manual Monday-created repairs still fragment customer context and lack automatic Intercom linkage.",
        "dependencies": "Confirm the live Monday item-created webhook owner and whether telephone/manual intake should use this path or a VPS replacement.",
    },
}


KNOWN_CLASSIFICATIONS = {
    "1Y8l1EzfEq3Vknnf": ("Inactive & Redundant", "Old Back Market SENT ingestion replaced by sent-orders.js."),
    "265ZpcNEflZkkmQP": ("Inactive & Redundant", "Parts deduction now runs on icorrect-parts.service."),
    "2ER8uOIFzWWdVu7s": ("Inactive & Redundant", "Older Back Market device listing logic superseded by list-device.js."),
    "2T9SaIUzDWxGSTzp": ("Duplicate", "Older Shopify contact-form path is superseded by the active Shopify Contact Form workflow."),
    "53uU6v2F5417sZCZ": ("Inactive & Redundant", "Manual Shopify backfill utility superseded by the live Shopify order ingestion workflow."),
    "69BCMOtdUyFWDDEV": ("Inactive & Redundant", "Back Market listing ownership moved to list-device.js."),
    "D4a5qbCtQmSCUIeT": ("Inactive & Redundant", "Back Market ship confirmation ownership moved to bm-shipping."),
    "GJbVeldhpWU1KEG3": ("Inactive & Redundant", "Back Market SENT ingestion ownership moved to sent-orders.js."),
    "HiBBMCmPveasFgoS": ("Duplicate", "Older Shopify contact-form variant overlaps the active Shopify Contact Form workflow."),
    "HsDqOaIDwT5DEjCn": ("Inactive & Redundant", "Back Market sale detection ownership moved to sale-detection.js."),
    "KDrCWzzvkcRlx05m": ("Inactive & Redundant", "Old iCloud check webhook replaced by icloud-checker."),
    "KRNukgA2aqIbuNNL": ("Inactive & Redundant", "iCloud recheck ownership moved to icloud-checker."),
    "P63LxzYz1fQVljAk": ("Inactive & Experimental", "Empty placeholder workflow."),
    "PDX14Qhpy9ST5MMz": ("Inactive & Experimental", "Manual refurbished-device prototype with no current owner."),
    "QumCicIBpDaYhNVH": ("Inactive & Redundant", "Manual reporting export, not a required live runtime."),
    "Rq5ExX0U2psyR0Uo": ("Inactive & Unknown", "Placeholder name with no durable business purpose evidenced."),
    "bTVTAJ5bFYhKHAdO": ("Inactive & Redundant", "Manual Shopify fetch utility, not part of live automation."),
    "bevxQRRcvNitDLnl": ("Inactive & Redundant", "Reporting export utility, not part of live automation."),
    "btkrEM0CR1obglLo": ("Inactive & Redundant", "Manual export utility, not part of live automation."),
    "gU8alMqvddNjebf6": ("Inactive & Redundant", "Back Market iCloud/spec logic moved to icloud-checker."),
    "gUhXDHKwNDfjDD43": ("Inactive & Redundant", "Manual Monday extraction utility, not a production owner."),
    "hN3OMNQnWPYWiHrT": ("Inactive & Redundant", "Manual Intercom admin utility, not a production owner."),
    "hiD0aYgGPZNftz9R": ("Inactive & Redundant", "Dormant Google Calendar utility with no current documented owner."),
    "jFO6pZajYehztkBr": ("Inactive & Needed", "Documented BM arrival handoff gap still exists."),
    "jejshaqrAcySKch8": ("Duplicate", "Older duplicate of the BM device received movement flow."),
    "lGiPEDaZBfUjuA7h": ("Inactive & Redundant", "Back Market payout ownership moved to bm-payout."),
    "lM6YhEIGVCi8SoXE": ("Inactive & Redundant", "Manual Intercom admin cleanup utility, not a runtime owner."),
    "ljIYigT4NRnW7RrG": ("Inactive & Experimental", "Explicitly a test workflow."),
    "mnUM1aRlGmbweJDK": ("Inactive & Experimental", "One-time board setup workflow."),
    "naQD6GDgP5PsKFOU": ("Inactive & Experimental", "Price-scraper test workflow."),
    "pSkBxoea5B40lyJt": ("Inactive & Redundant", "Back Market iCloud/spec logic moved to icloud-checker."),
    "q7yZbgEex8VTqaOf": ("Inactive & Unknown", "Generic name and no documented durable business owner."),
    "qFL8bw5M3dO7dudw": ("Inactive & Needed", "Manual Monday-created items still lack automatic Intercom linkage."),
    "qqmQxVDyX7TRULJw": ("Inactive & Experimental", "Discovery/prototype workflow."),
    "thgfHbRODtBPKSLT": ("Inactive & Experimental", "Single-node test webhook."),
    "v3UYWQyVGehMJSY9": ("Inactive & Experimental", "Prototype single-order BM ingestion flow."),
    "vSWGYBWw0KEXcG2i": ("Inactive & Redundant", "Old iCloud/spec checker replaced by icloud-checker."),
    "z3PnTbW5i1lIOeYI": ("Inactive & Redundant", "Back Market iCloud checker replaced by icloud-checker."),
    "zbiPD6yMzbQ6vIob": ("Duplicate", "Older Shopify order ingestion overlaps the active Shopify order workflow."),
}


TYPE_LABELS = {
    "n8n-nodes-base.webhook": "Webhook",
    "n8n-nodes-base.scheduleTrigger": "Cron",
    "n8n-nodes-base.typeformTrigger": "Typeform",
    "n8n-nodes-base.shopifyTrigger": "Shopify event",
    "n8n-nodes-base.manualTrigger": "Manual",
    "n8n-nodes-base.formTrigger": "Form",
}


SERVICE_LABELS = {
    "mondayCom": "Monday",
    "shopify": "Shopify",
    "intercom": "Intercom",
    "typeform": "Typeform",
    "slack": "Slack",
    "googleSheets": "Google Sheets",
    "googleDocs": "Google Docs",
    "googleDrive": "Google Drive",
    "googleCalendar": "Google Calendar",
    "gmail": "Gmail",
    "xero": "Xero",
    "emailSend": "Email",
    "smtp": "SMTP",
    "httpRequest": "HTTP",
    "telegram": "Telegram",
    "readBinaryFile": "Filesystem",
    "writeBinaryFile": "Filesystem",
}


def parse_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
            value = value[1:-1]
        env[key] = value
    return env


def iso_to_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def dt_to_iso(dt: datetime | None) -> str:
    return dt.isoformat().replace("+00:00", "Z") if dt else ""


def short_dt(value: str | None) -> str:
    dt = iso_to_dt(value)
    return dt.strftime("%Y-%m-%d %H:%M UTC") if dt else "Never"


def md_escape(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ").strip()


def sanitize_error_message(message: str | None) -> str | None:
    if not message:
        return None
    cleaned = re.sub(r"[\w.+-]+@[\w.-]+\.\w+", "<email>", message)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:220]


class N8nApi:
    def __init__(self, token: str, base_url: str = BASE_URL, pause_s: float = 0.0) -> None:
        self.token = token
        self.base_url = base_url.rstrip("/")
        self.pause_s = pause_s

    def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{path}"
        if params:
            query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
            url = f"{url}?{query}"
        req = urllib.request.Request(url)
        req.add_header("X-N8N-API-KEY", self.token)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = resp.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {exc.code} for {url}: {detail[:500]}") from exc
        if self.pause_s:
            time.sleep(self.pause_s)
        return json.loads(body.decode("utf-8"))

    def paginate(self, path: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        params = dict(params or {})
        out: list[dict[str, Any]] = []
        cursor = None
        while True:
            page_params = dict(params)
            if cursor:
                page_params["cursor"] = cursor
            payload = self.get(path, page_params)
            out.extend(payload.get("data", []))
            cursor = payload.get("nextCursor")
            if not cursor:
                break
        return out


@dataclass
class WorkflowSummary:
    id: str
    name: str
    active: bool
    created_at: str | None
    updated_at: str | None
    trigger: str
    services: list[str]
    node_types: list[str]
    nodes: int
    classification: str
    classification_reason: str
    last_execution_at: str | None
    last_execution_status: str | None
    last_success_at: str | None
    last_error_at: str | None
    executions_30d: int
    successes_30d: int
    errors_30d: int
    waiting_30d: int
    latest_error_message: str | None
    latest_error_node: str | None
    notes: str


def extract_trigger(detail: dict[str, Any]) -> str:
    labels: list[str] = []
    for node in detail.get("nodes", []):
        node_type = node.get("type", "")
        if node_type in TYPE_LABELS:
            label = TYPE_LABELS[node_type]
            if node_type == "n8n-nodes-base.webhook":
                path = (((node.get("parameters") or {}).get("path")) or "").strip()
                if path:
                    label = f"Webhook `{path}`"
            elif node_type == "n8n-nodes-base.typeformTrigger":
                form_id = (((node.get("parameters") or {}).get("formId")) or "").strip()
                if form_id:
                    label = f"Typeform `{form_id}`"
            elif node_type == "n8n-nodes-base.shopifyTrigger":
                topic = (((node.get("parameters") or {}).get("topic")) or "").strip()
                if topic:
                    label = f"Shopify `{topic}`"
            labels.append(label)
    if not labels:
        return "Unknown"
    deduped: list[str] = []
    for label in labels:
        if label not in deduped:
            deduped.append(label)
    return " + ".join(deduped)


def extract_services(detail: dict[str, Any]) -> list[str]:
    services: list[str] = []

    def collect_strings(value: Any) -> list[str]:
        out: list[str] = []
        if isinstance(value, str):
            out.append(value)
        elif isinstance(value, dict):
            for item in value.values():
                out.extend(collect_strings(item))
        elif isinstance(value, list):
            for item in value:
                out.extend(collect_strings(item))
        return out

    for node in detail.get("nodes", []):
        node_type = node.get("type", "")
        suffix = node_type.split(".")[-1]
        label = SERVICE_LABELS.get(suffix)
        if not label:
            if suffix.endswith("Trigger"):
                suffix = suffix[:-7]
            label = SERVICE_LABELS.get(suffix)
        if not label:
            if "monday" in node_type.lower():
                label = "Monday"
            elif "shopify" in node_type.lower():
                label = "Shopify"
            elif "intercom" in node_type.lower():
                label = "Intercom"
            elif "typeform" in node_type.lower():
                label = "Typeform"
            elif "xero" in node_type.lower():
                label = "Xero"
            elif "slack" in node_type.lower():
                label = "Slack"
        haystack = " ".join(
            [node.get("name", ""), node.get("type", "")]
            + collect_strings(node.get("parameters") or {})
        ).lower()
        for needle, inferred in [
            ("monday", "Monday"),
            ("intercom", "Intercom"),
            ("shopify", "Shopify"),
            ("typeform", "Typeform"),
            ("xero", "Xero"),
            ("slack", "Slack"),
            ("googleapis.com", "Google"),
            ("docs.google.com", "Google Docs"),
            ("sheets.googleapis.com", "Google Sheets"),
            ("drive.google.com", "Google Drive"),
            ("calendar", "Google Calendar"),
            ("api.telegram.org", "Telegram"),
            ("backmarket", "BackMarket"),
            ("royalmail", "Royal Mail"),
            ("royal mail", "Royal Mail"),
            ("stripe", "Stripe"),
            ("sumup", "SumUp"),
        ]:
            if needle in haystack:
                label = inferred if not label else label
                if inferred not in services:
                    services.append(inferred)
        if label and label not in services:
            services.append(label)
    return services


def extract_node_types(detail: dict[str, Any]) -> list[str]:
    out: list[str] = []
    for node in detail.get("nodes", []):
        node_type = node.get("type", "")
        short = node_type.split(".")[-1]
        if short not in out:
            out.append(short)
    return out


def summarize_recent_activity(executions: list[dict[str, Any]], cutoff: datetime) -> dict[str, Any]:
    latest = executions[0] if executions else None
    recent = [item for item in executions if (iso_to_dt(item.get("startedAt")) or cutoff) >= cutoff]
    success_recent = [item for item in recent if item.get("status") == "success"]
    error_recent = [item for item in recent if item.get("status") == "error"]
    waiting_recent = [item for item in recent if item.get("status") not in {"success", "error"}]
    last_success = next((item for item in executions if item.get("status") == "success"), None)
    last_error = next((item for item in executions if item.get("status") == "error"), None)
    return {
        "latest": latest,
        "recent": recent,
        "success_recent": success_recent,
        "error_recent": error_recent,
        "waiting_recent": waiting_recent,
        "last_success": last_success,
        "last_error": last_error,
    }


def fetch_execution_history(api: N8nApi, workflow_id: str, cutoff: datetime) -> list[dict[str, Any]]:
    limit = 250
    cursor = None
    out: list[dict[str, Any]] = []
    while True:
        params: dict[str, Any] = {"limit": limit, "workflowId": workflow_id}
        if cursor:
            params["cursor"] = cursor
        payload = api.get("/executions", params)
        batch = payload.get("data", [])
        out.extend(batch)
        cursor = payload.get("nextCursor")
        if not batch or not cursor:
            break
        oldest_started = iso_to_dt(batch[-1].get("startedAt"))
        if oldest_started and oldest_started < cutoff:
            break
    return out


def fetch_error_detail(api: N8nApi, execution_id: str) -> tuple[str | None, str | None]:
    payload = api.get(f"/executions/{execution_id}", {"includeData": "true"})
    result = ((payload.get("data") or {}).get("resultData") or {})
    error = result.get("error") or {}
    message = sanitize_error_message(error.get("message") or error.get("description"))
    node = result.get("lastNodeExecuted")
    return message, node


def load_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""


def classify_workflow(
    workflow: dict[str, Any],
    detail: dict[str, Any],
    activity: dict[str, Any],
    archived_audit_text: str,
) -> tuple[str, str, str]:
    workflow_id = workflow["id"]
    name = workflow["name"]
    active = workflow.get("active", False)
    trigger = extract_trigger(detail)
    services = extract_services(detail)
    latest = activity["latest"]
    errors_30d = len(activity["error_recent"])
    successes_30d = len(activity["success_recent"])
    executions_30d = len(activity["recent"])
    latest_status = latest.get("status") if latest else None
    last_error = activity["last_error"]
    last_error_message = sanitize_error_message((last_error or {}).get("error"))

    notes: list[str] = []

    if active:
        if workflow_id == "TDBSUDxpcW8e56y4":
            return (
                "Active & Broken",
                "Still active in n8n even though status notifications were cut over to the VPS path on 2026-04-01, so it is now an overlap/cleanup risk.",
                "Legacy sender overlaps the VPS status-notifications service.",
            )
        if workflow_id == "9jD6J2X3yCPk8Rjp":
            return (
                "Active & Healthy",
                "Documented live Monday-to-Xero draft invoice path, but the executions API still returns no retained run history.",
                "Documented live invoice path; API history is absent.",
            )
        if latest_status == "error":
            return (
                "Active & Broken",
                "Latest execution failed.",
                "Recent run ended in error.",
            )
        if last_error_message and "please ignore" in last_error_message.lower():
            return (
                "Active & Healthy",
                "Recent errors appear to be synthetic or operator test traffic rather than production breakage.",
                "Recent synthetic/test failures were ignored.",
            )
        error_rate = (errors_30d / executions_30d) if executions_30d else 0.0
        if errors_30d and successes_30d == 0:
            return (
                "Active & Broken",
                "Only error executions were observed in the last 30 days.",
                "No successful recent executions were found.",
            )
        if executions_30d == 0 and "Manual" in trigger:
            return (
                "Active & Healthy",
                "Active but behaves like an operator utility; no recent executions were required to prove a live path.",
                "Low-volume manual/utility workflow.",
            )
        if executions_30d == 0:
            return (
                "Active & Healthy",
                "Active with no recent execution evidence; this is suspicious but not enough on its own to prove breakage.",
                "No recent execution history returned by the API.",
            )
        if errors_30d >= 3 and error_rate >= 0.10:
            return (
                "Active & Broken",
                "Recent execution failures are frequent enough to indicate a degraded live path.",
                f"Recent errors are material ({errors_30d}/{executions_30d} in 30d).",
            )
        if errors_30d:
            return (
                "Active & Healthy",
                "Recent executions are mostly healthy, with a small number of intermittent failures.",
                f"Mostly healthy with {errors_30d} intermittent error run(s) in 30d.",
            )
        return (
            "Active & Healthy",
            "Active with successful recent executions and no recent failures.",
            "Live and currently executing cleanly.",
        )

    if workflow_id in KNOWN_CLASSIFICATIONS:
        category, reason = KNOWN_CLASSIFICATIONS[workflow_id]
        return category, reason, reason

    lowered = name.lower()
    if "(old" in lowered or "old)" in lowered or "fixed" in lowered:
        return "Duplicate", "Named as an older or replacement variant of another flow.", "Older variant."
    if "test" in lowered or "discovery" in lowered or "run once" in lowered or "prototype" in lowered:
        return "Inactive & Experimental", "Explicitly a test or one-off workflow.", "Prototype/test workflow."
    if "export" in lowered or "extract" in lowered or "lookup" in lowered or "macros" in lowered:
        return "Inactive & Redundant", "Utility/reporting flow rather than a required live runtime.", "Manual utility."
    if any(service in services for service in {"Google Sheets", "Google Docs"}):
        return "Inactive & Redundant", "Dormant reporting/export flow, not a required live runtime.", "Dormant reporting utility."
    if workflow.get("name", "") in archived_audit_text:
        return "Inactive & Redundant", "Previously audited as retired or superseded.", "Superseded in prior audit."
    return "Inactive & Unknown", "Purpose could not be established confidently from current evidence.", "Needs manual review."


def build_coverage_map(workflows: list[WorkflowSummary]) -> list[dict[str, str]]:
    by_id = {wf.id: wf for wf in workflows}

    def active_names(ids: list[str]) -> str:
        names = [by_id[item].name for item in ids if item in by_id and by_id[item].active]
        return ", ".join(names) if names else "None"

    rows = [
        {
            "need": "Shopify order processing",
            "n8n": active_names(["fuVSFQvvJ1GRPkPe"]),
            "vps": "None",
            "status": "Covered by active n8n workflow",
            "gap": "No VPS overlap evidenced.",
        },
        {
            "need": "Monday status updates",
            "n8n": "Status Notifications → Intercom Email (inactive legacy workflow)",
            "vps": "status-notifications",
            "status": "Covered by VPS service instead",
            "gap": "The n8n sender last ran on 2026-04-01 and is now legacy residue after VPS cutover.",
        },
        {
            "need": "Intercom routing",
            "n8n": active_names(["kP5yCz6ufc23xE6v", "e1puojhc35tFJML5", "tNQphRiUo0L8SdBn", "LjNBWaDz9f5Rj8g5"]),
            "vps": "telephone-inbound for phone enquiries",
            "status": "Covered by both",
            "gap": "n8n covers most web/intake paths; VPS covers phone intake.",
        },
        {
            "need": "BackMarket notifications",
            "n8n": "None",
            "vps": "sent-orders.js, sale-detection.js, bm-payout, bm-shipping, icloud-checker",
            "status": "Covered by VPS service instead",
            "gap": "n8n inventory here is redundant migration residue.",
        },
        {
            "need": "Xero invoicing",
            "n8n": active_names(["9jD6J2X3yCPk8Rjp"]),
            "vps": "None",
            "status": "Covered by active n8n workflow",
            "gap": "Only draft creation is automated; send/paid loop remains missing.",
        },
        {
            "need": "Typeform intake",
            "n8n": active_names(["AubY0Rvhhvgp4GJ1", "kDfU2wWWv207T24J", "FB83t0dN0PNlEOpd", "lTHrOPUnD6naN28p"]),
            "vps": "None",
            "status": "Covered by active n8n workflow",
            "gap": "Credential governance remains degraded, but runtime ownership is clear.",
        },
        {
            "need": "Royal Mail tracking",
            "n8n": "None",
            "vps": "dispatch.js browser automation; bm-shipping confirms shipment after Monday release gate",
            "status": "Covered by VPS service instead",
            "gap": "No stable Royal Mail API owner exists.",
        },
        {
            "need": "Stripe/SumUp payment processing",
            "n8n": "None",
            "vps": "None",
            "status": "Not covered by anything",
            "gap": "Paid-state write-back and reconciliation remain broken/missing.",
        },
        {
            "need": "Google Sheets/Docs reporting",
            "n8n": "Sales Orders Weekly Export to Google Sheets, Trade-In Weekly Export to Google Sheets (both inactive)",
            "vps": "buy-box monitor sync_to_sheet.py for sell-side pricing only",
            "status": "Covered by both",
            "gap": "n8n exports are dormant; only the BM pricing sheet path is live on VPS/Python.",
        },
    ]
    return rows


def render_report(workflows: list[WorkflowSummary], generated_at: datetime) -> str:
    total = len(workflows)
    active = [wf for wf in workflows if wf.active]
    inactive = [wf for wf in workflows if not wf.active]
    counts = Counter(wf.classification for wf in workflows)
    healthy = len([wf for wf in active if wf.classification == "Active & Healthy"])
    broken = len([wf for wf in active if wf.classification == "Active & Broken"])
    active_sorted = sorted(active, key=lambda wf: (-wf.executions_30d, wf.name.lower()))
    reactivations = [wf for wf in workflows if wf.id in KNOWN_REACTIVATE]
    archive_rows = [
        wf
        for wf in workflows
        if wf.classification in {"Inactive & Redundant", "Inactive & Experimental", "Duplicate", "Inactive & Unknown"}
    ]
    broken_rows = [wf for wf in workflows if wf.classification == "Active & Broken"]
    coverage_rows = build_coverage_map(workflows)
    highest_volume = active_sorted[:5]

    lines: list[str] = []
    lines.append("# n8n Workflow Triage")
    lines.append("")
    lines.append(f"Date: {generated_at.strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("")
    lines.append("Evidence base:")
    lines.append("- Live n8n Cloud REST API on 2026-04-03 for workflow metadata, workflow definitions, and execution history.")
    lines.append("- Prior inventory and workflow context from `n8n-workflow-audit.md` dated 2026-04-02.")
    lines.append("- Architecture and ownership context from `systems-architecture.md`, `data_flows.md`, and `/home/ricky/kb/` process notes.")
    lines.append("")
    lines.append("## Section 1: Summary")
    lines.append("")
    lines.append(f"- Total workflows: `{total}`")
    lines.append(f"- Active vs inactive: `{len(active)}` active, `{len(inactive)}` inactive")
    lines.append(f"- Active health: `{healthy}` active and healthy, `{broken}` active and broken")
    lines.append(
        "- Classification breakdown: "
        + ", ".join(f"`{label}` {counts[label]}" for label in sorted(counts))
    )
    total_recent_errors = sum(wf.errors_30d for wf in active)
    lines.append(
        f"- Execution health summary: active workflows produced `{sum(wf.executions_30d for wf in active)}` executions in the last 30 days, including `{total_recent_errors}` error runs."
    )
    if highest_volume:
        lines.append(
            "- Highest-volume workflows (30d): "
            + ", ".join(f"`{wf.name}` ({wf.executions_30d})" for wf in highest_volume)
        )
    lines.append("")
    lines.append("## Section 2: Active Workflows")
    lines.append("")
    lines.append("| ID | Name | Trigger | Services | Last Execution | Executions (30d) | Status | Notes |")
    lines.append("|---|---|---|---|---|---:|---|---|")
    for wf in active_sorted:
        status = wf.classification
        last_exec = short_dt(wf.last_execution_at)
        notes = wf.notes
        if wf.errors_30d and "error run" not in notes.lower():
            notes = f"{notes} {wf.errors_30d} error run(s) in 30d.".strip()
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{wf.id}`",
                    md_escape(wf.name),
                    md_escape(wf.trigger),
                    md_escape(", ".join(wf.services) or "Unknown"),
                    md_escape(last_exec if wf.last_execution_status is None else f"{last_exec} ({wf.last_execution_status})"),
                    str(wf.executions_30d),
                    md_escape(status),
                    md_escape(notes or wf.classification_reason),
                ]
            )
            + " |"
        )
    lines.append("")
    lines.append("## Section 3: Recommended Reactivations")
    lines.append("")
    lines.append("| ID | Name | Purpose | Why Reactivate | Dependencies |")
    lines.append("|---|---|---|---|---|")
    for wf in sorted(reactivations, key=lambda item: item.name.lower()):
        meta = KNOWN_REACTIVATE[wf.id]
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{wf.id}`",
                    md_escape(wf.name),
                    md_escape(meta["purpose"]),
                    md_escape(meta["why"]),
                    md_escape(meta["dependencies"]),
                ]
            )
            + " |"
        )
    lines.append("")
    lines.append("## Section 4: Safe to Delete/Archive")
    lines.append("")
    lines.append("| ID | Name | Classification | Reason | Last Execution |")
    lines.append("|---|---|---|---|---|")
    for wf in sorted(
        archive_rows,
        key=lambda item: (
            0 if item.classification == "Duplicate" else 1,
            item.name.lower(),
        ),
    ):
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{wf.id}`",
                    md_escape(wf.name),
                    md_escape(wf.classification),
                    md_escape(wf.classification_reason),
                    md_escape(short_dt(wf.last_execution_at)),
                ]
            )
            + " |"
        )
    lines.append("")
    lines.append("## Section 5: Broken/Failing")
    lines.append("")
    lines.append("| ID | Name | Error | Last Success | Impact | Fix Suggestion |")
    lines.append("|---|---|---|---|---|---|")
    for wf in sorted(broken_rows, key=lambda item: (-item.errors_30d, item.name.lower())):
        if wf.id == "TDBSUDxpcW8e56y4":
            impact = "Duplicate live sender can create overlap/confusion after VPS cutover."
            fix = "Deactivate after verifying all upstream callers target the VPS route."
        else:
            impact = "Customer or intake automation is failing for at least some recent executions."
            fix = "Inspect failing node, patch logic or credentials, then confirm with passive monitoring."
        error = wf.latest_error_message or wf.classification_reason
        if wf.latest_error_node:
            error = f"{error} (node: {wf.latest_error_node})"
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{wf.id}`",
                    md_escape(wf.name),
                    md_escape(error),
                    md_escape(short_dt(wf.last_success_at)),
                    md_escape(impact),
                    md_escape(fix),
                ]
            )
            + " |"
        )
    lines.append("")
    lines.append("## Section 6: Coverage Map")
    lines.append("")
    lines.append("| Integration Need | n8n Workflow | VPS Service | Status | Gap/Overlap |")
    lines.append("|---|---|---|---|---|")
    for row in coverage_rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    md_escape(row["need"]),
                    md_escape(row["n8n"]),
                    md_escape(row["vps"]),
                    md_escape(row["status"]),
                    md_escape(row["gap"]),
                ]
            )
            + " |"
        )
    lines.append("")
    lines.append("## Section 7: Recommendations")
    lines.append("")
    lines.append("1. Workflows to reactivate")
    for wf in sorted(reactivations, key=lambda item: item.name.lower()):
        meta = KNOWN_REACTIVATE[wf.id]
        lines.append(f"   - `{wf.name}` (`{wf.id}`): {meta['why']}")
    lines.append("2. Workflows to delete")
    delete_candidates = [wf for wf in archive_rows if wf.classification in {"Inactive & Experimental", "Duplicate"}]
    delete_candidates += [wf for wf in archive_rows if wf.classification == "Inactive & Redundant" and wf.last_execution_at is None]
    for wf in sorted({wf.id: wf for wf in delete_candidates}.values(), key=lambda item: item.name.lower()):
        lines.append(f"   - `{wf.name}` (`{wf.id}`): {wf.classification_reason}")
    lines.append("3. Gaps to fill")
    lines.append("   - Stripe/SumUp/Xero paid-state write-back into Monday remains ownerless.")
    lines.append("   - Xero automation still stops at draft creation; send/paid loop is missing.")
    lines.append("   - Monday-created manual repairs still need a durable Intercom linkage owner if qFL8bw5M3dO7dudw is not revived.")
    lines.append("4. Duplications to consolidate")
    lines.append("   - Legacy n8n status notifications overlap the VPS `status-notifications` service.")
    lines.append("   - Older Shopify order/contact variants and older BM ingestion/checker variants should be archived once any unique logic is preserved.")
    lines.append("")
    lines.append("## Workflow Appendix")
    lines.append("")
    lines.append("| ID | Name | Active | Created | Updated | Last Execution | 30d Count | Classification |")
    lines.append("|---|---|---|---|---|---|---:|---|")
    for wf in sorted(workflows, key=lambda item: item.name.lower()):
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{wf.id}`",
                    md_escape(wf.name),
                    "Yes" if wf.active else "No",
                    md_escape(short_dt(wf.created_at)),
                    md_escape(short_dt(wf.updated_at)),
                    md_escape(short_dt(wf.last_execution_at)),
                    str(wf.executions_30d),
                    md_escape(wf.classification),
                ]
            )
            + " |"
        )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(OUTPUT_MD))
    parser.add_argument("--pause", type=float, default=0.0)
    args = parser.parse_args()

    env = parse_env_file(ENV_PATH)
    token = env.get("N8N_CLOUD_API_TOKEN")
    if not token:
        print("Missing N8N_CLOUD_API_TOKEN in env.", file=sys.stderr)
        return 2

    api = N8nApi(token=token, pause_s=args.pause)
    generated_at = datetime.now(tz=UTC)
    cutoff = generated_at - timedelta(days=30)

    workflows = api.paginate("/workflows", {"limit": 100})
    details = {wf["id"]: api.get(f"/workflows/{wf['id']}") for wf in workflows}

    archived_audit_text = load_text(AUDIT_MD)
    summaries: list[WorkflowSummary] = []

    for workflow in workflows:
        detail = details[workflow["id"]]
        history = fetch_execution_history(api, workflow["id"], cutoff)
        activity = summarize_recent_activity(history, cutoff)

        latest_error_message = None
        latest_error_node = None
        last_error = activity["last_error"]
        if last_error and (len(activity["error_recent"]) > 0 or last_error == activity["latest"]):
            latest_error_message, latest_error_node = fetch_error_detail(api, last_error["id"])

        classification, reason, notes = classify_workflow(
            workflow,
            detail,
            activity,
            archived_audit_text,
        )
        services = extract_services(detail)
        summary = WorkflowSummary(
            id=workflow["id"],
            name=workflow["name"],
            active=bool(workflow.get("active")),
            created_at=workflow.get("createdAt"),
            updated_at=workflow.get("updatedAt"),
            trigger=extract_trigger(detail),
            services=services,
            node_types=extract_node_types(detail),
            nodes=len(detail.get("nodes", [])),
            classification=classification,
            classification_reason=reason,
            last_execution_at=(activity["latest"] or {}).get("startedAt"),
            last_execution_status=(activity["latest"] or {}).get("status"),
            last_success_at=(activity["last_success"] or {}).get("startedAt"),
            last_error_at=(activity["last_error"] or {}).get("startedAt"),
            executions_30d=len(activity["recent"]),
            successes_30d=len(activity["success_recent"]),
            errors_30d=len(activity["error_recent"]),
            waiting_30d=len(activity["waiting_recent"]),
            latest_error_message=latest_error_message,
            latest_error_node=latest_error_node,
            notes=notes,
        )
        summaries.append(summary)

    report = render_report(summaries, generated_at)
    Path(args.output).write_text(report)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

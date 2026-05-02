#!/usr/bin/env bash
# Phase 7a fleet-wide path-patch — Phase 7a consolidation pass
# Aggregates all path moves from scan-batch-{1..8}.yaml that have inbound
# references in patchable surfaces (.md, .json, .toml, .yaml, .yml).
#
# Usage:
#   path-patch.sh --dry-run    # default; print intended changes, write nothing
#   path-patch.sh --apply      # actually rewrite files
#
# Hard rules:
# - Only patches files matching *.md, *.json, *.toml, *.yaml, *.yml.
# - Skips historical archive content under
#   /home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/.
# - Skips refs already patched (sed-detection: only writes if old string actually
#   present).
# - No source-code patching (.py / .js / .sh / .ts).

set -u

MODE="${1:---dry-run}"

case "$MODE" in
  --dry-run|--apply) ;;
  *) echo "usage: $0 [--dry-run|--apply]" >&2; exit 2;;
esac

dry=1
[[ "$MODE" == "--apply" ]] && dry=0

# Patches: each entry is: SOURCE_FILE|OLD_PATH|NEW_PATH
# SOURCE_FILE  = file to edit
# OLD_PATH     = string to find (literal — sed escaping handled below)
# NEW_PATH     = replacement string
# Source files limited to *.md, *.json, *.toml, *.yaml, *.yml — verified before
# adding here. Patches grouped by destination type for readability.

PATCHES=(

# ============================================================================
# TOP PRIORITY — OpenClaw runtime config (whisper-api transcribe.sh)
# ============================================================================
"/home/ricky/.openclaw/openclaw.json|/home/ricky/builds/whisper-api/transcribe.sh|/home/ricky/builds/whisper-api/scripts/transcribe.sh"

# ============================================================================
# claude-audit-rebuild — server-config crontab.txt moved to data/
# ============================================================================
"/home/ricky/claude-audit-rebuild/VPS-MAP.md|builds/server-config/crontab.txt|builds/server-config/data/crontab.txt"

# ============================================================================
# OpenClaw agent workspace files (.md)
# ============================================================================

# main/workspace/TODO.md — elek board viewer brief
"/home/ricky/.openclaw/agents/main/workspace/TODO.md|/home/ricky/builds/elek-board-viewer/CODEX-SCHEMATIC-BATCH-BRIEF.md|/home/ricky/builds/elek-board-viewer/briefs/CODEX-SCHEMATIC-BATCH-BRIEF.md"

# main/workspace/MEMORY.md — alex-triage-rebuild briefs
"/home/ricky/.openclaw/agents/main/workspace/MEMORY.md|/home/ricky/builds/alex-triage-rebuild/CODEX-REMEDIATION-BRIEF-2026-04-11.md|/home/ricky/builds/alex-triage-rebuild/briefs/CODEX-REMEDIATION-BRIEF-2026-04-11.md"
"/home/ricky/.openclaw/agents/main/workspace/MEMORY.md|/home/ricky/builds/alex-triage-rebuild/BUILD-BRIEF.md|/home/ricky/builds/alex-triage-rebuild/briefs/BUILD-BRIEF.md"

# main/workspace/LIVE-TODO.md — backmarket-browser audit/brief refs
"/home/ricky/.openclaw/agents/main/workspace/LIVE-TODO.md|/home/ricky/builds/backmarket-browser/BROWSER-AGENT-TODO-2026-04-26.md|/home/ricky/builds/backmarket-browser/briefs/BROWSER-AGENT-TODO-2026-04-26.md"
"/home/ricky/.openclaw/agents/main/workspace/LIVE-TODO.md|/home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-PROXY-BROWSER-PATH-2026-04-26.md|/home/ricky/builds/backmarket-browser/docs/audits/REPORT-DATAIMPULSE-PROXY-BROWSER-PATH-2026-04-26.md"
"/home/ricky/.openclaw/agents/main/workspace/LIVE-TODO.md|/home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-PASSWORD-STAGE-CANARY-2026-04-26.md|/home/ricky/builds/backmarket-browser/docs/audits/REPORT-DATAIMPULSE-PASSWORD-STAGE-CANARY-2026-04-26.md"
"/home/ricky/.openclaw/agents/main/workspace/LIVE-TODO.md|/home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-MAILBOX-CODE-LOGIN-2026-04-26.md|/home/ricky/builds/backmarket-browser/docs/audits/REPORT-DATAIMPULSE-MAILBOX-CODE-LOGIN-2026-04-26.md"
"/home/ricky/.openclaw/agents/main/workspace/LIVE-TODO.md|/home/ricky/builds/backmarket-browser/REPORT-HEADFUL-CLOUDFLARE-AUTH-HANDOFF-2026-04-26.md|/home/ricky/builds/backmarket-browser/docs/audits/REPORT-HEADFUL-CLOUDFLARE-AUTH-HANDOFF-2026-04-26.md"

# main/workspace/LIVE-TODO.md — monday/monday-automations-api-investigation
"/home/ricky/.openclaw/agents/main/workspace/LIVE-TODO.md|/home/ricky/builds/monday/monday-automations-api-investigation.md|/home/ricky/builds/monday/docs/audits/monday-automations-api-investigation.md"

# ============================================================================
# KB references (.md)
# ============================================================================

# kb/backmarket/spec-checker.md — icloud-checker SOP moved to docs/
"/home/ricky/kb/backmarket/spec-checker.md|/home/ricky/builds/icloud-checker/SOP-BM-TRADEIN-CHECK.md|/home/ricky/builds/icloud-checker/docs/SOP-BM-TRADEIN-CHECK.md"

# kb/operations/queue-management.md — intake-system SPEC.md
"/home/ricky/kb/operations/queue-management.md|/home/ricky/builds/intake-system/SPEC.md|/home/ricky/builds/intake-system/briefs/SPEC.md"

# kb/system/_phase-1.6-systems-fold-manifest.md — inventory-system SPEC.md
"/home/ricky/kb/system/_phase-1.6-systems-fold-manifest.md|/home/ricky/builds/inventory-system/SPEC.md|/home/ricky/builds/inventory-system/briefs/SPEC.md"

# kb/monday/parts-board.md — monday/board-schema.md
"/home/ricky/kb/monday/parts-board.md|/home/ricky/builds/monday/board-schema.md|/home/ricky/builds/monday/docs/board-schema.md"

# kb/monday/main-board.md — monday docs
"/home/ricky/kb/monday/main-board.md|/home/ricky/builds/monday/board-schema.md|/home/ricky/builds/monday/docs/board-schema.md"
"/home/ricky/kb/monday/main-board.md|/home/ricky/builds/monday/main-board-column-audit.md|/home/ricky/builds/monday/docs/audits/main-board-column-audit.md"
"/home/ricky/kb/monday/main-board.md|/home/ricky/builds/monday/automations.md|/home/ricky/builds/monday/docs/automations.md"
"/home/ricky/kb/monday/main-board.md|/home/ricky/builds/monday/repair-flow-traces.md|/home/ricky/builds/monday/docs/repair-flow-traces.md"

# kb/system/runtime/browser-automation.md — monday + backmarket-browser
"/home/ricky/kb/system/runtime/browser-automation.md|/home/ricky/builds/monday/browser-harness-pilot-report.md|/home/ricky/builds/monday/docs/audits/browser-harness-pilot-report.md"
"/home/ricky/kb/system/runtime/browser-automation.md|/home/ricky/builds/monday/browser-harness-monday-skill.md|/home/ricky/builds/monday/docs/browser-harness-monday-skill.md"
"/home/ricky/kb/system/runtime/browser-automation.md|/home/ricky/builds/backmarket-browser/SPEC-2026-04-25.md|/home/ricky/builds/backmarket-browser/briefs/SPEC-2026-04-25.md"

# kb/operations/queue-management.md — monday/repair-flow-traces.md, monday/target-state.md
"/home/ricky/kb/operations/queue-management.md|/home/ricky/builds/monday/repair-flow-traces.md|/home/ricky/builds/monday/docs/repair-flow-traces.md"
"/home/ricky/kb/operations/queue-management.md|/home/ricky/builds/monday/target-state.md|/home/ricky/builds/monday/briefs/target-state.md"

# kb/customer-service/_draft/notification-triggers.md — monday docs
"/home/ricky/kb/customer-service/_draft/notification-triggers.md|/home/ricky/builds/monday/automations.md|/home/ricky/builds/monday/docs/automations.md"
"/home/ricky/kb/customer-service/_draft/notification-triggers.md|/home/ricky/builds/monday/icorrect-status-notification-documentation.md|/home/ricky/builds/monday/docs/icorrect-status-notification-documentation.md"

# kb/customer-service/_draft/monday-workflow-map.md — monday docs (50+ refs)
"/home/ricky/kb/customer-service/_draft/monday-workflow-map.md|/home/ricky/builds/monday/automations.md|/home/ricky/builds/monday/docs/automations.md"
"/home/ricky/kb/customer-service/_draft/monday-workflow-map.md|/home/ricky/builds/monday/repair-flow-traces.md|/home/ricky/builds/monday/docs/repair-flow-traces.md"

# ============================================================================
# idea-inventory.md (~/builds/agent-rebuild/idea-inventory.md)
# ============================================================================

# alex-triage-classifier-rebuild
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/alex-triage-classifier-rebuild/BUILD-BRIEF.md|/home/ricky/builds/alex-triage-classifier-rebuild/briefs/BUILD-BRIEF.md"

# alex-triage-rebuild TODO + briefs
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/alex-triage-rebuild/TODO.md|/home/ricky/builds/alex-triage-rebuild/scratch/TODO.md"

# intercom-agent SPEC.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/intercom-agent/SPEC.md|/home/ricky/builds/intercom-agent/briefs/SPEC.md"

# inventory-system SPEC.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/inventory-system/SPEC.md|/home/ricky/builds/inventory-system/briefs/SPEC.md"

# apple-ssr discovery + parts-catalog-summary
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/apple-ssr/discovery.md|/home/ricky/builds/apple-ssr/docs/discovery.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/apple-ssr/parts-catalog-summary.md|/home/ricky/builds/apple-ssr/docs/parts-catalog-summary.md"

# mobilesentrix order-placement-discovery
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/mobilesentrix/order-placement-discovery.md|/home/ricky/builds/mobilesentrix/docs/order-placement-discovery.md"

# icloud-checker AUDIT-AND-DECOMPOSITION.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/icloud-checker/AUDIT-AND-DECOMPOSITION.md|/home/ricky/builds/icloud-checker/docs/audits/AUDIT-AND-DECOMPOSITION.md"

# royal-mail-automation briefs/docs
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/royal-mail-automation/REPAIRS-DISPATCH-PLAN.md|/home/ricky/builds/royal-mail-automation/briefs/REPAIRS-DISPATCH-PLAN.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/royal-mail-automation/ADDRESSNOW-IMPLEMENTATION.md|/home/ricky/builds/royal-mail-automation/docs/ADDRESSNOW-IMPLEMENTATION.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/royal-mail-automation/GOPHR-INTEGRATION-DISCOVERY-2026-04-24.md|/home/ricky/builds/royal-mail-automation/docs/GOPHR-INTEGRATION-DISCOVERY-2026-04-24.md"

# xero-invoice-automation SETUP.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/xero-invoice-automation/SETUP.md|/home/ricky/builds/xero-invoice-automation/docs/SETUP.md"

# xero-invoice-notifications BUILD-BRIEF.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/xero-invoice-notifications/BUILD-BRIEF.md|/home/ricky/builds/xero-invoice-notifications/briefs/BUILD-BRIEF.md"

# data folder buy-box-check txt
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/data/buy-box-check-2026-03-23.txt|/home/ricky/builds/data/scratch/buy-box-check-2026-03-23.txt"

# webhook-migration TODO files + execution-checklist
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/webhook-migration/TODO-MONDAY-STATUS-NOTIFICATIONS.md|/home/ricky/builds/webhook-migration/scratch/TODO-MONDAY-STATUS-NOTIFICATIONS.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/webhook-migration/TODO-SHOPIFY-INTERCOM-ATTRIBUTION.md|/home/ricky/builds/webhook-migration/scratch/TODO-SHOPIFY-INTERCOM-ATTRIBUTION.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/webhook-migration/execution-checklist-shopify-contact-form.md|/home/ricky/builds/webhook-migration/docs/execution-checklist-shopify-contact-form.md"

# elek-board-viewer PROJECT-STATE.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/elek-board-viewer/PROJECT-STATE.md|/home/ricky/builds/elek-board-viewer/docs/PROJECT-STATE.md"

# shift-bot COMPROMISES.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/shift-bot/COMPROMISES.md|/home/ricky/builds/shift-bot/docs/COMPROMISES.md"

# team-audits PROJECT_OVERVIEW + CODEX-EXTEND
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/team-audits/PROJECT_OVERVIEW.md|/home/ricky/builds/team-audits/docs/PROJECT_OVERVIEW.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/team-audits/CODEX-EXTEND-FERRARI-TRACKING.md|/home/ricky/builds/team-audits/briefs/CODEX-EXTEND-FERRARI-TRACKING.md"

# system-audit-2026-03-31 diagnostics-deep-dive
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/system-audit-2026-03-31/diagnostics-deep-dive.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/diagnostics-deep-dive.md"

# qa-system snapshot file
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/qa-system/snapshot/QA-TRIGGER-PLAN.md|/home/ricky/builds/qa-system/archive/2026-02-22-snapshot/QA-TRIGGER-PLAN.md"

# data-architecture snapshot brief
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/data-architecture/snapshot/data-architecture-brief.md|/home/ricky/builds/data-architecture/archive/2026-02-22-snapshot/data-architecture-brief.md"

# documentation PROGRESS.md
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/documentation/PROGRESS.md|/home/ricky/builds/documentation/scratch/PROGRESS.md"

# mutagen-guide html
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/mutagen-guide/mutagen-mac-to-vps.html|/home/ricky/builds/mutagen-guide/docs/mutagen-mac-to-vps.html"

# research memory-problem.md + vps-agent-audit
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/research/memory-problem.md|/home/ricky/builds/research/briefs/memory-problem.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/research/vps-agent-audit-2026-02-24.md|/home/ricky/builds/research/docs/audits/vps-agent-audit-2026-02-24.md"

# buyback-monitor brief
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/buyback-monitor/CODEX-V7-PIPELINE-REWRITE-BRIEF.md|/home/ricky/builds/buyback-monitor/briefs/CODEX-V7-PIPELINE-REWRITE-BRIEF.md"

)

# Skip-list: do not patch any historical archive content here.
# Pattern check is per source-file path.
is_skipped_archive() {
  case "$1" in
    /home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/*) return 0;;
  esac
  return 1
}

# Allow-list of file extensions (handles .md, .json, .toml, .yaml, .yml).
is_patchable_ext() {
  case "$1" in
    *.md|*.json|*.toml|*.yaml|*.yml) return 0;;
  esac
  return 1
}

planned=0
applied=0
skipped_missing=0
skipped_already=0
skipped_archive=0
skipped_ext=0

# Header
if (( dry )); then
  echo "=== Phase 7a path-patch — DRY-RUN ==="
else
  echo "=== Phase 7a path-patch — APPLY ==="
fi
echo

for entry in "${PATCHES[@]}"; do
  IFS='|' read -r src old new <<<"$entry"
  planned=$((planned+1))

  if is_skipped_archive "$src"; then
    echo "SKIP[archive]   $src"
    echo "                 $old -> $new"
    skipped_archive=$((skipped_archive+1))
    continue
  fi
  if ! is_patchable_ext "$src"; then
    echo "SKIP[ext]       $src ($old -> $new)"
    skipped_ext=$((skipped_ext+1))
    continue
  fi
  if [[ ! -f "$src" ]]; then
    echo "SKIP[missing]   $src does not exist"
    echo "                 $old -> $new"
    skipped_missing=$((skipped_missing+1))
    continue
  fi
  if ! grep -qF -- "$old" "$src"; then
    echo "SKIP[already]   $src (no occurrence of '$old')"
    skipped_already=$((skipped_already+1))
    continue
  fi

  matches=$(grep -cF -- "$old" "$src")
  if (( dry )); then
    echo "WOULD PATCH    $src ($matches occurrence(s))"
    echo "                 $old"
    echo "              -> $new"
  else
    # Use perl for safe literal replacement (handles slashes, etc.)
    if perl -i -pe 'BEGIN{$o=shift @ARGV;$n=shift @ARGV} s/\Q$o\E/$n/g' "$old" "$new" "$src"; then
      echo "PATCHED        $src ($matches occurrence(s))"
      echo "                 $old"
      echo "              -> $new"
      applied=$((applied+1))
    else
      echo "ERROR          $src — perl substitution failed"
    fi
  fi
done

echo
echo "=== Summary ==="
echo "Planned:                       $planned"
if (( dry )); then
  echo "Would-patch (file present + string present): $((planned - skipped_archive - skipped_ext - skipped_missing - skipped_already))"
else
  echo "Applied:                       $applied"
fi
echo "Skipped (historical archive):  $skipped_archive"
echo "Skipped (non-patchable ext):   $skipped_ext"
echo "Skipped (file missing):        $skipped_missing"
echo "Skipped (string already gone): $skipped_already"

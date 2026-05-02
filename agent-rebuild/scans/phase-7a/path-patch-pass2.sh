#!/usr/bin/env bash
# Phase 7a path-patch — PASS 2 orphan cleanup
# Catches references the first pass missed (kb/_draft/ subfolders,
# agent-rebuild/briefs/, agent-rebuild/docs/audits/, .openclaw/shared/, etc.)
#
# Usage:
#   path-patch-pass2.sh --dry-run    # default; print intended changes
#   path-patch-pass2.sh --apply      # actually rewrite files
#
# Hard rules (same as pass-1):
# - Only patches files matching *.md, *.json, *.toml, *.yaml, *.yml.
# - Skips historical archive content (RETIREMENT-AUDIT-2026-04-29.md is a
#   frozen grep-output snapshot — references inside are quoted historical
#   output, not live links; explicitly skipped).
# - Skips refs already patched (sed-detection: only writes if old string
#   actually present).
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
PATCHES=(

# ============================================================================
# .openclaw/shared/LEARNINGS.md — scripts dir nested under itself
# ============================================================================
"/home/ricky/.openclaw/shared/LEARNINGS.md|/home/ricky/builds/scripts/pdf-to-images.sh|/home/ricky/builds/scripts/scripts/pdf-to-images.sh"

# ============================================================================
# agent-rebuild/briefs/CODEX-BRIEFS.md
# ============================================================================
"/home/ricky/builds/agent-rebuild/briefs/CODEX-BRIEFS.md|/home/ricky/builds/intake-notifications/REBUILD-BRIEF.md|/home/ricky/builds/intake-notifications/briefs/REBUILD-BRIEF.md"

# ============================================================================
# agent-rebuild/docs/audits/script-test-results.md — system-audit-2026-03-31
# All audit md files moved to docs/audits/.
# ============================================================================
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/diagnostics-deep-dive.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/diagnostics-deep-dive.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/gsc-profitability-crossref-v2.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/gsc-profitability-crossref-v2.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/gsc-repair-profit-rankings.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/gsc-repair-profit-rankings.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/parts-cost-audit.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/parts-cost-audit.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/product-cards.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/product-cards.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/repair-profitability-model.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/repair-profitability-model.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/repair-profitability-v2.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/shopify-health-audit.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/shopify-health-audit.md"
"/home/ricky/builds/agent-rebuild/docs/audits/script-test-results.md|/home/ricky/builds/system-audit-2026-03-31/xero-revenue-by-repair.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/xero-revenue-by-repair.md"

# ============================================================================
# agent-rebuild/docs/audits/system-audit-digest.md
# ============================================================================
"/home/ricky/builds/agent-rebuild/docs/audits/system-audit-digest.md|/home/ricky/builds/system-audit-2026-03-31/gsc-profitability-crossref-v2.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/gsc-profitability-crossref-v2.md"
"/home/ricky/builds/agent-rebuild/docs/audits/system-audit-digest.md|/home/ricky/builds/system-audit-2026-03-31/product-cards.md|/home/ricky/builds/system-audit-2026-03-31/docs/audits/product-cards.md"

# ============================================================================
# agent-rebuild/idea-inventory.md — additional refs missed by pass-1
# ============================================================================
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/backmarket-seller-support/discovery.md|/home/ricky/builds/backmarket-seller-support/docs/discovery.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/icorrect-shopify-theme/docs/dead-click-analysis-2026-04-23.md|/home/ricky/builds/icorrect-shopify-theme/docs/audits/dead-click-analysis-2026-04-23.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/intake-notifications/plan.md|/home/ricky/builds/intake-notifications/briefs/plan.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/intake-system/plan.md|/home/ricky/builds/intake-system/briefs/plan.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/monday/board-v2-build-status.md|/home/ricky/builds/monday/docs/board-v2-build-status.md"
"/home/ricky/builds/agent-rebuild/idea-inventory.md|/home/ricky/builds/website-conversion/SPEC.md|/home/ricky/builds/website-conversion/briefs/SPEC.md"

# ============================================================================
# kb/customer-service/_draft/ — 11 occurrences in label-buying-workflow.md
# ============================================================================
"/home/ricky/kb/customer-service/_draft/label-buying-workflow.md|/home/ricky/builds/monday/main-board-column-audit.md|/home/ricky/builds/monday/docs/audits/main-board-column-audit.md"
"/home/ricky/kb/customer-service/_draft/quote-building.md|/home/ricky/builds/alex-triage-rebuild/PHASE2-QUOTE-BUILDING-BRIEF.md|/home/ricky/builds/alex-triage-rebuild/briefs/PHASE2-QUOTE-BUILDING-BRIEF.md"

# ============================================================================
# kb/monday/board-relationships.md
# ============================================================================
"/home/ricky/kb/monday/board-relationships.md|/home/ricky/builds/monday/board-v2-build-status.md|/home/ricky/builds/monday/docs/board-v2-build-status.md"
"/home/ricky/kb/monday/board-relationships.md|/home/ricky/builds/monday/board-v2-manifest.json|/home/ricky/builds/monday/data/board-v2-manifest.json"
"/home/ricky/kb/monday/board-relationships.md|/home/ricky/builds/monday/main-board-column-audit.md|/home/ricky/builds/monday/docs/audits/main-board-column-audit.md"

# ============================================================================
# kb/operations/qc-workflow.md
# ============================================================================
"/home/ricky/kb/operations/qc-workflow.md|/home/ricky/builds/monday/main-board-column-audit.md|/home/ricky/builds/monday/docs/audits/main-board-column-audit.md"

)

# Skip-list: do not patch any historical archive content here.
is_skipped_archive() {
  case "$1" in
    /home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/*) return 0;;
    # RETIREMENT-AUDIT-2026-04-29.md is a frozen grep-output snapshot — refs
    # inside are pasted historical output, not live links.
    /home/ricky/builds/agent-rebuild/docs/audits/RETIREMENT-AUDIT-2026-04-29.md) return 0;;
  esac
  return 1
}

# Allow-list of file extensions.
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
  echo "=== Phase 7a path-patch PASS-2 — DRY-RUN ==="
else
  echo "=== Phase 7a path-patch PASS-2 — APPLY ==="
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
    # Use perl for safe literal replacement.
    # Word-boundary check: ensure $old is not followed by [/_-] or alnum
    # (which would mean it's part of a longer, already-patched path).
    if perl -i -pe 'BEGIN{$o=shift @ARGV;$n=shift @ARGV} s/\Q$o\E(?![A-Za-z0-9_\-\/])/$n/g' "$old" "$new" "$src"; then
      remaining=$(grep -cF -- "$old" "$src" 2>/dev/null)
      remaining=${remaining:-0}
      patched_count=$((matches - remaining))
      echo "PATCHED        $src ($patched_count of $matches occurrence(s))"
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

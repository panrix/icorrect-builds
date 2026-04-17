#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-backmarket}"
ROOT_DIR="/home/ricky/builds/backmarket"
HANDOFF_DOC="$ROOT_DIR/docs/HANDOFF-2026-03-24.md"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is not installed." >&2
  exit 1
fi

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Session '$SESSION_NAME' already exists."
  echo "Attach with: tmux attach -t $SESSION_NAME"
  exit 0
fi

tmux new-session -d -s "$SESSION_NAME" -c "$ROOT_DIR" -n orchestrator
tmux send-keys -t "$SESSION_NAME:orchestrator" "cd $ROOT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:orchestrator" "printf 'Backmarket orchestrator session\nRepo: $ROOT_DIR\nHandoff: $HANDOFF_DOC\n'" C-m

tmux new-window -t "$SESSION_NAME" -n qa -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:qa" "cd $ROOT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:qa" "printf 'QA window\nFocus: review agent output, schema correctness, docs/code alignment\n'" C-m

tmux new-window -t "$SESSION_NAME" -n shipping -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:shipping" "cd $ROOT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:shipping" "printf 'Shipping window\nPrimary file: services/bm-shipping/index.js\n'" C-m

tmux new-window -t "$SESSION_NAME" -n gradecheck -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:gradecheck" "cd $ROOT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:gradecheck" "printf 'Grade-check window\nPrimary file: services/bm-grade-check/index.js\n'" C-m

tmux new-window -t "$SESSION_NAME" -n docs -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:docs" "cd $ROOT_DIR" C-m
tmux send-keys -t "$SESSION_NAME:docs" "printf 'Docs window\nRead first: docs/HANDOFF-2026-03-24.md\n'" C-m

tmux select-window -t "$SESSION_NAME:orchestrator"

cat <<EOF
Created tmux session '$SESSION_NAME'.

Attach:
  tmux attach -t $SESSION_NAME

Windows:
  orchestrator
  qa
  shipping
  gradecheck
  docs
EOF

#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/home/ricky/builds/elek-board-viewer"
LOG_DIR="${PROJECT_ROOT}/data/boardview_logs"
mkdir -p "${LOG_DIR}"

export DISPLAY=":99"

Xvfb "${DISPLAY}" -screen 0 1920x1080x24 >>"${LOG_DIR}/flexbv-session.log" 2>&1 &
XVFB_PID=$!

sleep 1
openbox >>"${LOG_DIR}/flexbv-session.log" 2>&1 &
OPENBOX_PID=$!

cleanup() {
  kill "${OPENBOX_PID}" "${XVFB_PID}" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

wait -n "${XVFB_PID}" "${OPENBOX_PID}"

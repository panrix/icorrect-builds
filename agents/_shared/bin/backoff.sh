#!/usr/bin/env bash

set -euo pipefail

backoff_retry() {
  if [ "$#" -lt 2 ]; then
    printf 'usage: backoff_retry <max-attempts> <command> [args...]\n' >&2
    return 64
  fi

  local max_attempts="$1"
  shift

  if ! [ "$max_attempts" -ge 1 ] 2>/dev/null; then
    printf 'backoff_retry: max-attempts must be an integer >= 1\n' >&2
    return 64
  fi

  local attempt=1
  local delay_s=1
  local status=0

  while true; do
    if "$@"; then
      return 0
    fi
    status=$?

    if [ "$attempt" -ge "$max_attempts" ]; then
      return "$status"
    fi

    printf 'backoff_retry: attempt %s/%s failed with exit %s; retrying in %ss\n' \
      "$attempt" "$max_attempts" "$status" "$delay_s" >&2
    sleep "$delay_s"

    attempt=$((attempt + 1))
    delay_s=$((delay_s * 2))
    if [ "$delay_s" -gt 60 ]; then
      delay_s=60
    fi
  done
}

export -f backoff_retry 2>/dev/null || true

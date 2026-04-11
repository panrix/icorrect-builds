#!/bin/bash
set -euo pipefail

AUDIO_FILE="$1"
OUTPUT_DIR="$(dirname "$AUDIO_FILE")"
BASENAME="$(basename "${AUDIO_FILE%.*}")"
OUTPUT_FILE="$OUTPUT_DIR/${BASENAME}.txt"
AUTH_FILE="/home/ricky/.openclaw/agents/main/agent/auth-profiles.json"

OPENAI_KEY=$(python3 << INNER
import json
with open("$AUTH_FILE") as f:
    d = json.load(f)
print(d["profiles"]["openai:default"]["key"])
INNER
)

if [ -z "$OPENAI_KEY" ]; then
    echo "Error: Could not read OpenAI API key" >&2
    exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: Audio file not found: $AUDIO_FILE" >&2
    exit 1
fi

TRANSCRIPT=$(curl -s --fail     -X POST "https://api.openai.com/v1/audio/transcriptions"     -H "Authorization: Bearer $OPENAI_KEY"     -F "file=@$AUDIO_FILE"     -F "model=whisper-1"     -F "response_format=text")

if [ $? -ne 0 ]; then
    echo "Error: API request failed" >&2
    exit 1
fi

echo "$TRANSCRIPT" > "$OUTPUT_FILE"
echo "$TRANSCRIPT"

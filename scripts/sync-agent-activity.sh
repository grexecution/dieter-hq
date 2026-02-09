#!/bin/bash
# Sync Agent Activity from ALL OpenClaw Agents to DieterHQ

set -e

DIETER_API="https://dieter.dergreg.com/api/agents/activity/update"
OPENCLAW_ROOT="/Users/dieter/.openclaw"

echo "[$(date)] Starting agent activity sync..."

# Get sessions from all agent stores
MAIN_SESSIONS=$(/opt/homebrew/bin/openclaw sessions list --store "$OPENCLAW_ROOT/agents/main/sessions/sessions.json" --json 2>/dev/null | jq '.sessions // []')
CODER_SESSIONS=$(/opt/homebrew/bin/openclaw sessions list --store "$OPENCLAW_ROOT/agents/coder/sessions/sessions.json" --json 2>/dev/null | jq '.sessions // []')

# Merge both session arrays
ALL_SESSIONS=$(echo "$MAIN_SESSIONS $CODER_SESSIONS" | jq -s 'add | unique_by(.key)')

if [ -z "$ALL_SESSIONS" ] || [ "$ALL_SESSIONS" = "null" ]; then
  echo "[$(date)] No sessions found"
  exit 0
fi

PAYLOAD=$(echo "$ALL_SESSIONS" | jq '{sessions: .}')
COUNT=$(echo "$ALL_SESSIONS" | jq 'length')

echo "[$(date)] Syncing $COUNT sessions..."

# Send to DieterHQ API
RESULT=$(curl -s -X POST "$DIETER_API" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null)

echo "[$(date)] Sync complete: $RESULT"

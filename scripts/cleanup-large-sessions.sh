#!/bin/bash
# Cleanup large OpenClaw sessions to prevent token overflow
# Runs via launchd, keeps sessions under 5MB

set -e

SESSIONS_DIR="/Users/dieter/.openclaw/agents/coder/sessions"
MAX_SIZE_MB=5
MAX_SIZE_BYTES=$((MAX_SIZE_MB * 1024 * 1024))
BACKUP_DIR="/tmp/openclaw-session-backups"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Checking for large sessions..."

for session_file in "$SESSIONS_DIR"/*.jsonl; do
  [ -f "$session_file" ] || continue
  
  size=$(stat -f%z "$session_file" 2>/dev/null || echo 0)
  filename=$(basename "$session_file")
  
  if [ "$size" -gt "$MAX_SIZE_BYTES" ]; then
    size_mb=$((size / 1024 / 1024))
    echo "[$(date)] Session too large: $filename (${size_mb}MB)"
    
    # Backup and remove
    cp "$session_file" "$BACKUP_DIR/${filename}.$(date +%Y%m%d-%H%M%S)"
    rm "$session_file"
    
    echo "[$(date)] Removed and backed up: $filename"
  fi
done

# Also remove session references from sessions.json for deleted files
python3 -c "
import json
import os

sessions_json = '$SESSIONS_DIR/sessions.json'
with open(sessions_json, 'r') as f:
    data = json.load(f)

keys_to_remove = []
for key, value in data.items():
    session_id = value.get('sessionId', '')
    if session_id:
        session_file = f'$SESSIONS_DIR/{session_id}.jsonl'
        if not os.path.exists(session_file):
            keys_to_remove.append(key)

if keys_to_remove:
    for key in keys_to_remove:
        del data[key]
    with open(sessions_json, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'[$(date)] Removed {len(keys_to_remove)} stale session references')
" 2>/dev/null || true

echo "[$(date)] Session cleanup complete"

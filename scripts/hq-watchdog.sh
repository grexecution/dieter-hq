#!/bin/zsh
set -euo pipefail

# Lightweight watchdog for Dieter HQ.
# Designed for cron: runs frequently but only logs on state changes.
# Optionally kickstarts launchd service when down.

HOST=${HOST:-127.0.0.1}
PORT=${PORT:-3010}
URL=${URL:-"http://${HOST}:${PORT}/api/health"}

LABEL=${LABEL:-"at.dieter.hq"}
DOMAIN=${DOMAIN:-"gui/${UID}"}
PLIST_ID="${DOMAIN}/${LABEL}"

STATE_FILE=${STATE_FILE:-"/tmp/dieter-hq.watchdog.state"}
LOG_FILE=${LOG_FILE:-"/tmp/dieter-hq.watchdog.log"}

now() { date -u "+%Y-%m-%dT%H:%M:%SZ"; }

check() {
  /usr/bin/curl --silent --show-error --max-time 2 --fail "$URL" >/dev/null
}

prev="unknown"
[[ -f "$STATE_FILE" ]] && prev=$(cat "$STATE_FILE" 2>/dev/null || true)

if check; then
  cur="up"
else
  cur="down"
fi

if [[ "$cur" != "$prev" ]]; then
  echo "$(now) state ${prev} -> ${cur} (${URL})" >>"$LOG_FILE"
  echo "$cur" >"$STATE_FILE"

  if [[ "$cur" == "down" ]]; then
    # Best-effort restart; ignore errors (service may not be loaded yet).
    /bin/launchctl kickstart -k "$PLIST_ID" >>"$LOG_FILE" 2>&1 || true
  fi
fi

# Exit non-zero only when down (useful for alerting if desired)
[[ "$cur" == "up" ]]

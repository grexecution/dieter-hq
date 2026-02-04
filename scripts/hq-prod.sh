#!/bin/zsh
set -euo pipefail

# Production runner for Dieter HQ (Next.js) on port 3010.
# - Builds if needed
# - Starts Next in production mode

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

export NODE_ENV=production

HOST=${HOST:-127.0.0.1}
PORT=${PORT:-3010}

# Ensure dependencies exist (assumes npm install already run)
if [[ ! -d node_modules ]]; then
  echo "[hq-prod] node_modules missing; running npm install" >&2
  npm install
fi

# Build if missing
if [[ ! -f .next/BUILD_ID ]]; then
  echo "[hq-prod] .next build missing; running npm run build" >&2
  npm run build
fi

echo "[hq-prod] starting on http://${HOST}:${PORT} (NODE_ENV=${NODE_ENV})" >&2

# Use flags rather than env for portability.
exec npm run start -- -H "$HOST" -p "$PORT"

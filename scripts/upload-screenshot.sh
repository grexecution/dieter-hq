#!/bin/bash
# Upload a local screenshot to DieterHQ and return the artefact URL
# Usage: upload-screenshot.sh <path-to-image> [name]
#
# Returns the artefact URL that can be embedded in chat messages
# Example: ![Screenshot](/api/artefacts/uuid-here)

DIETER_API="https://dieter.dergreg.com/api/upload-artefact"

if [ -z "$1" ]; then
  echo "Usage: upload-screenshot.sh <path-to-image> [name]" >&2
  exit 1
fi

IMAGE_PATH="$1"
NAME="${2:-$(basename "$IMAGE_PATH")}"

if [ ! -f "$IMAGE_PATH" ]; then
  echo "Error: File not found: $IMAGE_PATH" >&2
  exit 1
fi

# Determine MIME type
case "${IMAGE_PATH##*.}" in
  png) MIME="image/png" ;;
  jpg|jpeg) MIME="image/jpeg" ;;
  gif) MIME="image/gif" ;;
  webp) MIME="image/webp" ;;
  *) MIME="image/png" ;;
esac

# Convert to base64
BASE64_DATA=$(base64 -i "$IMAGE_PATH")

# Upload to DieterHQ
RESPONSE=$(curl -s -X POST "$DIETER_API" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": \"$BASE64_DATA\",
    \"name\": \"$NAME\",
    \"type\": \"$MIME\"
  }")

# Extract URL from response
URL=$(echo "$RESPONSE" | jq -r '.url // empty')

if [ -n "$URL" ]; then
  echo "$URL"
else
  echo "Error: Upload failed" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

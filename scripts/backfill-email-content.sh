#!/bin/bash
# Backfill email content for existing inbox items
# Run once to populate content for emails that only have subject

DIETER_API="https://dieter.dergreg.com/api/inbox/items"

echo "📧 Backfilling email content..."

# Get emails without content
curl -s "$DIETER_API?source=email&status=pending&limit=50" | jq -c '.data.items[] | select(.content == null or .content == "")' | while read -r item; do
  [ -z "$item" ] && continue
  
  ID=$(echo "$item" | jq -r '.id')
  SOURCE_ID=$(echo "$item" | jq -r '.sourceId')
  ACCOUNT=$(echo "$item" | jq -r '.sourceAccount')
  SUBJECT=$(echo "$item" | jq -r '.subject // .preview')
  
  echo "   Fetching: $SUBJECT"
  
  # Get full thread
  BODY=$(gog gmail thread get "$SOURCE_ID" --account "$ACCOUNT" --full 2>/dev/null | tail -n +9 | head -c 5000)
  
  if [ -n "$BODY" ] && [ "$BODY" != "" ]; then
    # Update item with content
    curl -s -X PATCH "$DIETER_API/$ID" \
      -H "Content-Type: application/json" \
      -d "{\"content\": $(echo "$BODY" | jq -Rs .)}" > /dev/null
    echo "   ✅ Updated"
  else
    echo "   ⚠️ Could not fetch body"
  fi
done

echo "✅ Backfill complete!"

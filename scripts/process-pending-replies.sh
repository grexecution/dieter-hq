#!/bin/bash
# Process pending replies from DieterHQ inbox
# Dieter polls this and sends messages via wacli/gog

DIETER_API="https://dieter.dergreg.com/api/inbox"

echo "🐕 Checking for pending replies..."

# Fetch items with pending replies
PENDING=$(curl -s "$DIETER_API/pending-replies" 2>/dev/null || echo '{"items":[]}')

# Check if there are any
COUNT=$(echo "$PENDING" | jq '.items | length')

if [ "$COUNT" = "0" ] || [ "$COUNT" = "null" ]; then
  echo "   No pending replies"
  exit 0
fi

echo "   Found $COUNT items with pending replies"

# Process each item
echo "$PENDING" | jq -c '.items[]' | while read -r item; do
  ID=$(echo "$item" | jq -r '.id')
  SOURCE=$(echo "$item" | jq -r '.source')
  SENDER=$(echo "$item" | jq -r '.sender')
  SENDER_NAME=$(echo "$item" | jq -r '.senderName // .sender')
  
  echo ""
  echo "📨 Processing: $SENDER_NAME ($SOURCE)"
  
  # Process each pending reply for this item
  echo "$item" | jq -c '.pendingReplies[]' | while read -r reply; do
    MESSAGE=$(echo "$reply" | jq -r '.message')
    CREATED=$(echo "$reply" | jq -r '.createdAt')
    
    echo "   Message: $MESSAGE"
    echo "   Created: $CREATED"
    
    if [ "$SOURCE" = "whatsapp" ]; then
      echo "   → Sending via wacli..."
      # Find the JID for this contact
      JID=$(wacli contacts list --json 2>/dev/null | jq -r --arg name "$SENDER_NAME" '.data.contacts[] | select(.name == $name or .pushname == $name) | .jid' | head -1)
      
      if [ -n "$JID" ] && [ "$JID" != "null" ]; then
        wacli send text "$JID" "$MESSAGE" && echo "   ✅ Sent!" || echo "   ❌ Failed to send"
      else
        echo "   ❌ Could not find JID for $SENDER_NAME"
        echo "   Trying with phone number..."
        # Try to extract phone from sender field
        PHONE=$(echo "$SENDER" | grep -oE '\+?[0-9]+' | head -1)
        if [ -n "$PHONE" ]; then
          wacli send text "$PHONE@s.whatsapp.net" "$MESSAGE" && echo "   ✅ Sent!" || echo "   ❌ Failed"
        fi
      fi
    elif [ "$SOURCE" = "email" ]; then
      echo "   → Creating email draft via gog..."
      # Create draft with gog
      gog gmail drafts create --to "$SENDER" --subject "Re: " --body "$MESSAGE" && echo "   ✅ Draft created!" || echo "   ❌ Failed"
    else
      echo "   ⚠️ Unknown source: $SOURCE"
    fi
  done
  
  # Clear pending replies from this item
  echo "   Clearing pending replies..."
  curl -s -X PATCH "$DIETER_API/items/$ID" \
    -H "Content-Type: application/json" \
    -d '{"metadata": {"pendingReplies": []}}' > /dev/null
done

echo ""
echo "✅ Done processing replies"

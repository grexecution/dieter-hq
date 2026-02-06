#!/bin/bash
# DieterHQ Inbox Sync Script
# Syncs WhatsApp and Email to DieterHQ inbox
# WhatsApp: Groups multiple messages from same sender into one conversation

set -e

DIETER_API="https://dieter-hq.vercel.app/api/inbox/items"
LAST_SYNC_FILE="$HOME/.openclaw/workspace/.inbox-last-sync"
CONVERSATION_WINDOW_MINUTES=15

# Get last sync timestamp (default: 1 hour ago)
if [ -f "$LAST_SYNC_FILE" ]; then
  LAST_SYNC=$(cat "$LAST_SYNC_FILE")
else
  LAST_SYNC=$(date -v-1H -u +%Y-%m-%dT%H:%M:%SZ)
fi

echo "🐕 DieterHQ Inbox Sync starting..."
echo "   Last sync: $LAST_SYNC"

# ============================================
# 1. WHATSAPP SYNC (with conversation grouping)
# ============================================
echo ""
echo "📱 Syncing WhatsApp..."

# First, trigger wacli sync to get new messages
wacli sync --once --idle-exit 15s 2>&1 || true

# Get new incoming messages (FromMe=false), grouped by sender
# jq groups messages by ChatName and combines them into conversations
WA_CONVERSATIONS=$(wacli messages list --limit 100 --json 2>/dev/null | jq -c '
  [.data.messages[] | select(.FromMe == false and .Timestamp > "'"$LAST_SYNC"'" and (.DisplayText // .Text) != "" and (.DisplayText // .Text) != null)]
  | group_by(.ChatName)
  | map({
      sender: .[0].ChatName,
      chatJid: .[0].ChatJID,
      messages: (. | sort_by(.Timestamp)),
      firstTime: (. | sort_by(.Timestamp) | .[0].Timestamp),
      lastTime: (. | sort_by(.Timestamp) | .[-1].Timestamp),
      count: length,
      preview: (
        if length == 1 then
          .[0].DisplayText // .[0].Text
        else
          # Multiple messages: combine with newlines, newest first shown in preview
          (. | sort_by(.Timestamp) | reverse | map(.DisplayText // .Text) | join("\n---\n"))
        end
      ),
      sourceId: (. | sort_by(.Timestamp) | .[-1].MsgID)
    })
  | .[]
')

WA_COUNT=$(echo "$WA_CONVERSATIONS" | grep -c "sender" || echo "0")
echo "   Found $WA_COUNT conversations"

# Add each conversation to DieterHQ
echo "$WA_CONVERSATIONS" | while read -r conv; do
  [ -z "$conv" ] && continue
  
  SENDER=$(echo "$conv" | jq -r '.sender')
  COUNT=$(echo "$conv" | jq -r '.count')
  PREVIEW=$(echo "$conv" | jq -r '.preview' | head -c 500)
  SOURCE_ID=$(echo "$conv" | jq -r '.sourceId')
  RECEIVED=$(echo "$conv" | jq -r '.lastTime')
  CHAT_JID=$(echo "$conv" | jq -r '.chatJid')
  
  # Skip empty
  if [ -z "$PREVIEW" ] || [ "$PREVIEW" = "null" ]; then
    continue
  fi
  
  # Add message count if multiple
  if [ "$COUNT" -gt 1 ]; then
    PREVIEW_DISPLAY="[$COUNT Nachrichten]\n$PREVIEW"
  else
    PREVIEW_DISPLAY="$PREVIEW"
  fi
  
  # Post to DieterHQ (use chatJid + date as sourceId for dedup)
  curl -s -X POST "$DIETER_API" \
    -H "Content-Type: application/json" \
    -d "{
      \"source\": \"whatsapp\",
      \"sourceId\": \"wa_${CHAT_JID}_$(echo "$RECEIVED" | tr -d ':-')\",
      \"sender\": $(echo "$SENDER" | jq -Rs .),
      \"preview\": $(echo "$PREVIEW_DISPLAY" | jq -Rs .),
      \"content\": $(echo "$PREVIEW" | jq -Rs .),
      \"receivedAt\": \"$RECEIVED\"
    }" > /dev/null
    
  echo "   ✓ $SENDER ($COUNT msgs): ${PREVIEW:0:40}..."
done

# ============================================
# 2. EMAIL SYNC (all 4 accounts)
# ============================================
echo ""
echo "📧 Syncing Email..."

ACCOUNTS=("greg.wallner@gmail.com" "office@dergreg.com" "g.wallner@bluemonkeys.com" "wallner@sqdconsulting.com")
EMAIL_TOTAL=0

for ACCOUNT in "${ACCOUNTS[@]}"; do
  echo "   Checking $ACCOUNT..."
  
  # Get unread emails from last hour
  EMAILS=$(gog gmail messages search "is:unread newer_than:1h" --account "$ACCOUNT" --json 2>/dev/null || echo '{"messages":[]}')
  
  echo "$EMAILS" | jq -c '.messages[]?' | while read -r email; do
    [ -z "$email" ] && continue
    
    MSG_ID=$(echo "$email" | jq -r '.id')
    SUBJECT=$(echo "$email" | jq -r '.subject')
    FROM=$(echo "$email" | jq -r '.from')
    DATE=$(echo "$email" | jq -r '.date')
    
    # Convert date to ISO format
    RECEIVED=$(date -j -f "%Y-%m-%d %H:%M" "$DATE" +%Y-%m-%dT%H:%M:00Z 2>/dev/null || echo "${DATE}:00Z")
    
    # Post to DieterHQ  
    curl -s -X POST "$DIETER_API" \
      -H "Content-Type: application/json" \
      -d "{
        \"source\": \"email\",
        \"sourceId\": \"$MSG_ID\",
        \"sourceAccount\": \"$ACCOUNT\",
        \"sender\": $(echo "$FROM" | jq -Rs .),
        \"subject\": $(echo "$SUBJECT" | jq -Rs .),
        \"preview\": $(echo "$SUBJECT" | jq -Rs .),
        \"receivedAt\": \"$RECEIVED\"
      }" > /dev/null
      
    echo "   ✓ [$ACCOUNT] $SUBJECT"
    ((EMAIL_TOTAL++)) || true
  done
done

echo "   Synced $EMAIL_TOTAL new emails"

# ============================================
# 3. UPDATE LAST SYNC TIMESTAMP
# ============================================
date -u +%Y-%m-%dT%H:%M:%SZ > "$LAST_SYNC_FILE"

echo ""
echo "✅ Sync complete!"
echo "   WhatsApp conversations: $WA_COUNT"
echo "   Emails: $EMAIL_TOTAL"

#!/bin/bash
# DieterHQ Smart Alert Filter
# Verifies alerts and auto-archives stale ones

DIETER_API="https://dieter-hq.vercel.app/api/inbox/items"

echo "🧠 Smart Alert Filter starting..."

# ============================================
# 1. UPTIMEROBOT "DOWN" ALERTS
# ============================================
echo ""
echo "🔍 Checking UptimeRobot DOWN alerts..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -c '.data.items[]? | select(.preview | test("Monitor is DOWN"; "i"))' | while read -r item; do
  ID=$(echo "$item" | jq -r '.id')
  PREVIEW=$(echo "$item" | jq -r '.preview')
  
  # Extract domain from preview (e.g., "Monitor is DOWN: SQD Website" → need to map to URL)
  # Common mappings:
  if echo "$PREVIEW" | grep -qi "SQD"; then
    URL="https://sqdconsulting.com"
  elif echo "$PREVIEW" | grep -qi "Olivadis"; then
    URL="https://olivadis.com"
  elif echo "$PREVIEW" | grep -qi "Bluemonkeys"; then
    URL="https://bluemonkeys.com"
  else
    echo "   Unknown site in: $PREVIEW - skipping"
    continue
  fi
  
  # Check if site is actually down
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null || echo "000")
  
  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "   ✅ $URL is UP (HTTP $HTTP_STATUS) → archiving stale alert"
    curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
  else
    echo "   ❌ $URL is DOWN (HTTP $HTTP_STATUS) → keeping alert as URGENT"
    curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"urgent"}' > /dev/null
  fi
done

# ============================================
# 2. UPTIMEROBOT "UP" ALERTS (always archive)
# ============================================
echo ""
echo "🔍 Archiving UptimeRobot UP alerts (informational only)..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Monitor is UP"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving UP notification: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 3. VERCEL/GITHUB BUILD FAILURES
# Check if newer successful build exists
# ============================================
echo ""
echo "🔍 Checking Vercel/GitHub build failures..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -c '.data.items[]? | select(.preview | test("Run failed|Failed.*deployment"; "i"))' | while read -r item; do
  ID=$(echo "$item" | jq -r '.id')
  PREVIEW=$(echo "$item" | jq -r '.preview')
  RECEIVED=$(echo "$item" | jq -r '.receivedAt')
  
  # For dieter-hq repo: check if there's a more recent successful deploy
  if echo "$PREVIEW" | grep -qi "dieter-hq"; then
    # Check Vercel deployment status
    LATEST_STATUS=$(curl -s "https://dieter-hq.vercel.app/api/status" 2>/dev/null | jq -r '.ok // "unknown"')
    
    if [ "$LATEST_STATUS" = "true" ]; then
      echo "   ✅ dieter-hq is deployed successfully → archiving old failure"
      curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
    else
      echo "   ⚠️ dieter-hq deploy status unclear → keeping alert"
    fi
  fi
done

# ============================================
# 4. WORDPRESS AUTO-UPDATES (always archive)
# ============================================
echo ""
echo "🔍 Archiving WordPress auto-update notifications..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("site has updated to WordPress|Plugins wurden automatisch aktualisiert"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving WordPress update: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 5. DOMAIN RENEWAL > 7 DAYS (archive)
# ============================================
echo ""
echo "🔍 Checking domain renewal notices..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -c '.data.items[]? | select(.preview | test("renewing in 30 days|renewing in [0-9]+ days"; "i"))' | while read -r item; do
  ID=$(echo "$item" | jq -r '.id')
  PREVIEW=$(echo "$item" | jq -r '.preview')
  
  # Extract days from preview
  DAYS=$(echo "$PREVIEW" | grep -oE "[0-9]+ days" | grep -oE "[0-9]+")
  
  if [ -n "$DAYS" ] && [ "$DAYS" -gt 7 ]; then
    echo "   📅 Renewal in $DAYS days → archiving (will remind at 7 days)"
    curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
  else
    echo "   ⚠️ Renewal in $DAYS days → keeping (urgent!)"
    curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"high"}' > /dev/null
  fi
done

# ============================================
# 6. VERCEL PREVIEW DEPLOYMENTS (always archive)
# ============================================
echo ""
echo "🔍 Archiving Vercel preview deployment failures..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Failed preview deployment"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving preview failure: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 7. WORDPRESS MODERATE COMMENTS (spam)
# ============================================
echo ""
echo "🔍 Archiving WordPress moderate requests..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Please moderate"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving moderate request: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 8. PRODUCT/LEGAL UPDATES (newsletters)
# ============================================
echo ""
echo "🔍 Archiving product newsletters..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Product Update|Legal Update"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving newsletter: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 9. WORDFENCE ALERTS (routine, unless critical)
# ============================================
echo ""
echo "🔍 Checking Wordfence alerts..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -c '.data.items[]? | select(.preview | test("Wordfence Alert"; "i"))' | while read -r item; do
  [ -z "$item" ] && continue
  ID=$(echo "$item" | jq -r '.id')
  if echo "$item" | grep -qi "critical\|malware\|hacked"; then
    echo "   ⚠️ Critical Wordfence alert - keeping as URGENT"
    curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"urgent"}' > /dev/null
  else
    echo "   Archiving routine Wordfence: $ID"
    curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
  fi
done

echo ""
echo "✅ Smart filter complete!"

#!/bin/bash
# DieterHQ Smart Alert Filter
# Verifies alerts and auto-archives stale ones

DIETER_API="https://dieter.dergreg.com/api/inbox/items"

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
    LATEST_STATUS=$(curl -s "https://dieter.dergreg.com/api/status" 2>/dev/null | jq -r '.ok // "unknown"')
    
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

# ============================================
# 10. CLICKUP TASK NOTIFICATIONS (archive - tasks are in ClickUp)
# ============================================
echo ""
echo "🔍 Archiving ClickUp task email notifications..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.sender | test("tasks.clickup.com"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving ClickUp notification: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 11. DEPENDABOT PRs (low priority, review later)
# ============================================
echo ""
echo "🔍 Marking Dependabot PRs as low priority..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.senderName | test("dependabot"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Marking Dependabot as low: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"low"}' > /dev/null
done

# ============================================
# 12. WORDPRESS PLUGIN UPDATES (archive)
# ============================================
echo ""
echo "🔍 Archiving WordPress plugin update emails..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Some plugins were automatically updated|plugins and themes have been updated"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving WP plugin update: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 13. BILLING RECEIPTS (OpenAI, Vercel, etc)
# ============================================
echo ""
echo "🔍 Archiving billing receipts..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("has been funded|Payment receipt|Invoice paid"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving billing receipt: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 14. PASSWORD CHANGED NOTIFICATIONS (archive)
# ============================================
echo ""
echo "🔍 Archiving password changed notifications..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Password Changed|Passwort geändert"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving password change: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 15. WELCOME EMAILS (archive)
# ============================================
echo ""
echo "🔍 Archiving welcome emails..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("welcome to|willkommen bei"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving welcome email: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 16. AUTO-REPLIES (info only)
# ============================================
echo ""
echo "🔍 Archiving auto-reply emails..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Automatische Antwort|Out of Office|Auto-Reply"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving auto-reply: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 17. KINSTA/HOSTING VULNERABILITY DIGESTS (low priority)
# ============================================
echo ""
echo "🔍 Marking hosting vulnerability digests as low priority..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("vulnerability digest"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Marking as low priority: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"low"}' > /dev/null
done

# ============================================
# 18. PHISHING WARNING NEWSLETTERS (archive)
# ============================================
echo ""
echo "🔍 Archiving generic security newsletters..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Phishing-Versuche|So erkennen Sie"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving security newsletter: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 19. GITHUB NOTIFICATIONS (OAuth, stars, etc)
# ============================================
echo ""
echo "🔍 Archiving GitHub informational notifications..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("third-party OAuth|Someone has starred|dependabot\\[bot\\]"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving GitHub notification: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 20. SUCCESSFUL SIGN-IN NOTIFICATIONS (info only)
# ============================================
echo ""
echo "🔍 Archiving successful sign-in notifications..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Successful sign-in|Neue Anmeldung|New device accessing"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving sign-in notification: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 21. DAILY SALES REPORTS (low priority)
# ============================================
echo ""
echo "🔍 Marking daily sales reports as low priority..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Daily Sales Report"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Marking as low: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"low"}' > /dev/null
done

# ============================================
# 22. MARKETING NEWSLETTERS (archive)
# ============================================
echo ""
echo "🔍 Archiving marketing newsletters..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Optimize your website|Elementor|newsletter|unsubscribe"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving newsletter: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 23. CALENDAR ACCEPTS (Zugesagt, Angenommen)
# ============================================
echo ""
echo "🔍 Archiving calendar accept notifications..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Zugesagt:|Angenommen:|has accepted"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Archiving calendar accept: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"status":"archived"}' > /dev/null
done

# ============================================
# 24. OLIVADIS ORDER CANCELLATIONS (low priority)
# ============================================
echo ""
echo "🔍 Marking Olivadis cancellations as low priority..."

curl -s "$DIETER_API?status=pending&limit=100" | jq -r '.data.items[]? | select(.preview | test("Bestellung.*wurde abgebrochen"; "i")) | .id' | while read -r ID; do
  [ -z "$ID" ] && continue
  echo "   Marking as low: $ID"
  curl -s -X PATCH "$DIETER_API/$ID" -H "Content-Type: application/json" -d '{"priority":"low"}' > /dev/null
done

echo ""
echo "✅ Smart filter complete!"

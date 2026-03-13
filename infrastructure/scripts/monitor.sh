#!/bin/bash
# ============================================
# Blazion Forms — Health Monitor
# Run via cron every 5 min: */5 * * * * /opt/blazion-forms/infrastructure/scripts/monitor.sh
# ============================================

set -euo pipefail

API_URL="${API_URL:-https://api.blazionforms.com/api/v1/health}"
WEB_URL="${WEB_URL:-https://blazionforms.com}"
SLACK_WEBHOOK="${MONITOR_SLACK_WEBHOOK:-}"

check_service() {
  local name=$1
  local url=$2
  local response
  local http_code

  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ]; then
    echo "✅ $name: OK (HTTP $http_code)"
    return 0
  else
    echo "❌ $name: FAILED (HTTP $http_code)"
    return 1
  fi
}

send_alert() {
  local message=$1
  echo "🚨 ALERT: $message"

  # Slack notification
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\": \"🚨 *Blazion Forms Alert*\n${message}\nTimestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
      > /dev/null 2>&1
  fi
}

echo "═══════════════════════════════════"
echo "  Blazion Forms Health Check"
echo "  $(date)"
echo "═══════════════════════════════════"

FAILURES=0

check_service "API" "$API_URL" || FAILURES=$((FAILURES + 1))
check_service "Web" "$WEB_URL" || FAILURES=$((FAILURES + 1))

# Database check (via API health response)
api_health=$(curl -s --max-time 10 "$API_URL" 2>/dev/null || echo '{}')
db_status=$(echo "$api_health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if [ "$db_status" = "healthy" ]; then
  echo "✅ Database: OK"
elif [ "$db_status" = "unknown" ]; then
  echo "⚠️  Database: Status unknown (API unreachable)"
else
  echo "❌ Database: $db_status"
  FAILURES=$((FAILURES + 1))
fi

# Memory check
if [ -n "$api_health" ]; then
  memory=$(echo "$api_health" | grep -o '"rss":"[^"]*"' | cut -d'"' -f4 || echo "")
  uptime=$(echo "$api_health" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4 || echo "")
  echo "📊 Memory: ${memory:-N/A} | Uptime: ${uptime:-N/A}"
fi

echo "═══════════════════════════════════"

if [ $FAILURES -gt 0 ]; then
  send_alert "$FAILURES service(s) are down!"
  exit 1
else
  echo "✨ All systems operational"
  exit 0
fi

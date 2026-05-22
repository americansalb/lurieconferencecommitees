#!/usr/bin/env bash
# Smoke-test the push notification stack end-to-end.
#
# Verifies the deployed backend by exercising every endpoint the mobile apps
# use, in order: login → register device → read prefs → update prefs → send
# test push → list devices → logout.
#
# Usage:
#   BASE_URL=https://conference.aalb.org \
#   EMAIL=you@example.com \
#   PASSWORD='your-password' \
#   ./scripts/smoke-test-push.sh
#
# What it does NOT do: confirm a real push arrived on a real phone. APNs/FCM
# delivery still needs a phone with the app installed. This script verifies
# the *backend* path is healthy and the dispatcher logic works.

set -euo pipefail

BASE_URL="${BASE_URL:-https://conference.aalb.org}"
EMAIL="${EMAIL:-}"
PASSWORD="${PASSWORD:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
    echo "Set EMAIL and PASSWORD env vars."
    exit 1
fi

# Pretty print
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
step()   { printf "\n→ %s\n" "$*"; }

# Detect a JSON parser (jq preferred, fall back to python)
if command -v jq >/dev/null 2>&1; then
    json() { jq -r "$1"; }
else
    json() { python3 -c "import sys, json; v=json.load(sys.stdin);
for k in \"$1\".lstrip('.').split('.'):
    v = v.get(k) if isinstance(v, dict) else v
print(v if v is not None else '')"; }
fi

curl_json() {
    local method=$1; shift
    local path=$1; shift
    local body="${1:-}"
    local extra_headers=()
    if [[ -n "${TOKEN:-}" ]]; then
        extra_headers+=(-H "Authorization: Bearer $TOKEN")
    fi
    if [[ -n "$body" ]]; then
        curl -sS -X "$method" "$BASE_URL$path" \
             -H "Content-Type: application/json" \
             -H "Accept: application/json" \
             "${extra_headers[@]}" \
             --data "$body" \
             -w "\nHTTP_STATUS=%{http_code}"
    else
        curl -sS -X "$method" "$BASE_URL$path" \
             -H "Accept: application/json" \
             "${extra_headers[@]}" \
             -w "\nHTTP_STATUS=%{http_code}"
    fi
}

extract_body() { sed '$d'; }
extract_status() { tail -n1 | sed 's/HTTP_STATUS=//'; }

assert_2xx() {
    local label=$1 status=$2 body=$3
    if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
        green "  $label OK ($status)"
    else
        red "  $label FAILED ($status)"
        printf "  Response: %s\n" "$body"
        exit 1
    fi
}

# 1) Login as the test user
step "1. POST /api/auth/mobile/login"
RESPONSE=$(curl_json POST "/api/auth/mobile/login" "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Login" "$STATUS" "$BODY"
TOKEN=$(printf "%s" "$BODY" | json ".token")
USER_ID=$(printf "%s" "$BODY" | json ".user.id")
if [[ -z "$TOKEN" ]]; then red "  No token in response"; exit 1; fi
green "  Got bearer token (length=${#TOKEN}), user id=$USER_ID"

# 2) Read /me to confirm the token works
step "2. GET /api/auth/mobile/me"
RESPONSE=$(curl_json GET "/api/auth/mobile/me")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Whoami" "$STATUS" "$BODY"

# 3) Register a fake device (so the push dispatcher has somewhere to send)
step "3. POST /api/devices"
FAKE_TOKEN="smoketest_$(date +%s)_$RANDOM"
RESPONSE=$(curl_json POST "/api/devices" \
    "$(printf '{"platform":"ios","pushToken":"%s","deviceName":"Smoke test","appVersion":"smoke-1.0","locale":"en-US","timezone":"America/Chicago"}' "$FAKE_TOKEN")")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Device register" "$STATUS" "$BODY"
DEVICE_ID=$(printf "%s" "$BODY" | json ".id")
green "  Registered device id=$DEVICE_ID"

# 4) List devices and confirm ours is in there
step "4. GET /api/devices"
RESPONSE=$(curl_json GET "/api/devices")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Device list" "$STATUS" "$BODY"
if printf "%s" "$BODY" | grep -q "$DEVICE_ID"; then
    green "  Our smoke device shows up in the list"
else
    red "  Device wasn't returned in the list"
    exit 1
fi

# 5) Read default preferences
step "5. GET /api/notification-preferences"
RESPONSE=$(curl_json GET "/api/notification-preferences")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Read prefs" "$STATUS" "$BODY"

# 6) Update preferences (toggle broadcast off, add a custom lead time)
step "6. PUT /api/notification-preferences"
PREF_BODY='{"events":{"enabled":true,"leadTimesMinutes":[5,15,60],"committeeOverrides":{}},"tasks":{"enabled":true,"leadTimesMinutes":[60],"onAssigned":true,"onStatusChange":false,"onlyMyTasks":true},"discussions":{"enabled":true,"scope":"subscribed","committeeOverrides":{}},"broadcast":{"enabled":true},"quietHours":{"enabled":false,"startHour":22,"endHour":7},"mutedDays":[]}'
RESPONSE=$(curl_json PUT "/api/notification-preferences" "$PREF_BODY")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Update prefs" "$STATUS" "$BODY"

# 7) Fire a test push. Expected outcomes:
#    - If APNs is unconfigured: dispatcher still runs, our fake device is
#      counted as a target, push is recorded as failed in lcc_notification_log.
#    - If APNs is configured: dispatcher sends; our fake token is rejected
#      (BadDeviceToken), the device row is auto-deleted by the dispatcher.
step "7. POST /api/notifications/test"
RESPONSE=$(curl_json POST "/api/notifications/test" "{}")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Test push" "$STATUS" "$BODY"
green "  Dispatcher response: $(printf '%s' "$BODY" | tr -d '\n' | cut -c1-200)"

# 8) Mobile feed
step "8. GET /api/mobile/feed"
RESPONSE=$(curl_json GET "/api/mobile/feed")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Feed" "$STATUS" "$BODY"

# 9) Mobile committees
step "9. GET /api/mobile/committees"
RESPONSE=$(curl_json GET "/api/mobile/committees")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Committees" "$STATUS" "$BODY"

# 10) Cron endpoint - check it answers (and signals if a secret is required)
step "10. POST /api/cron/dispatch-reminders"
RESPONSE=$(curl_json POST "/api/cron/dispatch-reminders" "{}")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
if [[ "$STATUS" = "403" ]]; then
    yellow "  Cron returned 403 — that's expected if CRON_SECRET is set on the backend"
    yellow "  Re-run with: curl -X POST $BASE_URL/api/cron/dispatch-reminders -H 'x-cron-secret: \$CRON_SECRET'"
else
    assert_2xx "Cron drain" "$STATUS" "$BODY"
    green "  Cron processed: $(printf '%s' "$BODY" | tr -d '\n' | cut -c1-200)"
fi

# 11) Cleanup: delete our fake device, logout
step "11. DELETE /api/devices/$DEVICE_ID"
RESPONSE=$(curl_json DELETE "/api/devices/$DEVICE_ID")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Cleanup device" "$STATUS" "$BODY"

step "12. POST /api/auth/mobile/logout"
RESPONSE=$(curl_json POST "/api/auth/mobile/logout" "{}")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
BODY=$(printf "%s" "$RESPONSE" | extract_body)
assert_2xx "Logout" "$STATUS" "$BODY"

# Confirm the token is now dead
step "13. GET /api/auth/mobile/me (should be 401 now)"
RESPONSE=$(curl_json GET "/api/auth/mobile/me")
STATUS=$(printf "%s" "$RESPONSE" | extract_status)
if [[ "$STATUS" = "401" ]]; then
    green "  Token correctly invalidated"
else
    red "  Token still works after logout (status=$STATUS) — session not cleared!"
    exit 1
fi

echo
green "All checks passed. Backend push pipeline is healthy."

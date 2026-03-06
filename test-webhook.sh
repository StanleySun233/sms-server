#!/bin/bash
# Webhook Endpoint Test Script
# This script tests the webhook heartbeat endpoint with various scenarios

BASE_URL="http://localhost:8080"
WEBHOOK_ENDPOINT="${BASE_URL}/api/webhook"

echo "=== Webhook Endpoint Test Suite ==="
echo ""

# Test 1: Health check
echo "Test 1: Webhook endpoint health check"
curl -s -X GET "${WEBHOOK_ENDPOINT}/test"
echo ""
echo ""

# Test 2: Valid webhook with minimal data
echo "Test 2: Valid webhook with minimal data"
TEST_TOKEN="test-token-123456"
curl -s -X POST "${WEBHOOK_ENDPOINT}/${TEST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "1234567890",
      "imei": "123456789012345"
    },
    "new_messages": [],
    "missed_calls": []
  }' | jq .
echo ""
echo ""

# Test 3: Webhook with new messages
echo "Test 3: Webhook with new messages"
curl -s -X POST "${WEBHOOK_ENDPOINT}/${TEST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "1234567890",
      "imei": "123456789012345",
      "signal_strength": 85,
      "battery_level": 75
    },
    "new_messages": [
      {
        "phone": "9876543210",
        "content": "Hello, this is a test message",
        "timestamp": "2026-03-06T12:00:00Z"
      },
      {
        "phone": "5555555555",
        "content": "Another test message",
        "timestamp": "2026-03-06T12:05:00Z"
      }
    ],
    "missed_calls": []
  }' | jq .
echo ""
echo ""

# Test 4: Webhook with missed calls
echo "Test 4: Webhook with missed calls"
curl -s -X POST "${WEBHOOK_ENDPOINT}/${TEST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "1234567890",
      "imei": "123456789012345"
    },
    "new_messages": [],
    "missed_calls": [
      {
        "phone": "9876543210",
        "timestamp": "2026-03-06T11:55:00Z"
      }
    ]
  }' | jq .
echo ""
echo ""

# Test 5: Invalid webhook token
echo "Test 5: Invalid webhook token (should return empty commands)"
curl -s -X POST "${WEBHOOK_ENDPOINT}/invalid-token-xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "1234567890",
      "imei": "123456789012345"
    },
    "new_messages": [],
    "missed_calls": []
  }' | jq .
echo ""
echo ""

# Test 6: SIM card change detection
echo "Test 6: SIM card change (different phone number)"
curl -s -X POST "${WEBHOOK_ENDPOINT}/${TEST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "9999999999",
      "imei": "123456789012345"
    },
    "new_messages": [],
    "missed_calls": []
  }' | jq .
echo ""
echo ""

echo "=== Test Suite Complete ==="

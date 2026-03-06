# Webhook Heartbeat Endpoint - Quick Reference

## Endpoint
```
POST /api/webhook/{webhook_token}
```
**Authentication**: None (public endpoint, secured by token validation)

## Request Format
```json
{
  "device_info": {
    "phone_number": "1234567890",      // Current SIM phone number
    "imei": "123456789012345",         // Device IMEI
    "signal_strength": 85,             // Optional: 0-100
    "battery_level": 75                // Optional: 0-100
  },
  "new_messages": [
    {
      "phone": "0987654321",           // Sender phone number
      "content": "Message text",       // SMS content
      "timestamp": "2026-03-06T12:00:00Z"  // ISO 8601 format
    }
  ],
  "missed_calls": [
    {
      "phone": "0987654321",           // Caller phone number
      "timestamp": "2026-03-06T11:55:00Z"  // ISO 8601 format
    }
  ]
}
```

## Response Format
```json
{
  "commands": [
    {
      "type": "send_sms",              // Command type
      "task_id": "123",                // Task ID for tracking
      "phone": "0987654321",           // Recipient phone number
      "content": "Reply message"       // SMS content to send
    }
  ]
}
```

## Processing Logic

### 1. Token Validation
- Lookup device by `webhook_token`
- If not found → return empty commands (HTTP 200)

### 2. Heartbeat Update
- Set `device.last_heartbeat_at = NOW()`
- Update `device.imei` from device_info

### 3. SIM Change Detection
- Compare `device_info.phone_number` with `device.current_phone_number`
- If different → Insert record in `sim_change_log` table
- Update `device.current_phone_number`

### 4. Save New Messages
- Insert each message into `sms_message` table:
  - `direction` = "received"
  - `status` = "delivered"
  - `created_at` = message timestamp (or NOW if invalid)
- Invalidate Redis cache: `device:unread:{device_id}`

### 5. Save Missed Calls
- Insert each call into `missed_call` table:
  - `call_time` = call timestamp (or NOW if invalid)
  - `created_at` = NOW

### 6. Retrieve Pending SMS
- Pop up to 10 tasks from Redis queue: `task:sms:{device_id}`
- Filter tasks with `status` = "pending"
- Update task `status` = "sent", `sent_at` = NOW
- Add to commands array

### 7. Update Device Status
- Set Redis cache: `device:status:{device_id}` = "online" (TTL: 10 min)

## Error Handling

**CRITICAL**: Always return HTTP 200 with valid JSON, even on errors.

```java
try {
    // Process webhook
    return ResponseEntity.ok(response);
} catch (Exception e) {
    log.error("Error", e);
    return ResponseEntity.ok(new WebhookResponse()); // Empty commands
}
```

This prevents devices from thinking the server is down.

## Device Status Calculation

Based on `last_heartbeat_at`:
- **Online**: < 3 minutes ago
- **Warning**: 3-5 minutes ago
- **Offline**: > 5 minutes ago

## Redis Keys

| Key Pattern | Purpose | TTL |
|------------|---------|-----|
| `task:sms:{device_id}` | Pending SMS queue | None |
| `device:status:{device_id}` | Device online status | 10 min |
| `device:unread:{device_id}` | Unread message count | Varies |

## Database Tables

### devices
```sql
id, user_id, alias, webhook_token, current_phone_number, imei, last_heartbeat_at, created_at
```

### sms_message
```sql
id, device_id, phone_number, content, direction, status, created_at, updated_at, read_at
```
- **direction**: 'sent' | 'received'
- **status**: 'pending' | 'sent' | 'delivered' | 'failed'

### missed_call
```sql
id, device_id, phone_number, call_time, created_at, read_at
```

### pending_sms
```sql
id, device_id, phone_number, content, status, created_at, updated_at, sent_at, delivered_at
```
- **status**: 'pending' | 'sent' | 'delivered' | 'failed'

### sim_change_log
```sql
id, device_id, old_phone_number, new_phone_number, changed_at
```

## Testing

### Health Check
```bash
curl http://localhost:8080/api/webhook/test
```

### Send Heartbeat
```bash
curl -X POST http://localhost:8080/api/webhook/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "1234567890",
      "imei": "123456789012345"
    },
    "new_messages": [],
    "missed_calls": []
  }'
```

### Run Test Suite
```bash
./test-webhook.sh
```

## Performance Considerations

- MyBatis-Plus batch insert for multiple messages/calls
- Redis caching reduces database queries
- Transaction management ensures atomicity
- Maximum 10 pending SMS per heartbeat (prevents overload)

## Security

✓ Public endpoint (no session required)
✓ Secured by webhook_token validation
✓ Rate limited by Nginx (2 req/s per IP)
✓ Parameterized queries prevent SQL injection
✓ Input validation with safe defaults

## Integration Points

- **Device Management**: Uses Device entity and mapper
- **SMS Messaging**: Creates and retrieves PendingSms tasks
- **Missed Call Tracking**: Logs missed call records
- **Dashboard**: Provides device status and message counts

## Common Issues

### Invalid timestamp format
- Fallback: Use server time (NOW)
- Log warning but don't fail request

### Database connection error
- Return empty commands
- Log error for debugging
- Device will retry on next heartbeat

### Redis unavailable
- Catch exception, continue processing
- Skip pending SMS retrieval
- Return empty commands array

## Monitoring Metrics

Track these metrics:
- Heartbeat requests per minute
- Average processing time
- Error rate
- Pending SMS queue length
- Device status distribution (online/warning/offline)

## Alerts

Set alerts for:
- Error rate > 5%
- Processing time > 1 second
- No heartbeat from device > 10 minutes
- Redis queue size > 1000

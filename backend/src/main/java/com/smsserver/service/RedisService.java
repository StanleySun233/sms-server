package com.smsserver.service;

import com.smsserver.entity.PendingSms;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.List;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;
    private static final DefaultRedisScript<Long> RELEASE_LOCK = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class);

    public record HeartbeatLease(String key, String owner, boolean busy) {
    }

    public HeartbeatLease acquireHeartbeatLease(String token) {
        String key = "sms:heartbeat-lock:" + UUID.nameUUIDFromBytes(token.getBytes(StandardCharsets.UTF_8));
        String owner = UUID.randomUUID().toString();
        try {
            boolean acquired = Boolean.TRUE.equals(redisTemplate.opsForValue()
                    .setIfAbsent(key, owner, 15, TimeUnit.SECONDS));
            return new HeartbeatLease(key, acquired ? owner : null, !acquired);
        } catch (RuntimeException e) {
            log.warn("Redis heartbeat lock unavailable, using the database row lock");
            return new HeartbeatLease(key, null, false);
        }
    }

    public void releaseHeartbeatLease(HeartbeatLease lease) {
        if (lease.owner() == null) return;
        try {
            redisTemplate.execute(RELEASE_LOCK, List.of(lease.key()), lease.owner());
        } catch (RuntimeException e) {
            log.warn("Could not release heartbeat lock before expiry");
        }
    }

    /**
     * Store a value in Redis
     * @param key The key
     * @param value The value
     * @param expirySeconds Expiry time in seconds
     */
    public void set(String key, String value, long expirySeconds) {
        redisTemplate.opsForValue().set(key, value, expirySeconds, TimeUnit.SECONDS);
    }

    /**
     * Retrieve a value from Redis
     * @param key The key
     * @return The value or null if key doesn't exist
     */
    public String get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Delete a key from Redis
     * @param key The key
     */
    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public void trackSmsAfterCommit(PendingSms task) {
        String key = "sms:progress:" + task.getDeviceId() + ":" + task.getId();
        String progress = task.getStatus() + "|" + task.getUpdatedAt() + "|"
                + java.util.Objects.toString(task.getAttemptId(), "") + "|"
                + java.util.Objects.toString(task.getAttemptExpiresAt(), "") + "|"
                + task.getAttemptCount() + "|" + task.getAttemptOfferCount();
        afterCommit(() -> set(key, progress, 604800));
    }

    public void refreshHeartbeatAfterCommit(Long deviceId, boolean invalidateUnreadCount) {
        afterCommit(() -> {
            if (invalidateUnreadCount) deleteDeviceUnreadCount(deviceId);
            setDeviceStatus(deviceId, "online");
        });
    }

    private void afterCommit(Runnable operation) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    operation.run();
                } catch (RuntimeException e) {
                    log.warn("Could not refresh Redis cache ({})", e.getClass().getSimpleName());
                }
            }
        });
    }

    /**
     * Set device status cache
     * @param deviceId The device ID
     * @param status The status (online, warning, offline)
     */
    public void setDeviceStatus(Long deviceId, String status) {
        String key = "device:status:" + deviceId;
        redisTemplate.opsForValue().set(key, status, 10, TimeUnit.MINUTES);
    }

    /**
     * Get device status from cache
     * @param deviceId The device ID
     * @return The status or null if not cached
     */
    public String getDeviceStatus(Long deviceId) {
        String key = "device:status:" + deviceId;
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Delete device unread count cache
     * @param deviceId The device ID
     */
    public void deleteDeviceUnreadCount(Long deviceId) {
        String key = "device:unread:" + deviceId;
        redisTemplate.delete(key);
    }

    /**
     * Get device unread count from cache
     * @param deviceId The device ID
     * @return The unread count or null if not cached
     */
    public Long getDeviceUnreadCount(Long deviceId) {
        String key = "device:unread:" + deviceId;
        String count = redisTemplate.opsForValue().get(key);
        return count != null ? Long.parseLong(count) : null;
    }

    /**
     * Set device unread count cache
     * @param deviceId The device ID
     * @param count The unread count
     */
    public void setDeviceUnreadCount(Long deviceId, Long count) {
        String key = "device:unread:" + deviceId;
        redisTemplate.opsForValue().set(key, count.toString(), 10, TimeUnit.MINUTES);
    }

    public long deleteKeysByPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            return keys.size();
        }
        return 0;
    }
}

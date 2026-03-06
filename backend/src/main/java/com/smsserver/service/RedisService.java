package com.smsserver.service;

import com.smsserver.entity.PendingSms;
import com.smsserver.mapper.PendingSmsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;
    private final PendingSmsMapper pendingSmsMapper;

    /**
     * Store a session in Redis
     * @param sessionId The session ID
     * @param userId The user ID
     * @param expirySeconds Session expiry time in seconds
     */
    public void setSession(String sessionId, Long userId, long expirySeconds) {
        String key = "session:" + sessionId;
        redisTemplate.opsForValue().set(key, userId.toString(), expirySeconds, TimeUnit.SECONDS);
    }

    /**
     * Retrieve a session from Redis
     * @param sessionId The session ID
     * @return The user ID or null if session doesn't exist
     */
    public Long getSession(String sessionId) {
        String key = "session:" + sessionId;
        String userId = redisTemplate.opsForValue().get(key);
        return userId != null ? Long.parseLong(userId) : null;
    }

    /**
     * Delete a session from Redis
     * @param sessionId The session ID
     */
    public void deleteSession(String sessionId) {
        String key = "session:" + sessionId;
        redisTemplate.delete(key);
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

    /**
     * Push a pending SMS task to the device queue
     * @param deviceId The device ID
     * @param taskId The task ID
     */
    public void pushPendingSmsTask(Long deviceId, Long taskId) {
        String key = "task:sms:" + deviceId;
        redisTemplate.opsForList().rightPush(key, taskId.toString());
    }

    /**
     * Pop pending SMS tasks from the device queue (max 10 at once)
     * @param deviceId The device ID
     * @return List of pending SMS tasks
     */
    public List<PendingSms> popPendingSmsTasks(Long deviceId) {
        String key = "task:sms:" + deviceId;
        List<PendingSms> tasks = new ArrayList<>();

        // Pop up to 10 tasks at once
        for (int i = 0; i < 10; i++) {
            String taskId = redisTemplate.opsForList().leftPop(key);
            if (taskId == null) break;

            PendingSms task = pendingSmsMapper.selectById(Long.parseLong(taskId));
            if (task != null && "pending".equals(task.getStatus())) {
                tasks.add(task);
            }
        }

        return tasks;
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
}

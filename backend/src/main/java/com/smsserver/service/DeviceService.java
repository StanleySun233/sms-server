package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.CreateDeviceRequest;
import com.smsserver.dto.UpdateDeviceRequest;
import com.smsserver.entity.Device;
import com.smsserver.mapper.DeviceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {
    private final DeviceMapper deviceMapper;

    private static final String TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TOKEN_LENGTH = 16;
    private static final Random RANDOM = new Random();

    /**
     * Generate a unique 16-character webhook token
     */
    private String generateWebhookToken() {
        String token;
        int attempts = 0;
        do {
            StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
            for (int i = 0; i < TOKEN_LENGTH; i++) {
                sb.append(TOKEN_CHARS.charAt(RANDOM.nextInt(TOKEN_CHARS.length())));
            }
            token = sb.toString();
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("Failed to generate unique webhook token");
            }
        } while (deviceMapper.findByWebhookToken(token) != null);

        return token;
    }

    /**
     * Calculate device status based on last heartbeat
     * online: < 3 minutes
     * warning: 3-5 minutes
     * offline: > 5 minutes or null
     */
    public String calculateDeviceStatus(Device device) {
        if (device.getLastHeartbeatAt() == null) {
            return "offline";
        }
        Instant heartbeat = device.getLastHeartbeatAt().atZone(ZoneOffset.UTC).toInstant();
        Duration duration = Duration.between(heartbeat, Instant.now());
        long minutes = duration.toMinutes();
        if (minutes < 0) {
            return "online";
        }
        if (minutes < 3) {
            return "online";
        }
        if (minutes < 5) {
            return "warning";
        }
        return "offline";
    }

    /**
     * Create a new device for a user
     */
    @Transactional
    public Device createDevice(Long userId, CreateDeviceRequest request) {
        Device device = new Device();
        device.setUserId(userId);
        device.setAlias(request.getAlias());
        device.setWebhookToken(generateWebhookToken());

        deviceMapper.insert(device);
        log.info("Created device {} for user {}", device.getId(), userId);
        return device;
    }

    /**
     * List all devices for a user
     */
    public List<Device> listUserDevices(Long userId) {
        LambdaQueryWrapper<Device> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Device::getUserId, userId)
               .orderByDesc(Device::getCreatedAt);
        return deviceMapper.selectList(wrapper);
    }

    /**
     * Get a single device by ID
     */
    public Device getDevice(Long id, Long userId) {
        Device device = deviceMapper.selectById(id);
        if (device == null) {
            throw new RuntimeException("Device not found");
        }

        // Verify ownership
        if (!device.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return device;
    }

    /**
     * Update device alias only
     */
    @Transactional
    public Device updateDevice(Long id, Long userId, UpdateDeviceRequest request) {
        Device device = getDevice(id, userId);
        device.setAlias(request.getAlias());
        deviceMapper.updateById(device);
        log.info("Updated device {} alias to {}", id, request.getAlias());
        return device;
    }

    /**
     * Delete device and cascade delete related records
     */
    @Transactional
    public void deleteDevice(Long id, Long userId) {
        Device device = getDevice(id, userId);

        // Cascade delete related records
        deviceMapper.deleteSmsMessagesByDeviceId(id);
        deviceMapper.deleteMissedCallsByDeviceId(id);
        deviceMapper.deletePendingSmsByDeviceId(id);
        deviceMapper.deleteSimChangeLogsByDeviceId(id);

        // Delete device
        deviceMapper.deleteById(id);
        log.info("Deleted device {} for user {}", id, userId);
    }

    /**
     * Find device by webhook token (for webhook authentication)
     */
    public Device findByWebhookToken(String token) {
        return deviceMapper.findByWebhookToken(token);
    }
}

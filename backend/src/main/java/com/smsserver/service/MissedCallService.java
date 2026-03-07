package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.missedcall.MissedCallResponse;
import com.smsserver.dto.missedcall.MissedCallSummary;
import com.smsserver.entity.Device;
import com.smsserver.entity.MissedCall;
import com.smsserver.mapper.DeviceMapper;
import com.smsserver.mapper.MissedCallMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing missed calls
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MissedCallService {
    private final MissedCallMapper missedCallMapper;
    private final DeviceMapper deviceMapper;

    /**
     * Get missed calls grouped by phone number for a device
     * @param deviceId The device ID
     * @param userId The user ID for authorization
     * @return List of missed call summaries grouped by phone
     */
    public List<MissedCallSummary> getMissedCallsByPhone(Long deviceId, Long userId) {
        // Verify device ownership
        verifyDeviceOwnership(deviceId, userId);

        // Get all missed calls for the device, ordered by call time
        LambdaQueryWrapper<MissedCall> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MissedCall::getDeviceId, deviceId)
               .orderByDesc(MissedCall::getCallTime);

        List<MissedCall> calls = missedCallMapper.selectList(wrapper);

        // Group by phone number and aggregate
        Map<String, MissedCallSummary> summaryMap = new LinkedHashMap<>();
        for (MissedCall call : calls) {
            String phone = call.getPhoneNumber();
            if (!summaryMap.containsKey(phone)) {
                summaryMap.put(phone, new MissedCallSummary(phone, 0L, call.getCallTime()));
            }
            MissedCallSummary summary = summaryMap.get(phone);
            summary.setCount(summary.getCount() + 1);
            // Keep the latest call time
            if (call.getCallTime().isAfter(summary.getLastCallTime())) {
                summary.setLastCallTime(call.getCallTime());
            }
        }

        return new ArrayList<>(summaryMap.values());
    }

    /**
     * Get call history for a specific phone number
     * @param deviceId The device ID
     * @param phone The phone number
     * @param userId The user ID for authorization
     * @return List of missed calls from that phone
     */
    public List<MissedCallResponse> getCallHistory(Long deviceId, String phone, Long userId) {
        // Verify device ownership
        verifyDeviceOwnership(deviceId, userId);

        // Get all calls from this phone number
        LambdaQueryWrapper<MissedCall> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MissedCall::getDeviceId, deviceId)
               .eq(MissedCall::getPhoneNumber, phone)
               .orderByDesc(MissedCall::getCallTime);

        List<MissedCall> calls = missedCallMapper.selectList(wrapper);

        // Convert to DTOs
        return calls.stream()
                .map(call -> new MissedCallResponse(
                    call.getId(),
                    call.getPhoneNumber(),
                    call.getCallTime(),
                    call.getReadAt()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Mark multiple calls as read
     * @param callIds List of call IDs to mark as read
     * @param userId The user ID for authorization
     */
    @Transactional
    public void markCallsAsRead(List<Long> callIds, Long userId) {
        if (callIds == null || callIds.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        for (Long callId : callIds) {
            MissedCall call = missedCallMapper.selectById(callId);
            if (call == null) {
                log.warn("Call {} not found, skipping", callId);
                continue;
            }

            // Verify device ownership
            verifyDeviceOwnership(call.getDeviceId(), userId);

            // Mark as read if not already read
            if (call.getReadAt() == null) {
                call.setReadAt(now);
                missedCallMapper.updateById(call);
                log.debug("Marked call {} as read", callId);
            }
        }

        log.info("Marked {} calls as read for user {}", callIds.size(), userId);
    }

    /**
     * Get unread call count for a device
     * @param deviceId The device ID
     * @param userId The user ID for authorization
     * @return Count of unread calls
     */
    public Long getUnreadCallCount(Long deviceId, Long userId) {
        // Verify device ownership
        verifyDeviceOwnership(deviceId, userId);

        LambdaQueryWrapper<MissedCall> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MissedCall::getDeviceId, deviceId)
               .isNull(MissedCall::getReadAt);

        return missedCallMapper.selectCount(wrapper);
    }

    /**
     * Verify that the user owns the device
     * @param deviceId The device ID
     * @param userId The user ID
     * @throws RuntimeException if device not found or access denied
     */
    private void verifyDeviceOwnership(Long deviceId, Long userId) {
        Device device = deviceMapper.selectById(deviceId);
        if (device == null) {
            throw new RuntimeException("Device not found");
        }
        if (!device.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
    }
}

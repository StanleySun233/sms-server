package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.smsserver.dto.webhook.WebhookRequest;
import com.smsserver.dto.webhook.WebhookResponse;
import com.smsserver.entity.Device;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.PendingSmsMapper;
import com.smsserver.mapper.SmsMessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SmsDispatchService {
    private static final Set<String> DEVICE_RESULTS = Set.of("submitted", "failed", "unknown");
    private static final int MAX_OFFERS = 3;
    public static final int MAX_ATTEMPTS = 3;
    private final PendingSmsMapper tasks;
    private final SmsMessageMapper messages;
    private final RedisService redis;

    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    @Transactional
    public void expireOverdueTasks() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        List<PendingSms> overdue = tasks.selectList(new LambdaQueryWrapper<PendingSms>()
                .in(PendingSms::getStatus, "pending", "dispatching")
                .le(PendingSms::getAttemptExpiresAt, now)
                .orderByAsc(PendingSms::getAttemptExpiresAt)
                .last("LIMIT 100 FOR UPDATE SKIP LOCKED"));
        for (PendingSms task : overdue) {
            transition(task, "pending".equals(task.getStatus()) ? "expired" : "unknown", now);
        }
    }

    public void processHeartbeat(Device device, WebhookRequest request, WebhookResponse response) {
        if (!Integer.valueOf(2).equals(request.getSmsProtocol())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        processResults(device, request, response, now);
        if (!Integer.valueOf(2).equals(device.getSmsProtocol())) return;
        List<PendingSms> candidates = tasks.selectList(new LambdaQueryWrapper<PendingSms>()
                .eq(PendingSms::getDeviceId, device.getId())
                .in(PendingSms::getStatus, "pending", "dispatching")
                .orderByDesc(PendingSms::getStatus)
                .orderByAsc(PendingSms::getId)
                .last("LIMIT 20 FOR UPDATE"));
        for (PendingSms task : candidates) {
            if ("dispatching".equals(task.getStatus())) {
                if (!task.getAttemptExpiresAt().isAfter(now)) {
                    transition(task, "unknown", now);
                    continue;
                }
                if (sameSim(task, device) && Objects.equals(task.getAttemptOwner(), request.getDeviceSession())
                        && task.getAttemptOfferCount() < MAX_OFFERS) {
                    offer(task, response, now);
                }
                return;
            }
            if (task.getAttemptExpiresAt() == null || !task.getAttemptExpiresAt().isAfter(now)) {
                transition(task, "expired", now);
            } else if (!sameSim(task, device)) {
                transition(task, "failed", now);
            } else {
                task.setAttemptId(UUID.randomUUID().toString());
                task.setAttemptOwner(request.getDeviceSession());
                task.setAttemptOfferCount(0);
                task.setAttemptExpiresAt(now.plusMinutes(5));
                offer(task, response, now);
                return;
            }
        }
    }

    private void processResults(Device device, WebhookRequest request, WebhookResponse response, LocalDateTime now) {
        if (request.getSmsResults() == null) return;
        for (WebhookRequest.SmsResult result : request.getSmsResults().stream().limit(20).toList()) {
            if (result == null || result.getAttemptId() == null || result.getStatus() == null
                    || !DEVICE_RESULTS.contains(result.getStatus())) continue;
            PendingSms task = tasks.selectOne(new LambdaQueryWrapper<PendingSms>()
                    .eq(PendingSms::getDeviceId, device.getId())
                    .eq(PendingSms::getAttemptId, result.getAttemptId())
                    .last("LIMIT 1 FOR UPDATE"));
            if (task != null && ("dispatching".equals(task.getStatus()) || "unknown".equals(task.getStatus()))) {
                transition(task, result.getStatus(), now);
            }
            response.getAcknowledgedAttempts().add(result.getAttemptId());
        }
    }

    private boolean sameSim(PendingSms task, Device device) {
        return task.getExpectedSim() != null && Objects.equals(task.getExpectedSim(), device.getCurrentSimId());
    }

    private void offer(PendingSms task, WebhookResponse response, LocalDateTime now) {
        task.setAttemptOfferCount(task.getAttemptOfferCount() + 1);
        transition(task, "dispatching", now);
        response.getCommands().add(WebhookResponse.Command.sendSms(
                task.getId(), task.getAttemptId(), task.getExpectedSim(), task.getPhoneNumber(), task.getContent()));
    }

    public void transition(PendingSms task, String status, LocalDateTime now) {
        task.setStatus(status);
        task.setUpdatedAt(now);
        if ("submitted".equals(status)) task.setSentAt(now);
        tasks.updateById(task);
        messages.update(null, new LambdaUpdateWrapper<SmsMessage>()
                .eq(SmsMessage::getPendingSmsId, task.getId())
                .set(SmsMessage::getStatus, status)
                .set(SmsMessage::getUpdatedAt, now));
        redis.trackSmsAfterCommit(task);
    }
}

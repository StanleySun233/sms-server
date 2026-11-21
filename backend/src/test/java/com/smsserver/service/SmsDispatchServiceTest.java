package com.smsserver.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.smsserver.dto.webhook.WebhookRequest;
import com.smsserver.dto.webhook.WebhookResponse;
import com.smsserver.entity.Device;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.PendingSmsMapper;
import com.smsserver.mapper.SmsMessageMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.apache.ibatis.builder.MapperBuilderAssistant;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SmsDispatchServiceTest {
    private final PendingSmsMapper tasks = mock(PendingSmsMapper.class);
    private final SmsMessageMapper messages = mock(SmsMessageMapper.class);
    private final RedisService redis = mock(RedisService.class);
    private final SmsDispatchService service = new SmsDispatchService(tasks, messages, redis);

    @BeforeAll
    static void configureMappings() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), "test"), SmsMessage.class);
    }

    @Test
    void lostResponseReusesAttemptUntilDeviceConfirmsSubmission() {
        PendingSms task = task();
        Device device = device();
        when(tasks.selectList(any())).thenReturn(List.of(task));
        var request = new WebhookRequest();
        request.setSmsProtocol(2);
        request.setDeviceSession("device-session-a");
        var first = new WebhookResponse();
        service.processHeartbeat(device, request, first);
        assertEquals("dispatching", task.getStatus());
        assertNull(task.getSentAt());

        var second = new WebhookResponse();
        service.processHeartbeat(device, request, second);
        assertEquals(first.getCommands().get(0).getAttemptId(), second.getCommands().get(0).getAttemptId());

        var result = new WebhookRequest.SmsResult();
        result.setAttemptId(task.getAttemptId());
        result.setStatus("submitted");
        request.setSmsResults(List.of(result));
        when(tasks.selectOne(any())).thenReturn(task);
        when(tasks.selectList(any())).thenReturn(List.of());
        var confirmed = new WebhookResponse();
        service.processHeartbeat(device, request, confirmed);
        assertEquals(List.of(task.getAttemptId()), confirmed.getAcknowledgedAttempts());
        assertEquals("submitted", task.getStatus());
        assertNotNull(task.getSentAt());
        assertTrue(confirmed.getCommands().isEmpty());
        verify(redis, times(3)).trackSmsAfterCommit(task);
    }

    @Test
    void changedSimCannotReceiveAnExistingQueueEntry() {
        PendingSms task = task();
        Device device = device();
        device.setCurrentSimId("another-sim");
        when(tasks.selectList(any())).thenReturn(List.of(task));
        var request = new WebhookRequest();
        request.setSmsProtocol(2);
        var response = new WebhookResponse();
        service.processHeartbeat(device, request, response);
        assertEquals("failed", task.getStatus());
        assertTrue(response.getCommands().isEmpty());
        assertNull(task.getAttemptId());
    }

    @Test
    void overdueDispatchStaysUnknownWhileUnsentTaskExpires() {
        PendingSms queued = task();
        PendingSms dispatching = task();
        dispatching.setStatus("dispatching");
        when(tasks.selectList(any())).thenReturn(List.of(queued, dispatching));
        service.expireOverdueTasks();
        assertEquals("expired", queued.getStatus());
        assertEquals("unknown", dispatching.getStatus());
    }

    @Test
    void replayIsBoundedAndNeverMovesToASecondBootSession() {
        PendingSms task = task();
        when(tasks.selectList(any())).thenReturn(List.of(task));
        var request = new WebhookRequest();
        request.setSmsProtocol(2);
        request.setDeviceSession("device-session-a");
        var initial = new WebhookResponse();
        service.processHeartbeat(device(), request, initial);
        String attemptId = initial.getCommands().get(0).getAttemptId();

        request.setDeviceSession("device-session-b");
        var differentSession = new WebhookResponse();
        service.processHeartbeat(device(), request, differentSession);
        assertTrue(differentSession.getCommands().isEmpty());
        assertEquals(1, task.getAttemptOfferCount());

        request.setDeviceSession("device-session-a");
        for (int i = 0; i < 2; i++) {
            var replay = new WebhookResponse();
            service.processHeartbeat(device(), request, replay);
            assertEquals(attemptId, replay.getCommands().get(0).getAttemptId());
        }
        var exhausted = new WebhookResponse();
        service.processHeartbeat(device(), request, exhausted);
        assertTrue(exhausted.getCommands().isEmpty());
        assertEquals(3, task.getAttemptOfferCount());
    }

    private PendingSms task() {
        var task = new PendingSms();
        task.setId(1L);
        task.setDeviceId(1L);
        task.setStatus("pending");
        task.setExpectedSim("original-sim");
        task.setAttemptExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusHours(1));
        return task;
    }

    private Device device() {
        var device = new Device();
        device.setId(1L);
        device.setSmsProtocol(2);
        device.setCurrentSimId("original-sim");
        return device;
    }
}

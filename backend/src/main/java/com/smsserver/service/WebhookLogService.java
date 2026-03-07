package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smsserver.dto.webhook.PagedWebhookLogsResponse;
import com.smsserver.entity.WebhookLog;
import com.smsserver.mapper.WebhookLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebhookLogService {
    private final DeviceService deviceService;
    private final WebhookLogMapper webhookLogMapper;

    public PagedWebhookLogsResponse getLogsByDevice(Long deviceId, Long userId, int page, int size) {
        deviceService.getDevice(deviceId, userId);
        Page<WebhookLog> p = new Page<>(page, size);
        LambdaQueryWrapper<WebhookLog> q = new LambdaQueryWrapper<>();
        q.eq(WebhookLog::getDeviceId, deviceId).orderByDesc(WebhookLog::getReceivedAt);
        Page<WebhookLog> result = webhookLogMapper.selectPage(p, q);
        return PagedWebhookLogsResponse.from(result);
    }
}

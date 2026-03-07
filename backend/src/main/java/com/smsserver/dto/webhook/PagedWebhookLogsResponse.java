package com.smsserver.dto.webhook;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smsserver.entity.WebhookLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedWebhookLogsResponse {
    private List<WebhookLogResponse> records;
    private long total;
    private long current;
    private long size;
    private boolean last;

    public static PagedWebhookLogsResponse from(Page<WebhookLog> page) {
        List<WebhookLogResponse> records = page.getRecords().stream()
                .map(WebhookLogResponse::fromEntity)
                .collect(Collectors.toList());
        return new PagedWebhookLogsResponse(
                records,
                page.getTotal(),
                page.getCurrent(),
                page.getSize(),
                page.getCurrent() >= page.getPages()
        );
    }
}

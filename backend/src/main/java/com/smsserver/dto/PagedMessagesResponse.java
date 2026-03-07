package com.smsserver.dto;

import com.smsserver.entity.SmsMessage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedMessagesResponse {
    private List<SmsMessage> records;
    private long total;
    private long current;
    private long size;
    private boolean last;

    public static PagedMessagesResponse from(com.baomidou.mybatisplus.extension.plugins.pagination.Page<SmsMessage> page) {
        long pages = page.getPages();
        return new PagedMessagesResponse(
                page.getRecords(),
                page.getTotal(),
                page.getCurrent(),
                page.getSize(),
                page.getCurrent() >= pages
        );
    }
}

package com.smsserver.dto.missedcall;

import lombok.Data;

import java.util.List;

@Data
public class MarkCallsReadRequest {
    private List<Long> callIds;
}

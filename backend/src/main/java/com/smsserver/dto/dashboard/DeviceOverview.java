package com.smsserver.dto.dashboard;

import com.smsserver.entity.Device;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeviceOverview extends Device {
    private int unreadMessages;
    private int unreadCalls;
    private int outgoingTasks;
}

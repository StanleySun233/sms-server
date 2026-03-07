package com.smsserver.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class WebhookResponse {
    private List<Command> commands = new ArrayList<>();

    @Data
    public static class Command {
        private String type; // "send_sms"
        private String taskId;
        private String phone;
        private String content;

        public static Command sendSms(Long taskId, String phone, String content) {
            Command command = new Command();
            command.setType("send_sms");
            command.setTaskId(taskId.toString());
            command.setPhone(phone);
            command.setContent(content);
            return command;
        }
    }
}

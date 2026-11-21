package com.smsserver.dto.webhook;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class WebhookResponse {
    private List<Command> commands = new ArrayList<>();
    private List<String> acknowledgedAttempts = new ArrayList<>();

    @Data
    public static class Command {
        private String type;
        private String taskId;
        private String attemptId;
        private String expectedSim;
        private String phone;
        private String content;

        public static Command sendSms(Long taskId, String attemptId, String expectedSim, String phone, String content) {
            Command command = new Command();
            command.setType("send_sms");
            command.setTaskId(taskId.toString());
            command.setAttemptId(attemptId);
            command.setExpectedSim(expectedSim);
            command.setPhone(phone);
            command.setContent(content);
            return command;
        }
    }
}

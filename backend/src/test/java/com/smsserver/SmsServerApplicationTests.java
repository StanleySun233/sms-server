package com.smsserver;

import com.smsserver.mapper.SmsMessageMapper;
import com.smsserver.mapper.MissedCallMapper;
import com.smsserver.service.RedisService;
import com.smsserver.service.SmsService;
import com.smsserver.service.AuthService;
import com.smsserver.service.DeviceService;
import com.smsserver.service.DashboardService;
import com.smsserver.dto.device.UpdateDeviceRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;

import java.util.List;

@SpringBootTest
@ActiveProfiles("test")
class SmsServerApplicationTests {
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private SmsMessageMapper messages;
    @Autowired
    private MissedCallMapper missedCalls;
    @Autowired
    private SmsService sms;
    @Autowired
    private AuthService auth;
    @Autowired
    private DeviceService devices;
    @Autowired
    private DashboardService dashboard;
    @Autowired
    private BCryptPasswordEncoder passwords;
    @MockBean
    private RedisService redis;

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
    }

    @Test
    void conversationSummaryKeepsLinesAndDevicesSeparateAndBreaksTimestampTies() {
        jdbc.execute("""
                CREATE TABLE sms_message (
                    id BIGINT PRIMARY KEY, device_id BIGINT, receiver_phone VARCHAR(20),
                    phone_number VARCHAR(20), content VARCHAR(200), direction VARCHAR(12),
                    created_at TIMESTAMP, read_at TIMESTAMP
                )
                """);
        try {
            jdbc.update("""
                    INSERT INTO sms_message VALUES
                    (1,1,'10000','10001','older same time','received','2026-11-21 12:00:00',NULL),
                    (2,1,'10000','10001','latest same time','sent','2026-11-21 12:00:00',NULL),
                    (3,1,'10002','10001','previous line','received','2026-11-21 13:00:00',NULL),
                    (4,1,NULL,'10001','unassigned line','received','2026-11-21 14:00:00',NULL),
                    (5,2,'10000','10001','different device','received','2026-11-21 15:00:00',NULL),
                    (6,1,'10000','10003','already read','received','2026-11-21 11:00:00','2026-11-21 12:00:00')
                    """);
            var summaries = messages.findConversationSummaries(1L, "10000");
            assertEquals(2, summaries.size());
            assertEquals("latest same time", summaries.get(0).getLastMessage());
            assertEquals("sent", summaries.get(0).getLastMessageDirection());
            assertEquals(1, summaries.get(0).getUnreadCount());
            assertEquals(0, summaries.get(1).getUnreadCount());
            assertEquals("unassigned line", messages.findConversationSummaries(1L, "__unknown__").get(0).getLastMessage());
        } finally {
            jdbc.execute("DROP TABLE sms_message");
        }
    }

    @Test
    void markReadRejectsMixedOwnersAndLeavesOutgoingMessagesUntouched() {
        jdbc.execute("CREATE TABLE devices (id BIGINT PRIMARY KEY, user_id BIGINT)");
        jdbc.execute("""
                CREATE TABLE sms_message (
                    id BIGINT PRIMARY KEY, device_id BIGINT, direction VARCHAR(12),
                    status VARCHAR(12), read_at TIMESTAMP
                )
                """);
        try {
            jdbc.update("INSERT INTO devices VALUES (1,10), (2,20)");
            jdbc.update("""
                    INSERT INTO sms_message VALUES
                    (1,1,'received','delivered',NULL),
                    (2,1,'sent','dispatching',NULL),
                    (3,2,'received','delivered',NULL)
                    """);
            assertThrows(IllegalArgumentException.class, () -> sms.markMessagesAsRead(List.of(1L, 3L), 10L));
            assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM sms_message WHERE read_at IS NOT NULL", Integer.class));
            sms.markMessagesAsRead(List.of(1L, 2L), 10L);
            assertEquals(List.of(1L), jdbc.queryForList("SELECT id FROM sms_message WHERE read_at IS NOT NULL", Long.class));
            assertEquals("dispatching", jdbc.queryForObject("SELECT status FROM sms_message WHERE id=2", String.class));
            verify(redis).invalidateSmsUnreadCountsAfterCommit(List.of(1L));
        } finally {
            jdbc.execute("DROP TABLE sms_message");
            jdbc.execute("DROP TABLE devices");
        }
    }

    @Test
    void missedCallSummaryCountsEachNumberOnlyOnTheRequestedDevice() {
        jdbc.execute("""
                CREATE TABLE missed_call (
                    id BIGINT PRIMARY KEY, device_id BIGINT, phone_number VARCHAR(20), call_time TIMESTAMP
                )
                """);
        try {
            jdbc.update("""
                    INSERT INTO missed_call VALUES
                    (1,1,'10001','2026-11-21 12:00:00'),
                    (2,1,'10001','2026-11-21 14:00:00'),
                    (3,1,'10002','2026-11-21 13:00:00'),
                    (4,2,'10001','2026-11-21 15:00:00')
                    """);
            var summaries = missedCalls.findSummaries(1L);
            assertEquals(2, summaries.size());
            assertEquals("10001", summaries.get(0).getPhone());
            assertEquals(2L, summaries.get(0).getCount());
            assertEquals("10002", summaries.get(1).getPhone());
        } finally {
            jdbc.execute("DROP TABLE missed_call");
        }
    }

    @Test
    void emailAndPasswordUpdatesPreserveEachOthersFields() {
        jdbc.execute("""
                CREATE TABLE users (
                    id BIGINT PRIMARY KEY, username VARCHAR(50), email VARCHAR(255) UNIQUE,
                    password_hash VARCHAR(100), created_at TIMESTAMP
                )
                """);
        try {
            String original = passwords.encode("starting-test-password");
            jdbc.update("INSERT INTO users (id,username,email,password_hash) VALUES (?,?,?,?)",
                    1, "first", "first@example.invalid", original);
            jdbc.update("INSERT INTO users (id,username,email,password_hash) VALUES (?,?,?,?)",
                    2, "second", "second@example.invalid", original);

            auth.updateProfile(1L, "updated@example.invalid");
            assertEquals(original, jdbc.queryForObject("SELECT password_hash FROM users WHERE id=1", String.class));
            var duplicate = assertThrows(IllegalArgumentException.class, () -> auth.updateProfile(1L, "second@example.invalid"));
            assertEquals("Email already exists", duplicate.getMessage());
            auth.changePassword(1L, "starting-test-password", "replacement-test-password");
            assertEquals("updated@example.invalid", jdbc.queryForObject("SELECT email FROM users WHERE id=1", String.class));
            assertTrue(passwords.matches("replacement-test-password",
                    jdbc.queryForObject("SELECT password_hash FROM users WHERE id=1", String.class)));
            assertThrows(IllegalArgumentException.class,
                    () -> auth.changePassword(1L, "starting-test-password", "another-test-password"));
        } finally {
            jdbc.execute("DROP TABLE users");
        }
    }

    @Test
    void transferPreservesDeviceIdentityAndBlocksEditsByThePreviousOwner() {
        jdbc.execute("CREATE TABLE users (id BIGINT PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), password_hash VARCHAR(100), created_at TIMESTAMP)");
        createDeviceTable();
        try {
            jdbc.update("INSERT INTO users (id,username) VALUES (1,'owner'),(2,'recipient')");
            jdbc.update("INSERT INTO devices (id,user_id,alias,webhook_token,current_sim_id,sms_protocol) VALUES (1,1,'old','tokenfixture0001','sim-fixture',2)");
            var edit = new UpdateDeviceRequest();
            edit.setAlias("  renamed  ");
            devices.updateDevice(1L, 1L, edit);
            devices.transferDevice(1L, 1L, "recipient");
            assertThrows(RuntimeException.class, () -> devices.updateDevice(1L, 1L, edit));
            var transferred = devices.getDevice(1L, 2L);
            assertEquals("renamed", transferred.getAlias());
            assertEquals("tokenfixture0001", transferred.getWebhookToken());
            assertEquals("sim-fixture", transferred.getCurrentSimId());
            assertEquals(2, transferred.getSmsProtocol());
        } finally {
            jdbc.execute("DROP TABLE devices");
            jdbc.execute("DROP TABLE users");
        }
    }

    @Test
    void lineSummariesKeepCurrentNumberFirstAndRecoverLinesKnownOnlyByMessages() {
        createDeviceTable();
        jdbc.execute("""
                CREATE TABLE sms_message (
                    id BIGINT PRIMARY KEY, device_id BIGINT, receiver_phone VARCHAR(20),
                    phone_number VARCHAR(20), content VARCHAR(200), direction VARCHAR(12),
                    created_at TIMESTAMP, read_at TIMESTAMP
                )
                """);
        jdbc.execute("""
                CREATE TABLE sim_change_log (
                    id BIGINT PRIMARY KEY, device_id BIGINT, old_phone_number VARCHAR(20),
                    new_phone_number VARCHAR(20), changed_at TIMESTAMP
                )
                """);
        try {
            jdbc.update("INSERT INTO devices (id,user_id,current_phone_number) VALUES (1,10,'+10000')");
            jdbc.update("INSERT INTO sim_change_log VALUES (1,1,'10005','+10000','2026-11-21 15:00:00')");
            jdbc.update("""
                    INSERT INTO sms_message VALUES
                    (1,1,'10002','10001','received offline','received','2026-11-21 13:00:00',NULL),
                    (2,1,NULL,'10001','unidentified SIM','received','2026-11-21 12:00:00',NULL),
                    (3,1,'','10001','older unidentified SIM','received','2026-11-21 11:00:00',NULL),
                    (4,2,'10009','10001','different device','received','2026-11-21 16:00:00',NULL)
                    """);
            var lines = sms.getLineSummaries(1L, 10L);
            assertEquals(List.of("+10000", "10002", "__unknown__", "10005"),
                    lines.stream().map(line -> line.getReceiverPhone()).toList());
            assertTrue(lines.get(0).isCurrentLine());
            assertEquals(0, lines.get(0).getUnreadCount());
            assertEquals("received offline", lines.get(1).getLastMessage());
            assertEquals(2, lines.get(2).getUnreadCount());
        } finally {
            jdbc.execute("DROP TABLE sim_change_log");
            jdbc.execute("DROP TABLE sms_message");
            jdbc.execute("DROP TABLE devices");
        }
    }

    private void createDeviceTable() {
        jdbc.execute("""
                CREATE TABLE devices (
                    id BIGINT PRIMARY KEY, user_id BIGINT, alias VARCHAR(100), webhook_token VARCHAR(16),
                    current_phone_number VARCHAR(20), current_sim_id VARCHAR(32), sms_protocol INT,
                    imei VARCHAR(20), signal_strength INT, last_heartbeat_at TIMESTAMP,
                    latitude DECIMAL(10,7), longitude DECIMAL(11,7), created_at TIMESTAMP
                )
                """);
    }

    @Test
    void dashboardCountsOnlyTheOwnersRecordsAndIncludesDevicesWithNoActivity() {
        createDeviceTable();
        jdbc.execute("CREATE TABLE sms_message (id BIGINT PRIMARY KEY, device_id BIGINT, direction VARCHAR(12), read_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE missed_call (id BIGINT PRIMARY KEY, device_id BIGINT, read_at TIMESTAMP)");
        try {
            jdbc.update("INSERT INTO devices (id,user_id,alias) VALUES (1,10,'first'),(2,10,'empty'),(3,20,'foreign')");
            jdbc.update("""
                    INSERT INTO sms_message VALUES
                    (1,1,'received',NULL), (2,1,'received','2026-11-21 12:00:00'),
                    (3,1,'sent',NULL), (4,1,'sent',NULL), (5,3,'received',NULL), (6,3,'sent',NULL)
                    """);
            jdbc.update("INSERT INTO missed_call VALUES (1,1,NULL),(2,1,'2026-11-21 12:00:00'),(3,3,NULL)");
            var stats = dashboard.getDashboardStats(10L);
            assertEquals(2, stats.getDevices().size());
            assertEquals(2, stats.getOfflineDevices());
            assertEquals(2, stats.getTotalSentMessages());
            assertEquals(1, stats.getTotalUnreadMessages());
            assertEquals(1, stats.getTotalUnreadCalls());
            assertEquals(0, stats.getDevices().stream().filter(device -> device.getId().equals(2L)).findFirst().orElseThrow().getUnreadMessages());
            assertTrue(dashboard.getDashboardStats(30L).getDevices().isEmpty());
        } finally {
            jdbc.execute("DROP TABLE missed_call");
            jdbc.execute("DROP TABLE sms_message");
            jdbc.execute("DROP TABLE devices");
        }
    }
}

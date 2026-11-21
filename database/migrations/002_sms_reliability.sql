USE sms_server;

ALTER TABLE devices
    ADD COLUMN current_sim_id VARCHAR(32) NULL,
    ADD COLUMN sms_protocol INT NOT NULL DEFAULT 0;

ALTER TABLE pending_sms
    MODIFY status ENUM('pending', 'sent', 'delivered', 'failed', 'dispatching', 'submitted', 'unknown', 'expired') DEFAULT 'pending',
    ADD COLUMN attempt_id CHAR(36) NULL,
    ADD COLUMN attempt_owner VARCHAR(64) NULL,
    ADD COLUMN attempt_offer_count INT NOT NULL DEFAULT 0,
    ADD COLUMN attempt_count INT NOT NULL DEFAULT 1,
    ADD COLUMN request_id CHAR(36) NULL,
    ADD COLUMN attempt_expires_at DATETIME(3) NULL,
    ADD COLUMN expected_sim VARCHAR(64) NULL,
    ADD INDEX idx_device_attempt (device_id, attempt_id),
    ADD UNIQUE KEY uk_device_sms_request (device_id, request_id),
    ADD INDEX idx_sms_deadline (status, attempt_expires_at);

ALTER TABLE sms_message
    MODIFY status ENUM('pending', 'sent', 'delivered', 'failed', 'dispatching', 'submitted', 'unknown', 'expired') DEFAULT 'pending',
    ADD COLUMN inbound_event_id VARCHAR(64) NULL,
    ADD UNIQUE KEY uk_sms_inbound_event (device_id, inbound_event_id);

ALTER TABLE missed_call
    ADD COLUMN inbound_event_id VARCHAR(64) NULL,
    ADD UNIQUE KEY uk_call_inbound_event (device_id, inbound_event_id);

-- Old 'sent' meant only that the server constructed a dispatch response.
UPDATE pending_sms SET status = 'unknown' WHERE status = 'sent';
UPDATE sms_message SET status = 'unknown' WHERE direction = 'sent' AND status = 'sent';

-- Old pending jobs have no bound SIM or device-side attempt identifier.
UPDATE pending_sms SET status = 'unknown' WHERE status = 'pending' AND attempt_id IS NULL;
UPDATE sms_message m JOIN pending_sms p ON m.pending_sms_id = p.id
SET m.status = p.status WHERE p.status = 'unknown' AND m.direction = 'sent';

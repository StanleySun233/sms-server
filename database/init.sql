-- SMS Server Database Schema
-- Version: 1.0
-- Description: Database schema for SMS management system

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sms_server DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sms_server;

-- =====================================================
-- Table: users
-- Description: User accounts with authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique username for login',
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt hashed password',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'User email address',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Account creation time',
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts';

-- =====================================================
-- Table: devices
-- Description: 4G terminal devices managed by users
-- =====================================================
CREATE TABLE IF NOT EXISTS devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'Owner user ID',
    alias VARCHAR(100) NOT NULL COMMENT 'Device nickname set by user',
    webhook_token CHAR(16) NOT NULL UNIQUE COMMENT 'Unique 16-char token for webhook authentication',
    current_phone_number VARCHAR(20) DEFAULT NULL COMMENT 'Current SIM card phone number',
    imei VARCHAR(20) DEFAULT NULL COMMENT 'Device IMEI number',
    last_heartbeat_at DATETIME(3) NULL DEFAULT NULL COMMENT 'Last webhook heartbeat time',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Device creation time',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_webhook_token (webhook_token),
    INDEX idx_last_heartbeat (last_heartbeat_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='4G devices';

-- =====================================================
-- Table: sms_message
-- Description: SMS messages sent and received
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL COMMENT 'Device that sent/received the message',
    receiver_phone VARCHAR(20) NULL COMMENT 'SIM number that received the message',
    phone_number VARCHAR(20) NOT NULL COMMENT 'Remote phone number',
    content TEXT NOT NULL COMMENT 'Message content',
    direction ENUM('sent', 'received') NOT NULL COMMENT 'Message direction',
    status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending' COMMENT 'Message status',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Message timestamp',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'Last update time',
    read_at DATETIME(3) NULL DEFAULT NULL COMMENT 'Time when marked as read',
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_phone (device_id, phone_number),
    INDEX idx_device_receiver (device_id, receiver_phone),
    INDEX idx_created_at (created_at),
    INDEX idx_read_at (read_at),
    INDEX idx_direction (direction),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SMS messages';

-- =====================================================
-- Table: missed_call
-- Description: Missed call records
-- =====================================================
CREATE TABLE IF NOT EXISTS missed_call (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL COMMENT 'Device that received the missed call',
    phone_number VARCHAR(20) NOT NULL COMMENT 'Caller phone number',
    call_time DATETIME(3) NOT NULL COMMENT 'Time of the missed call',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Record creation time',
    read_at DATETIME(3) NULL DEFAULT NULL COMMENT 'Time when marked as read',
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_phone (device_id, phone_number),
    INDEX idx_call_time (call_time),
    INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Missed calls';

-- =====================================================
-- Table: pending_sms
-- Description: Outgoing SMS messages queued for sending
-- =====================================================
CREATE TABLE IF NOT EXISTS pending_sms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL COMMENT 'Device to send the message',
    phone_number VARCHAR(20) NOT NULL COMMENT 'Recipient phone number',
    content TEXT NOT NULL COMMENT 'Message content',
    status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending' COMMENT 'Send status',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Time when message was queued',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'Last update time',
    sent_at DATETIME(3) NULL DEFAULT NULL COMMENT 'Time when message was sent',
    delivered_at DATETIME(3) NULL DEFAULT NULL COMMENT 'Time when message was delivered',
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_status (device_id, status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pending SMS tasks';

-- =====================================================
-- Table: sim_change_log
-- Description: SIM card change history
-- =====================================================
CREATE TABLE IF NOT EXISTS sim_change_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL COMMENT 'Device that had SIM card changed',
    old_phone_number VARCHAR(20) DEFAULT NULL COMMENT 'Previous phone number',
    new_phone_number VARCHAR(20) NOT NULL COMMENT 'New phone number',
    changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Time of SIM card change',
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_id (device_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SIM card change history';

-- =====================================================
-- Insert demo user (password: demo123)
-- BCrypt hash generated with strength 10
-- =====================================================
-- INSERT INTO users (username, password_hash, email) VALUES
-- ('demo', '$2a$10$XYZ...', 'demo@example.com');

-- =====================================================
-- Performance optimization recommendations:
-- 1. Monitor slow queries with slow_query_log
-- 2. Add composite indexes based on actual query patterns
-- 3. Consider partitioning sms_message by created_at for large datasets
-- 4. Regular ANALYZE TABLE to update statistics
-- =====================================================

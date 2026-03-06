package com.smsserver.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.smsserver.service.RedisService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class StartupHealthCheck {

    private static final Logger log = LoggerFactory.getLogger(StartupHealthCheck.class);
    private static final String JWT_KEY_PATTERN = "jwt:*";

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;
    private final RedisService redisService;

    public StartupHealthCheck(DataSource dataSource, RedisConnectionFactory redisConnectionFactory, RedisService redisService) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
        this.redisService = redisService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkConnections() {
        checkMysql();
        checkRedis();
        long deleted = redisService.deleteKeysByPattern(JWT_KEY_PATTERN);
        if (deleted > 0) {
            log.info("Cleared {} JWT key(s) from Redis on startup", deleted);
        }
    }

    private void checkMysql() {
        try (Connection conn = dataSource.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT 1 FROM devices LIMIT 1")) {
            log.info("MySQL health check OK: SELECT 1 FROM devices");
        } catch (Exception e) {
            log.error("MySQL health check failed: SELECT 1 FROM devices - {}", e.getMessage());
            throw new IllegalStateException("MySQL connection check failed", e);
        }
    }

    private void checkRedis() {
        try (RedisConnection conn = redisConnectionFactory.getConnection()) {
            conn.ping();
            log.info("Redis health check OK: PING");
        } catch (Exception e) {
            log.error("Redis health check failed: {}", e.getMessage());
            throw new IllegalStateException("Redis connection check failed", e);
        }
    }
}

package com.smsserver.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    public StartupHealthCheck(DataSource dataSource, RedisConnectionFactory redisConnectionFactory) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkConnections() {
        checkMysql();
        checkRedis();
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

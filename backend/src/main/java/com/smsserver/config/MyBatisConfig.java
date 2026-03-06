package com.smsserver.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus configuration
 */
@Configuration
@MapperScan("com.smsserver.mapper")
public class MyBatisConfig {
    // MyBatis-Plus 3.5.16 provides auto-configuration
    // Custom interceptors can be added here if needed
}

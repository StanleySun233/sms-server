package com.smsserver.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus configuration
 */
@Configuration
@MapperScan("com.smsserver.mapper")
public class MyBatisConfig {

    /**
     * MyBatis-Plus interceptor for pagination and other features
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // Add pagination interceptor
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);
        paginationInterceptor.setMaxLimit(1000L); // Maximum records per page
        paginationInterceptor.setOverflow(false); // Don't allow page overflow

        interceptor.addInnerInterceptor(paginationInterceptor);

        return interceptor;
    }
}

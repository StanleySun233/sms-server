# SMS Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based SMS management system for small teams to manage multiple 4G terminal devices with message tracking and device monitoring.

**Architecture:** Monolithic application with frontend-backend separation. Spring Boot backend (Java 18) + Next.js frontend (React), MySQL for persistence, Redis for session/cache/task queue, all containerized with Docker.

**Tech Stack:**
- Backend: Java 18, Spring Boot 3, MyBatis-Plus, Lombok, Spring Security, Spring Session, Lettuce (Redis client)
- Frontend: Next.js 14, React, Element Plus, Tailwind CSS
- Database: MySQL 8.0, Redis 7
- Deployment: Docker, Docker Compose, Nginx

---

## Phase 1: Project Scaffolding and Infrastructure

### Task 1: Initialize Project Structure

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-dev.yml`
- Create: `backend/src/main/resources/application-prod.yml`
- Create: `frontend/package.json`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Create project directories**

```bash
mkdir -p backend/src/main/java/com/smsserver
mkdir -p backend/src/main/resources
mkdir -p backend/src/test/java/com/smsserver
mkdir -p frontend/src/{app,components,lib,styles}
mkdir -p docker/{mysql,redis,nginx}
mkdir -p data/{mysql,redis}
mkdir -p logs
```

**Step 2: Create backend pom.xml**

Create `backend/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.smsserver</groupId>
    <artifactId>sms-server-backend</artifactId>
    <version>1.0.0</version>
    <name>SMS Server Backend</name>

    <properties>
        <java.version>18</java.version>
        <mybatis-plus.version>3.5.5</mybatis-plus.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- Spring Session Redis -->
        <dependency>
            <groupId>org.springframework.session</groupId>
            <artifactId>spring-session-data-redis</artifactId>
        </dependency>

        <!-- Spring Boot Data Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- Spring Boot Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Spring Boot Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- MySQL Driver -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- MyBatis Plus -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- SpringDoc OpenAPI (Swagger) -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>

        <!-- Apache POI for Excel export -->
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi</artifactId>
            <version>5.2.5</version>
        </dependency>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>5.2.5</version>
        </dependency>

        <!-- BCrypt for password encryption -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>

        <!-- Jackson for JSON -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**Step 3: Create application configuration files**

Create `backend/src/main/resources/application.yml`:

```yaml
spring:
  profiles:
    active: dev
  application:
    name: sms-server

springdoc:
  api-docs:
    path: /api/apidoc/swagger.json
  swagger-ui:
    path: /api/apidoc
```

Create `backend/src/main/resources/application-dev.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/sms_server?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
    username: sms_user
    password: dev_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  redis:
    host: localhost
    port: 6379
    password: dev_password
    database: 0
    timeout: 5000
    lettuce:
      pool:
        max-active: 20
        max-wait: -1
        max-idle: 10
        min-idle: 5

  session:
    store-type: redis
    timeout: 7d
    redis:
      namespace: sms:session

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

logging:
  level:
    com.smsserver: DEBUG
    org.springframework.security: DEBUG
  file:
    name: logs/sms-server.log
```

Create `backend/src/main/resources/application-prod.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://mysql:3306/sms_server?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

  redis:
    host: redis
    port: 6379
    password: ${REDIS_PASSWORD}
    database: 0
    timeout: 5000
    lettuce:
      pool:
        max-active: 20
        max-wait: -1
        max-idle: 10
        min-idle: 5

  session:
    store-type: redis
    timeout: 7d
    redis:
      namespace: sms:session

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto

logging:
  level:
    com.smsserver: INFO
  file:
    name: logs/sms-server.log
```

**Step 4: Create frontend package.json**

Create `frontend/package.json`:

```json
{
  "name": "sms-server-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4",
    "element-plus": "^2.4.4",
    "axios": "^1.6.2",
    "@element-plus/icons-vue": "^2.3.1",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

**Step 5: Create .gitignore**

Create `.gitignore`:

```
# Java
*.class
*.jar
*.war
*.ear
target/
.mvn/
mvnw
mvnw.cmd

# IDE
.idea/
*.iml
.vscode/
.DS_Store

# Node
node_modules/
.next/
out/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.production

# Docker
data/mysql/*
data/redis/*
logs/*

# Keep directories
!data/mysql/.gitkeep
!data/redis/.gitkeep
!logs/.gitkeep
```

**Step 6: Create README.md**

Create `README.md`:

```markdown
# SMS Server

Web-based SMS management system for managing multiple 4G terminal devices.

## Tech Stack

- Backend: Java 18, Spring Boot 3, MyBatis-Plus
- Frontend: Next.js 14, React, Element Plus
- Database: MySQL 8.0, Redis 7
- Deployment: Docker, Docker Compose

## Quick Start

### Development

1. Start MySQL and Redis:
   \`\`\`bash
   docker-compose up -d mysql redis
   \`\`\`

2. Run backend:
   \`\`\`bash
   cd backend
   mvn spring-boot:run
   \`\`\`

3. Run frontend:
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   \`\`\`

### Production

\`\`\`bash
docker-compose up -d
\`\`\`

## Documentation

- Design Doc: `docs/plans/2026-03-06-sms-server-design.md`
- API Doc: http://localhost:8080/api/apidoc
```

**Step 7: Create placeholder files for data directories**

```bash
touch data/mysql/.gitkeep
touch data/redis/.gitkeep
touch logs/.gitkeep
```

**Step 8: Initialize git repository**

```bash
cd d:/code/sms-server
git init
git add .
git commit -m "chore: initialize project structure"
```

Expected: Project structure created with all configuration files

---

### Task 2: Create Database Schema

**Files:**
- Create: `docker/mysql/init.sql`

**Step 1: Create MySQL initialization script**

Create `docker/mysql/init.sql`:

```sql
-- SMS Server Database Schema
-- Character set: utf8mb4 for emoji support

CREATE DATABASE IF NOT EXISTS sms_server CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sms_server;

-- User table
CREATE TABLE `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(BCrypt)',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- Device table
CREATE TABLE `device` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `webhook_token` VARCHAR(16) NOT NULL COMMENT 'Webhook令牌',
  `alias` VARCHAR(100) NOT NULL COMMENT '设备别名',
  `current_phone_number` VARCHAR(20) DEFAULT NULL COMMENT '当前手机号',
  `current_carrier` VARCHAR(50) DEFAULT NULL COMMENT '当前运营商',
  `signal_strength` INT DEFAULT NULL COMMENT '信号强度(0-100)',
  `last_heartbeat_at` BIGINT DEFAULT NULL COMMENT '最后心跳时间(Unix时间戳)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_webhook_token` (`webhook_token`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- Device phone history table
CREATE TABLE `device_phone_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_id` BIGINT NOT NULL COMMENT '设备ID',
  `phone_number` VARCHAR(20) NOT NULL COMMENT '手机号',
  `carrier` VARCHAR(50) DEFAULT NULL COMMENT '运营商',
  `first_seen_at` BIGINT NOT NULL COMMENT '首次使用时间',
  `last_seen_at` BIGINT NOT NULL COMMENT '最后使用时间',
  `is_current` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否当前使用',
  UNIQUE KEY `uk_device_phone` (`device_id`, `phone_number`),
  KEY `idx_device_current` (`device_id`, `is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备手机号历史表';

-- SMS message table
CREATE TABLE `sms_message` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_id` BIGINT NOT NULL COMMENT '设备ID',
  `phone_number` VARCHAR(20) NOT NULL COMMENT '对方号码',
  `content` TEXT NOT NULL COMMENT '短信内容',
  `direction` ENUM('received', 'sent') NOT NULL COMMENT '收发方向',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '已读状态',
  `timestamp` BIGINT NOT NULL COMMENT '短信时间戳',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
  KEY `idx_device_phone_time` (`device_id`, `phone_number`, `timestamp`),
  KEY `idx_device_read` (`device_id`, `is_read`),
  FULLTEXT KEY `idx_content_fulltext` (`content`) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信记录表';

-- Missed call table
CREATE TABLE `missed_call` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_id` BIGINT NOT NULL COMMENT '设备ID',
  `phone_number` VARCHAR(20) NOT NULL COMMENT '来电号码',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '已读状态',
  `timestamp` BIGINT NOT NULL COMMENT '来电时间戳',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
  KEY `idx_device_phone_time` (`device_id`, `phone_number`, `timestamp`),
  KEY `idx_device_read` (`device_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='未接来电表';

-- Pending SMS table
CREATE TABLE `pending_sms` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_id` BIGINT NOT NULL COMMENT '设备ID',
  `phone_number` VARCHAR(20) NOT NULL COMMENT '收信人号码',
  `content` TEXT NOT NULL COMMENT '短信内容',
  `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending' COMMENT '发送状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `sent_at` DATETIME DEFAULT NULL COMMENT '发送时间',
  KEY `idx_device_status` (`device_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待发送短信表';
```

**Step 2: Commit database schema**

```bash
git add docker/mysql/init.sql
git commit -m "feat: add database schema initialization script"
```

Expected: Database schema file created with all 6 tables

---

### Task 3: Setup Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `docker/nginx/nginx.conf`

**Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: sms-server-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: sms_server
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - ./data/mysql:/var/lib/mysql
      - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - sms-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sms-server-redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    networks:
      - sms-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sms-server-backend
    environment:
      SPRING_PROFILES_ACTIVE: prod
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    ports:
      - "8080:8080"
    volumes:
      - ./logs:/app/logs
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sms-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sms-server-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - sms-network

  nginx:
    image: nginx:alpine
    container_name: sms-server-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    networks:
      - sms-network

networks:
  sms-network:
    driver: bridge
```

**Step 2: Create .env.example**

Create `.env.example`:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your_root_password_here
MYSQL_DATABASE=sms_server
MYSQL_USER=sms_user
MYSQL_PASSWORD=your_mysql_password_here

# Redis Configuration
REDIS_PASSWORD=your_redis_password_here

# Application Configuration
SPRING_PROFILES_ACTIVE=prod
NEXT_PUBLIC_API_URL=https://sms.sjsun.top/api
```

**Step 3: Create Nginx configuration**

Create `docker/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8080;
    }

    server {
        listen 80;
        server_name sms.sjsun.top;

        client_max_body_size 20M;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API routes
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
```

**Step 4: Create backend Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
FROM maven:3.9-eclipse-temurin-18 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:18-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Step 5: Create frontend Dockerfile**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

**Step 6: Commit Docker configuration**

```bash
git add docker-compose.yml .env.example docker/ backend/Dockerfile frontend/Dockerfile
git commit -m "feat: add Docker Compose and deployment configuration"
```

Expected: Docker setup complete with all service definitions

---

## Phase 2: Backend Core Implementation

### Task 4: Create Domain Entities

**Files:**
- Create: `backend/src/main/java/com/smsserver/entity/User.java`
- Create: `backend/src/main/java/com/smsserver/entity/Device.java`
- Create: `backend/src/main/java/com/smsserver/entity/DevicePhoneHistory.java`
- Create: `backend/src/main/java/com/smsserver/entity/SmsMessage.java`
- Create: `backend/src/main/java/com/smsserver/entity/MissedCall.java`
- Create: `backend/src/main/java/com/smsserver/entity/PendingSms.java`

**Step 1: Create User entity**

Create `backend/src/main/java/com/smsserver/entity/User.java`:

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String email;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

**Step 2: Create Device entity**

Create `backend/src/main/java/com/smsserver/entity/Device.java`:

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("device")
public class Device {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String webhookToken;

    private String alias;

    private String currentPhoneNumber;

    private String currentCarrier;

    private Integer signalStrength;

    private Long lastHeartbeatAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // Computed field, not in database
    @TableField(exist = false)
    private String status;

    @TableField(exist = false)
    private Integer phoneHistoryCount;
}
```

**Step 3: Create DevicePhoneHistory entity**

Create `backend/src/main/java/com/smsserver/entity/DevicePhoneHistory.java`:

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("device_phone_history")
public class DevicePhoneHistory {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;

    private String phoneNumber;

    private String carrier;

    private Long firstSeenAt;

    private Long lastSeenAt;

    private Boolean isCurrent;
}
```

**Step 4: Create SmsMessage entity**

Create `backend/src/main/java/com/smsserver/entity/SmsMessage.java`:

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sms_message")
public class SmsMessage {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;

    private String phoneNumber;

    private String content;

    private String direction; // received, sent

    private Boolean isRead;

    private Long timestamp;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

**Step 5: Create MissedCall entity**

Create `backend/src/main/java/com/smsserver/entity/MissedCall.java`:

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("missed_call")
public class MissedCall {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;

    private String phoneNumber;

    private Boolean isRead;

    private Long timestamp;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

**Step 6: Create PendingSms entity**

Create `backend/src/main/java/com/smsserver/entity/PendingSms.java`:

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pending_sms")
public class PendingSms {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;

    private String phoneNumber;

    private String content;

    private String status; // pending, sent, failed

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    private LocalDateTime sentAt;
}
```

**Step 7: Create MyBatisPlus field fill handler**

Create `backend/src/main/java/com/smsserver/config/MyBatisPlusConfig.java`:

```java
package com.smsserver.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Configuration;
import java.time.LocalDateTime;

@Configuration
public class MyBatisPlusConfig implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }
}
```

**Step 8: Commit entities**

```bash
git add backend/src/main/java/com/smsserver/entity/
git add backend/src/main/java/com/smsserver/config/MyBatisPlusConfig.java
git commit -m "feat: add domain entities and MyBatis-Plus configuration"
```

Expected: All 6 entity classes created with Lombok annotations

---

### Task 5: Create Mappers (MyBatis-Plus)

**Files:**
- Create: `backend/src/main/java/com/smsserver/mapper/UserMapper.java`
- Create: `backend/src/main/java/com/smsserver/mapper/DeviceMapper.java`
- Create: `backend/src/main/java/com/smsserver/mapper/DevicePhoneHistoryMapper.java`
- Create: `backend/src/main/java/com/smsserver/mapper/SmsMessageMapper.java`
- Create: `backend/src/main/java/com/smsserver/mapper/MissedCallMapper.java`
- Create: `backend/src/main/java/com/smsserver/mapper/PendingSmsMapper.java`
- Modify: `backend/src/main/java/com/smsserver/SmsServerApplication.java`

**Step 1: Create UserMapper**

Create `backend/src/main/java/com/smsserver/mapper/UserMapper.java`:

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

**Step 2: Create DeviceMapper**

Create `backend/src/main/java/com/smsserver/mapper/DeviceMapper.java`:

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.Device;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DeviceMapper extends BaseMapper<Device> {
}
```

**Step 3: Create DevicePhoneHistoryMapper**

Create `backend/src/main/java/com/smsserver/mapper/DevicePhoneHistoryMapper.java`:

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.DevicePhoneHistory;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DevicePhoneHistoryMapper extends BaseMapper<DevicePhoneHistory> {
}
```

**Step 4: Create SmsMessageMapper**

Create `backend/src/main/java/com/smsserver/mapper/SmsMessageMapper.java`:

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.SmsMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SmsMessageMapper extends BaseMapper<SmsMessage> {
}
```

**Step 5: Create MissedCallMapper**

Create `backend/src/main/java/com/smsserver/mapper/MissedCallMapper.java`:

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.MissedCall;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MissedCallMapper extends BaseMapper<MissedCall> {
}
```

**Step 6: Create PendingSmsMapper**

Create `backend/src/main/java/com/smsserver/mapper/PendingSmsMapper.java`:

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.PendingSms;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PendingSmsMapper extends BaseMapper<PendingSms> {
}
```

**Step 7: Create Spring Boot main application**

Create `backend/src/main/java/com/smsserver/SmsServerApplication.java`:

```java
package com.smsserver;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.smsserver.mapper")
public class SmsServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmsServerApplication.java, args);
    }
}
```

**Step 8: Commit mappers**

```bash
git add backend/src/main/java/com/smsserver/mapper/
git add backend/src/main/java/com/smsserver/SmsServerApplication.java
git commit -m "feat: add MyBatis-Plus mappers and main application class"
```

Expected: All 6 mappers created extending BaseMapper

---

### Task 6: Create DTOs and Common Response

**Files:**
- Create: `backend/src/main/java/com/smsserver/dto/`
- Create: `backend/src/main/java/com/smsserver/common/Result.java`

**Step 1: Create common Result wrapper**

Create `backend/src/main/java/com/smsserver/common/Result.java`:

```java
package com.smsserver.common;

import lombok.Data;

@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(String message) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMessage(message);
        return result;
    }

    public static <T> Result<T> error(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
}
```

**Step 2: Create auth DTOs**

Create `backend/src/main/java/com/smsserver/dto/auth/RegisterRequest.java`:

```java
package com.smsserver.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度3-50")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度6-100")
    private String password;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}
```

Create `backend/src/main/java/com/smsserver/dto/auth/LoginRequest.java`:

```java
package com.smsserver.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}
```

Create `backend/src/main/java/com/smsserver/dto/auth/UserInfoResponse.java`:

```java
package com.smsserver.dto.auth;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserInfoResponse {
    private Long id;
    private String username;
    private String email;
    private LocalDateTime createdAt;
}
```

**Step 3: Create device DTOs**

Create `backend/src/main/java/com/smsserver/dto/device/CreateDeviceRequest.java`:

```java
package com.smsserver.dto.device;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateDeviceRequest {
    @NotBlank(message = "设备别名不能为空")
    @Size(max = 100, message = "别名长度不超过100")
    private String alias;
}
```

Create `backend/src/main/java/com/smsserver/dto/device/UpdateDeviceRequest.java`:

```java
package com.smsserver.dto.device;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDeviceRequest {
    @NotBlank(message = "设备别名不能为空")
    @Size(max = 100, message = "别名长度不超过100")
    private String alias;
}
```

Create `backend/src/main/java/com/smsserver/dto/device/DeviceResponse.java`:

```java
package com.smsserver.dto.device;

import lombok.Data;

@Data
public class DeviceResponse {
    private Long id;
    private String alias;
    private String webhookUrl;
    private String currentPhone;
    private String carrier;
    private Integer signalStrength;
    private String status;
    private Long lastHeartbeatAt;
    private Integer phoneHistoryCount;
}
```

**Step 4: Create webhook DTOs**

Create `backend/src/main/java/com/smsserver/dto/webhook/HeartbeatRequest.java`:

```java
package com.smsserver.dto.webhook;

import lombok.Data;
import java.util.List;

@Data
public class HeartbeatRequest {
    private DeviceInfo deviceInfo;
    private List<NewMessage> newMessages;
    private List<MissedCallItem> missedCalls;

    @Data
    public static class DeviceInfo {
        private Integer signalStrength;
        private String phoneNumber;
        private String carrier;
    }

    @Data
    public static class NewMessage {
        private String phoneNumber;
        private String content;
        private String direction;
        private Long timestamp;
    }

    @Data
    public static class MissedCallItem {
        private String phoneNumber;
        private Long timestamp;
    }
}
```

Create `backend/src/main/java/com/smsserver/dto/webhook/HeartbeatResponse.java`:

```java
package com.smsserver.dto.webhook;

import lombok.Data;
import java.util.List;

@Data
public class HeartbeatResponse {
    private List<Command> commands;

    @Data
    public static class Command {
        private String type;
        private String phoneNumber;
        private String content;
    }
}
```

**Step 5: Create message DTOs**

Create `backend/src/main/java/com/smsserver/dto/message/SendSmsRequest.java`:

```java
package com.smsserver.dto.message;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendSmsRequest {
    @NotBlank(message = "手机号不能为空")
    private String phoneNumber;

    @NotBlank(message = "短信内容不能为空")
    private String content;
}
```

Create `backend/src/main/java/com/smsserver/dto/message/ConversationResponse.java`:

```java
package com.smsserver.dto.message;

import lombok.Data;

@Data
public class ConversationResponse {
    private String phoneNumber;
    private String lastMessage;
    private Long lastTimestamp;
    private Integer unreadCount;
    private Integer totalCount;
}
```

Create `backend/src/main/java/com/smsserver/dto/message/MessageResponse.java`:

```java
package com.smsserver.dto.message;

import lombok.Data;

@Data
public class MessageResponse {
    private Long id;
    private String phoneNumber;
    private String content;
    private String direction;
    private Boolean isRead;
    private Long timestamp;
}
```

**Step 6: Commit DTOs**

```bash
git add backend/src/main/java/com/smsserver/dto/
git add backend/src/main/java/com/smsserver/common/
git commit -m "feat: add DTOs and common response wrapper"
```

Expected: All DTOs created with validation annotations

---

---

## Phase 3: Service Layer Implementation

### Task 7: Create Redis Service

**Files:**
- Create: `backend/src/main/java/com/smsserver/service/RedisService.java`

**Step 1: Create RedisService interface and implementation**

Create `backend/src/main/java/com/smsserver/service/RedisService.java`:

```java
package com.smsserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // Session操作
    public void setSession(String sessionId, Object value, long seconds) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set("session:" + sessionId, json, seconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new RuntimeException("Redis set session failed", e);
        }
    }

    public <T> T getSession(String sessionId, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get("session:" + sessionId);
            if (json == null) return null;
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Redis get session failed", e);
        }
    }

    public void deleteSession(String sessionId) {
        redisTemplate.delete("session:" + sessionId);
    }

    // 设备状态缓存
    public void setDeviceStatus(Long deviceId, Object value, long seconds) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set("device:status:" + deviceId, json, seconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new RuntimeException("Redis set device status failed", e);
        }
    }

    public <T> T getDeviceStatus(Long deviceId, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get("device:status:" + deviceId);
            if (json == null) return null;
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Redis get device status failed", e);
        }
    }

    // 未读消息计数
    public void incrementUnreadCount(Long deviceId) {
        redisTemplate.opsForValue().increment("device:unread:" + deviceId);
        redisTemplate.expire("device:unread:" + deviceId, 300, TimeUnit.SECONDS);
    }

    public void deleteUnreadCount(Long deviceId) {
        redisTemplate.delete("device:unread:" + deviceId);
    }

    public Long getUnreadCount(Long deviceId) {
        String value = redisTemplate.opsForValue().get("device:unread:" + deviceId);
        return value == null ? 0L : Long.parseLong(value);
    }

    // 待发送短信任务队列
    public void pushSmsTask(Long deviceId, Object task) {
        try {
            String json = objectMapper.writeValueAsString(task);
            redisTemplate.opsForList().leftPush("task:sms:" + deviceId, json);
        } catch (Exception e) {
            throw new RuntimeException("Redis push sms task failed", e);
        }
    }

    public <T> List<T> popAllSmsTasks(Long deviceId, Class<T> clazz) {
        try {
            String key = "task:sms:" + deviceId;
            List<String> jsonList = redisTemplate.opsForList().range(key, 0, -1);
            redisTemplate.delete(key);

            List<T> result = new ArrayList<>();
            if (jsonList != null) {
                for (String json : jsonList) {
                    result.add(objectMapper.readValue(json, clazz));
                }
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Redis pop sms tasks failed", e);
        }
    }

    // 通用缓存操作
    public void set(String key, Object value, long seconds) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, seconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new RuntimeException("Redis set failed", e);
        }
    }

    public <T> T get(String key, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) return null;
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Redis get failed", e);
        }
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }
}
```

**Step 2: Commit RedisService**

```bash
git add backend/src/main/java/com/smsserver/service/RedisService.java
git commit -m "feat: add Redis service for session, cache and task queue"
```

Expected: RedisService created with all cache operations

---

### Task 8: Create User Service

**Files:**
- Create: `backend/src/main/java/com/smsserver/service/UserService.java`
- Create: `backend/src/main/java/com/smsserver/util/TokenGenerator.java`

**Step 1: Create TokenGenerator utility**

Create `backend/src/main/java/com/smsserver/util/TokenGenerator.java`:

```java
package com.smsserver.util;

import java.security.SecureRandom;

public class TokenGenerator {
    private static final String CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generate(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    public static String generateWebhookToken() {
        return generate(16);
    }
}
```

**Step 2: Create UserService**

Create `backend/src/main/java/com/smsserver/service/UserService.java`:

```java
package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.auth.LoginRequest;
import com.smsserver.dto.auth.RegisterRequest;
import com.smsserver.dto.auth.UserInfoResponse;
import com.smsserver.entity.User;
import com.smsserver.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;

    public User register(RegisterRequest request) {
        // 检查用户名是否存在
        User existingUser = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername())
        );
        if (existingUser != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查邮箱是否存在
        User existingEmail = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getEmail, request.getEmail())
        );
        if (existingEmail != null) {
            throw new RuntimeException("邮箱已被使用");
        }

        // 创建用户（密码暂时明文存储，后续加密）
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword()); // TODO: BCrypt加密
        user.setEmail(request.getEmail());

        userMapper.insert(user);
        return user;
    }

    public User login(LoginRequest request) {
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername())
        );

        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 验证密码（暂时明文比对）
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        return user;
    }

    public UserInfoResponse getUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        UserInfoResponse response = new UserInfoResponse();
        BeanUtils.copyProperties(user, response);
        return response;
    }

    public User findById(Long userId) {
        return userMapper.selectById(userId);
    }
}
```

**Step 3: Commit UserService**

```bash
git add backend/src/main/java/com/smsserver/service/UserService.java
git add backend/src/main/java/com/smsserver/util/TokenGenerator.java
git commit -m "feat: add User service for registration and login"
```

Expected: UserService created with basic auth logic (no encryption yet)

---

### Task 9: Create Device Service

**Files:**
- Create: `backend/src/main/java/com/smsserver/service/DeviceService.java`

**Step 1: Create DeviceService**

Create `backend/src/main/java/com/smsserver/service/DeviceService.java`:

```java
package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.device.CreateDeviceRequest;
import com.smsserver.dto.device.DeviceResponse;
import com.smsserver.dto.device.UpdateDeviceRequest;
import com.smsserver.entity.Device;
import com.smsserver.entity.DevicePhoneHistory;
import com.smsserver.entity.MissedCall;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.*;
import com.smsserver.util.TokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviceService {
    private final DeviceMapper deviceMapper;
    private final DevicePhoneHistoryMapper phoneHistoryMapper;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final PendingSmsMapper pendingSmsMapper;
    private final RedisService redisService;

    public DeviceResponse createDevice(Long userId, CreateDeviceRequest request) {
        Device device = new Device();
        device.setUserId(userId);
        device.setAlias(request.getAlias());
        device.setWebhookToken(TokenGenerator.generateWebhookToken());

        deviceMapper.insert(device);

        return convertToResponse(device);
    }

    public List<DeviceResponse> getUserDevices(Long userId) {
        List<Device> devices = deviceMapper.selectList(
            new LambdaQueryWrapper<Device>().eq(Device::getUserId, userId)
        );

        return devices.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    public DeviceResponse getDevice(Long deviceId, Long userId) {
        Device device = deviceMapper.selectById(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new RuntimeException("设备不存在或无权限访问");
        }

        return convertToResponse(device);
    }

    public DeviceResponse updateDevice(Long deviceId, Long userId, UpdateDeviceRequest request) {
        Device device = deviceMapper.selectById(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new RuntimeException("设备不存在或无权限访问");
        }

        device.setAlias(request.getAlias());
        deviceMapper.updateById(device);

        // 清除缓存
        redisService.delete("device:status:" + deviceId);

        return convertToResponse(device);
    }

    @Transactional
    public void deleteDevice(Long deviceId, Long userId) {
        Device device = deviceMapper.selectById(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new RuntimeException("设备不存在或无权限访问");
        }

        // 删除关联数据（手动级联）
        smsMessageMapper.delete(
            new LambdaQueryWrapper<SmsMessage>().eq(SmsMessage::getDeviceId, deviceId)
        );
        missedCallMapper.delete(
            new LambdaQueryWrapper<MissedCall>().eq(MissedCall::getDeviceId, deviceId)
        );
        phoneHistoryMapper.delete(
            new LambdaQueryWrapper<DevicePhoneHistory>().eq(DevicePhoneHistory::getDeviceId, deviceId)
        );
        pendingSmsMapper.delete(
            new LambdaQueryWrapper<PendingSms>().eq(PendingSms::getDeviceId, deviceId)
        );

        // 删除设备
        deviceMapper.deleteById(deviceId);

        // 清除Redis缓存
        redisService.delete("device:status:" + deviceId);
        redisService.delete("device:unread:" + deviceId);
        redisService.delete("task:sms:" + deviceId);
    }

    public List<DevicePhoneHistory> getPhoneHistory(Long deviceId, Long userId) {
        Device device = deviceMapper.selectById(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new RuntimeException("设备不存在或无权限访问");
        }

        return phoneHistoryMapper.selectList(
            new LambdaQueryWrapper<DevicePhoneHistory>()
                .eq(DevicePhoneHistory::getDeviceId, deviceId)
                .orderByDesc(DevicePhoneHistory::getLastSeenAt)
        );
    }

    public Device findByWebhookToken(String token) {
        return deviceMapper.selectOne(
            new LambdaQueryWrapper<Device>().eq(Device::getWebhookToken, token)
        );
    }

    private DeviceResponse convertToResponse(Device device) {
        DeviceResponse response = new DeviceResponse();
        BeanUtils.copyProperties(device, response);

        response.setWebhookUrl("https://sms.sjsun.top/api/webhook/" + device.getWebhookToken());
        response.setCurrentPhone(device.getCurrentPhoneNumber());
        response.setCarrier(device.getCurrentCarrier());

        // 计算设备状态
        if (device.getLastHeartbeatAt() != null) {
            long now = System.currentTimeMillis() / 1000;
            long diff = now - device.getLastHeartbeatAt();
            if (diff <= 180) { // 3分钟
                response.setStatus("online");
            } else if (diff <= 300) { // 5分钟
                response.setStatus("warning");
            } else {
                response.setStatus("offline");
            }
        } else {
            response.setStatus("offline");
        }

        // 统计手机号历史数量
        Integer count = phoneHistoryMapper.selectCount(
            new LambdaQueryWrapper<DevicePhoneHistory>()
                .eq(DevicePhoneHistory::getDeviceId, device.getId())
        );
        response.setPhoneHistoryCount(count);

        return response;
    }
}
```

**Step 2: Commit DeviceService**

```bash
git add backend/src/main/java/com/smsserver/service/DeviceService.java
git commit -m "feat: add Device service with CRUD and phone history"
```

Expected: DeviceService created with all device management logic

---

### Task 10: Create Webhook Service

**Files:**
- Create: `backend/src/main/java/com/smsserver/service/WebhookService.java`

**Step 1: Create WebhookService**

Create `backend/src/main/java/com/smsserver/service/WebhookService.java`:

```java
package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.smsserver.dto.webhook.HeartbeatRequest;
import com.smsserver.dto.webhook.HeartbeatResponse;
import com.smsserver.entity.*;
import com.smsserver.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {
    private final DeviceMapper deviceMapper;
    private final DevicePhoneHistoryMapper phoneHistoryMapper;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final PendingSmsMapper pendingSmsMapper;
    private final RedisService redisService;

    @Transactional
    public HeartbeatResponse processHeartbeat(String token, HeartbeatRequest request) {
        // 1. 验证token并获取设备
        Device device = findDeviceByToken(token);
        if (device == null) {
            throw new RuntimeException("Invalid webhook token");
        }

        // 2. 更新设备信息
        updateDeviceInfo(device, request.getDeviceInfo());

        // 3. 检测换卡
        checkAndUpdatePhoneHistory(device, request.getDeviceInfo());

        // 4. 保存新消息
        if (request.getNewMessages() != null && !request.getNewMessages().isEmpty()) {
            saveNewMessages(device.getId(), request.getNewMessages());
        }

        // 5. 保存未接来电
        if (request.getMissedCalls() != null && !request.getMissedCalls().isEmpty()) {
            saveMissedCalls(device.getId(), request.getMissedCalls());
        }

        // 6. 拉取待发送任务
        List<PendingSms> tasks = popSmsTasks(device.getId());

        // 7. 构造响应
        return buildResponse(tasks);
    }

    private Device findDeviceByToken(String token) {
        return deviceMapper.selectOne(
            new LambdaQueryWrapper<Device>().eq(Device::getWebhookToken, token)
        );
    }

    private void updateDeviceInfo(Device device, HeartbeatRequest.DeviceInfo deviceInfo) {
        long now = System.currentTimeMillis() / 1000;

        device.setCurrentPhoneNumber(deviceInfo.getPhoneNumber());
        device.setCurrentCarrier(deviceInfo.getCarrier());
        device.setSignalStrength(deviceInfo.getSignalStrength());
        device.setLastHeartbeatAt(now);

        deviceMapper.updateById(device);

        // 更新Redis缓存
        redisService.setDeviceStatus(device.getId(), device, 600);
    }

    private void checkAndUpdatePhoneHistory(Device device, HeartbeatRequest.DeviceInfo deviceInfo) {
        String newPhone = deviceInfo.getPhoneNumber();
        String oldPhone = device.getCurrentPhoneNumber();

        // 如果手机号没变,只更新last_seen_at
        if (newPhone.equals(oldPhone)) {
            phoneHistoryMapper.update(null,
                new LambdaUpdateWrapper<DevicePhoneHistory>()
                    .eq(DevicePhoneHistory::getDeviceId, device.getId())
                    .eq(DevicePhoneHistory::getPhoneNumber, newPhone)
                    .set(DevicePhoneHistory::getLastSeenAt, System.currentTimeMillis() / 1000)
            );
            return;
        }

        // 换卡了
        long now = System.currentTimeMillis() / 1000;

        // 旧号码设为非当前
        phoneHistoryMapper.update(null,
            new LambdaUpdateWrapper<DevicePhoneHistory>()
                .eq(DevicePhoneHistory::getDeviceId, device.getId())
                .eq(DevicePhoneHistory::getIsCurrent, true)
                .set(DevicePhoneHistory::getIsCurrent, false)
                .set(DevicePhoneHistory::getLastSeenAt, now)
        );

        // 检查新号码是否已存在
        DevicePhoneHistory existing = phoneHistoryMapper.selectOne(
            new LambdaQueryWrapper<DevicePhoneHistory>()
                .eq(DevicePhoneHistory::getDeviceId, device.getId())
                .eq(DevicePhoneHistory::getPhoneNumber, newPhone)
        );

        if (existing == null) {
            // 新号码,插入记录
            DevicePhoneHistory history = new DevicePhoneHistory();
            history.setDeviceId(device.getId());
            history.setPhoneNumber(newPhone);
            history.setCarrier(deviceInfo.getCarrier());
            history.setFirstSeenAt(now);
            history.setLastSeenAt(now);
            history.setIsCurrent(true);
            phoneHistoryMapper.insert(history);
        } else {
            // 旧号码重新使用
            phoneHistoryMapper.update(null,
                new LambdaUpdateWrapper<DevicePhoneHistory>()
                    .eq(DevicePhoneHistory::getId, existing.getId())
                    .set(DevicePhoneHistory::getIsCurrent, true)
                    .set(DevicePhoneHistory::getLastSeenAt, now)
            );
        }
    }

    private void saveNewMessages(Long deviceId, List<HeartbeatRequest.NewMessage> messages) {
        List<SmsMessage> entities = messages.stream().map(msg -> {
            SmsMessage entity = new SmsMessage();
            entity.setDeviceId(deviceId);
            entity.setPhoneNumber(msg.getPhoneNumber());
            entity.setContent(msg.getContent());
            entity.setDirection(msg.getDirection());
            entity.setIsRead(false);
            entity.setTimestamp(msg.getTimestamp());
            return entity;
        }).collect(Collectors.toList());

        // 批量插入
        entities.forEach(smsMessageMapper::insert);

        // 增加未读计数
        for (int i = 0; i < entities.size(); i++) {
            redisService.incrementUnreadCount(deviceId);
        }
    }

    private void saveMissedCalls(Long deviceId, List<HeartbeatRequest.MissedCallItem> calls) {
        List<MissedCall> entities = calls.stream().map(call -> {
            MissedCall entity = new MissedCall();
            entity.setDeviceId(deviceId);
            entity.setPhoneNumber(call.getPhoneNumber());
            entity.setIsRead(false);
            entity.setTimestamp(call.getTimestamp());
            return entity;
        }).collect(Collectors.toList());

        // 批量插入
        entities.forEach(missedCallMapper::insert);

        // 增加未读计数
        for (int i = 0; i < entities.size(); i++) {
            redisService.incrementUnreadCount(deviceId);
        }
    }

    private List<PendingSms> popSmsTasks(Long deviceId) {
        // 从Redis拉取待发送任务
        List<Map> tasks = redisService.popAllSmsTasks(deviceId, Map.class);

        if (tasks.isEmpty()) {
            return new ArrayList<>();
        }

        // 从数据库查询完整信息
        List<Long> taskIds = tasks.stream()
            .map(t -> Long.valueOf(t.get("task_id").toString()))
            .collect(Collectors.toList());

        List<PendingSms> pendingList = pendingSmsMapper.selectBatchIds(taskIds);

        // 更新状态为sent
        pendingList.forEach(task -> {
            task.setStatus("sent");
            task.setSentAt(LocalDateTime.now());
            pendingSmsMapper.updateById(task);
        });

        return pendingList;
    }

    private HeartbeatResponse buildResponse(List<PendingSms> tasks) {
        HeartbeatResponse response = new HeartbeatResponse();

        List<HeartbeatResponse.Command> commands = tasks.stream().map(task -> {
            HeartbeatResponse.Command cmd = new HeartbeatResponse.Command();
            cmd.setType("send_sms");
            cmd.setPhoneNumber(task.getPhoneNumber());
            cmd.setContent(task.getContent());
            return cmd;
        }).collect(Collectors.toList());

        response.setCommands(commands);
        return response;
    }
}
```

**Step 2: Commit WebhookService**

```bash
git add backend/src/main/java/com/smsserver/service/WebhookService.java
git commit -m "feat: add Webhook service for heartbeat processing"
```

Expected: WebhookService created with complete heartbeat logic

---

### Task 11: Create Message Service

**Files:**
- Create: `backend/src/main/java/com/smsserver/service/MessageService.java`

**Step 1: Create MessageService**

Create `backend/src/main/java/com/smsserver/service/MessageService.java`:

```java
package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smsserver.dto.message.ConversationResponse;
import com.smsserver.dto.message.MessageResponse;
import com.smsserver.dto.message.SendSmsRequest;
import com.smsserver.entity.Device;
import com.smsserver.entity.MissedCall;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.DeviceMapper;
import com.smsserver.mapper.MissedCallMapper;
import com.smsserver.mapper.PendingSmsMapper;
import com.smsserver.mapper.SmsMessageMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final DeviceMapper deviceMapper;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final PendingSmsMapper pendingSmsMapper;
    private final RedisService redisService;

    public List<ConversationResponse> getConversations(Long deviceId, Long userId) {
        // 验证权限
        verifyDeviceOwnership(deviceId, userId);

        // 查询所有消息,按手机号分组
        List<SmsMessage> messages = smsMessageMapper.selectList(
            new LambdaQueryWrapper<SmsMessage>()
                .eq(SmsMessage::getDeviceId, deviceId)
                .orderByDesc(SmsMessage::getTimestamp)
        );

        // 按手机号分组
        Map<String, List<SmsMessage>> grouped = messages.stream()
            .collect(Collectors.groupingBy(SmsMessage::getPhoneNumber));

        // 构造对话列表
        return grouped.entrySet().stream().map(entry -> {
            String phone = entry.getKey();
            List<SmsMessage> msgList = entry.getValue();

            SmsMessage latest = msgList.get(0);
            long unreadCount = msgList.stream().filter(m -> !m.getIsRead()).count();

            ConversationResponse response = new ConversationResponse();
            response.setPhoneNumber(phone);
            response.setLastMessage(latest.getContent());
            response.setLastTimestamp(latest.getTimestamp());
            response.setUnreadCount((int) unreadCount);
            response.setTotalCount(msgList.size());
            return response;
        }).sorted((a, b) -> b.getLastTimestamp().compareTo(a.getLastTimestamp()))
          .collect(Collectors.toList());
    }

    public Page<MessageResponse> getMessages(Long deviceId, Long userId, String phone, int page, int size) {
        // 验证权限
        verifyDeviceOwnership(deviceId, userId);

        // 分页查询
        Page<SmsMessage> messagePage = smsMessageMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<SmsMessage>()
                .eq(SmsMessage::getDeviceId, deviceId)
                .eq(SmsMessage::getPhoneNumber, phone)
                .orderByDesc(SmsMessage::getTimestamp)
        );

        // 转换为响应
        Page<MessageResponse> responsePage = new Page<>(page, size);
        responsePage.setTotal(messagePage.getTotal());
        responsePage.setRecords(
            messagePage.getRecords().stream().map(msg -> {
                MessageResponse response = new MessageResponse();
                BeanUtils.copyProperties(msg, response);
                return response;
            }).collect(Collectors.toList())
        );

        return responsePage;
    }

    public Map<String, Object> sendSms(Long deviceId, Long userId, SendSmsRequest request) {
        // 验证权限
        verifyDeviceOwnership(deviceId, userId);

        // 创建待发送任务
        PendingSms task = new PendingSms();
        task.setDeviceId(deviceId);
        task.setPhoneNumber(request.getPhoneNumber());
        task.setContent(request.getContent());
        task.setStatus("pending");

        pendingSmsMapper.insert(task);

        // 加入Redis队列
        Map<String, Object> taskData = new HashMap<>();
        taskData.put("task_id", task.getId());
        taskData.put("phone_number", task.getPhoneNumber());
        taskData.put("content", task.getContent());

        redisService.pushSmsTask(deviceId, taskData);

        // 返回响应
        Map<String, Object> response = new HashMap<>();
        response.put("task_id", task.getId());
        response.put("status", "pending");
        response.put("message", "短信已加入发送队列，将在设备下次心跳时发送");

        return response;
    }

    public void markMessagesRead(List<Long> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) {
            return;
        }

        // 批量更新已读状态
        smsMessageMapper.update(null,
            new LambdaUpdateWrapper<SmsMessage>()
                .in(SmsMessage::getId, messageIds)
                .set(SmsMessage::getIsRead, true)
        );

        // 清除未读计数缓存
        SmsMessage firstMsg = smsMessageMapper.selectById(messageIds.get(0));
        if (firstMsg != null) {
            redisService.deleteUnreadCount(firstMsg.getDeviceId());
        }
    }

    public void markCallsRead(List<Long> callIds) {
        if (callIds == null || callIds.isEmpty()) {
            return;
        }

        // 批量更新已读状态
        missedCallMapper.update(null,
            new LambdaUpdateWrapper<MissedCall>()
                .in(MissedCall::getId, callIds)
                .set(MissedCall::getIsRead, true)
        );

        // 清除未读计数缓存
        MissedCall firstCall = missedCallMapper.selectById(callIds.get(0));
        if (firstCall != null) {
            redisService.deleteUnreadCount(firstCall.getDeviceId());
        }
    }

    private void verifyDeviceOwnership(Long deviceId, Long userId) {
        Device device = deviceMapper.selectById(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new RuntimeException("设备不存在或无权限访问");
        }
    }

    public Page<MessageResponse> searchMessages(Long deviceId, Long userId, String keyword, String phone, Long startTime, Long endTime, int page, int size) {
        // 验证权限
        verifyDeviceOwnership(deviceId, userId);

        // 构建查询条件
        LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<SmsMessage>()
                .eq(SmsMessage::getDeviceId, deviceId);

        // 关键词搜索（短信内容）
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(SmsMessage::getContent, keyword);
        }

        // 号码筛选
        if (phone != null && !phone.isEmpty()) {
            wrapper.like(SmsMessage::getPhoneNumber, phone);
        }

        // 时间范围筛选
        if (startTime != null) {
            wrapper.ge(SmsMessage::getTimestamp, startTime);
        }
        if (endTime != null) {
            wrapper.le(SmsMessage::getTimestamp, endTime);
        }

        wrapper.orderByDesc(SmsMessage::getTimestamp);

        // 分页查询
        Page<SmsMessage> messagePage = smsMessageMapper.selectPage(new Page<>(page, size), wrapper);

        // 转换为响应对象
        Page<MessageResponse> responsePage = new Page<>(messagePage.getCurrent(), messagePage.getSize(), messagePage.getTotal());
        List<MessageResponse> responseList = messagePage.getRecords().stream().map(msg -> {
            MessageResponse response = new MessageResponse();
            BeanUtils.copyProperties(msg, response);
            return response;
        }).collect(Collectors.toList());
        responsePage.setRecords(responseList);

        return responsePage;
    }

    public void exportMessages(Long deviceId, Long userId, String phone, Long startTime, Long endTime, String format, HttpServletResponse response) throws IOException {
        // 验证权限
        verifyDeviceOwnership(deviceId, userId);

        // 构建查询条件
        LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<SmsMessage>()
                .eq(SmsMessage::getDeviceId, deviceId);

        if (phone != null && !phone.isEmpty()) {
            wrapper.eq(SmsMessage::getPhoneNumber, phone);
        }
        if (startTime != null) {
            wrapper.ge(SmsMessage::getTimestamp, startTime);
        }
        if (endTime != null) {
            wrapper.le(SmsMessage::getTimestamp, endTime);
        }

        wrapper.orderByDesc(SmsMessage::getTimestamp);

        // 查询所有符合条件的消息
        List<SmsMessage> messages = smsMessageMapper.selectList(wrapper);

        // 生成文件名
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String fileName = "messages_" + (phone != null ? phone + "_" : "") + timestamp;

        if ("excel".equalsIgnoreCase(format)) {
            // 导出Excel格式
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=" + fileName + ".xlsx");
            exportAsExcel(messages, response.getOutputStream());
        } else {
            // 默认导出CSV格式
            response.setContentType("text/csv; charset=UTF-8");
            response.setHeader("Content-Disposition", "attachment; filename=" + fileName + ".csv");
            exportAsCsv(messages, response.getOutputStream());
        }
    }

    private void exportAsCsv(List<SmsMessage> messages, OutputStream outputStream) throws IOException {
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            // 写入BOM以支持Excel打开UTF-8
            outputStream.write(0xEF);
            outputStream.write(0xBB);
            outputStream.write(0xBF);

            // 写入表头
            writer.println("时间,号码,方向,内容,已读状态");

            // 写入数据
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            for (SmsMessage msg : messages) {
                String time = sdf.format(new Date(msg.getTimestamp() * 1000));
                String direction = "received".equals(msg.getDirection()) ? "接收" : "发送";
                String isRead = msg.getIsRead() ? "已读" : "未读";
                String content = msg.getContent().replace("\"", "\"\""); // 转义双引号

                writer.println(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"",
                        time, msg.getPhoneNumber(), direction, content, isRead));
            }
        }
    }

    private void exportAsExcel(List<SmsMessage> messages, OutputStream outputStream) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("短信记录");

        // 创建标题行样式
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        // 创建标题行
        Row headerRow = sheet.createRow(0);
        String[] headers = {"时间", "号码", "方向", "内容", "已读状态"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // 写入数据
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        int rowNum = 1;
        for (SmsMessage msg : messages) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(sdf.format(new Date(msg.getTimestamp() * 1000)));
            row.createCell(1).setCellValue(msg.getPhoneNumber());
            row.createCell(2).setCellValue("received".equals(msg.getDirection()) ? "接收" : "发送");
            row.createCell(3).setCellValue(msg.getContent());
            row.createCell(4).setCellValue(msg.getIsRead() ? "已读" : "未读");
        }

        // 自动调整列宽
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        workbook.write(outputStream);
        workbook.close();
    }
}
```

**Step 2: Commit MessageService**

```bash
git add backend/src/main/java/com/smsserver/service/MessageService.java
git commit -m "feat: add Message service for SMS and call management"
```

Expected: MessageService created with conversation and message operations

---

## Phase 4: Controller Layer

### Task 12: Create Auth Controller

**Files:**
- Create: `backend/src/main/java/com/smsserver/controller/AuthController.java`

**Step 1: Create AuthController**

Create `backend/src/main/java/com/smsserver/controller/AuthController.java`:

```java
package com.smsserver.controller;

import com.smsserver.common.Result;
import com.smsserver.dto.auth.LoginRequest;
import com.smsserver.dto.auth.RegisterRequest;
import com.smsserver.dto.auth.UserInfoResponse;
import com.smsserver.entity.User;
import com.smsserver.service.RedisService;
import com.smsserver.service.UserService;
import com.smsserver.util.TokenGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "认证接口")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final RedisService redisService;

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<UserInfoResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        UserInfoResponse response = userService.getUserInfo(user.getId());
        return Result.success(response);
    }

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<UserInfoResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse) {
        User user = userService.login(request);

        // 生成session ID并存入Redis
        String sessionId = TokenGenerator.generate(32);
        redisService.setSession(sessionId, user.getId(), 7 * 24 * 60 * 60); // 7天

        // 设置Cookie
        Cookie cookie = new Cookie("SESSION_ID", sessionId);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        cookie.setHttpOnly(true);
        httpResponse.addCookie(cookie);

        UserInfoResponse response = userService.getUserInfo(user.getId());
        return Result.success(response);
    }

    @Operation(summary = "用户登出")
    @PostMapping("/logout")
    public Result<Void> logout(@CookieValue(value = "SESSION_ID", required = false) String sessionId) {
        if (sessionId != null) {
            redisService.deleteSession(sessionId);
        }
        return Result.success();
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public Result<UserInfoResponse> getCurrentUser(@CookieValue("SESSION_ID") String sessionId) {
        Long userId = redisService.getSession(sessionId, Long.class);
        if (userId == null) {
            return Result.error(401, "未登录");
        }

        UserInfoResponse response = userService.getUserInfo(userId);
        return Result.success(response);
    }
}
```

**Step 2: Commit AuthController**

```bash
git add backend/src/main/java/com/smsserver/controller/AuthController.java
git commit -m "feat: add Auth controller for user authentication"
```

Expected: AuthController created with login/register/logout endpoints

---

### Task 13: Create Device Controller

**Files:**
- Create: `backend/src/main/java/com/smsserver/controller/DeviceController.java`

**Step 1: Create DeviceController**

Create `backend/src/main/java/com/smsserver/controller/DeviceController.java`:

```java
package com.smsserver.controller;

import com.smsserver.common.Result;
import com.smsserver.dto.device.CreateDeviceRequest;
import com.smsserver.dto.device.DeviceResponse;
import com.smsserver.dto.device.UpdateDeviceRequest;
import com.smsserver.entity.DevicePhoneHistory;
import com.smsserver.service.DeviceService;
import com.smsserver.service.RedisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "设备管理接口")
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {
    private final DeviceService deviceService;
    private final RedisService redisService;

    @Operation(summary = "创建设备")
    @PostMapping
    public Result<DeviceResponse> createDevice(
            @Valid @RequestBody CreateDeviceRequest request,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        DeviceResponse response = deviceService.createDevice(userId, request);
        return Result.success(response);
    }

    @Operation(summary = "获取用户所有设备")
    @GetMapping
    public Result<List<DeviceResponse>> getUserDevices(@CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        List<DeviceResponse> devices = deviceService.getUserDevices(userId);
        return Result.success(devices);
    }

    @Operation(summary = "获取设备详情")
    @GetMapping("/{id}")
    public Result<DeviceResponse> getDevice(
            @PathVariable Long id,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        DeviceResponse device = deviceService.getDevice(id, userId);
        return Result.success(device);
    }

    @Operation(summary = "更新设备")
    @PutMapping("/{id}")
    public Result<DeviceResponse> updateDevice(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeviceRequest request,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        DeviceResponse device = deviceService.updateDevice(id, userId, request);
        return Result.success(device);
    }

    @Operation(summary = "删除设备")
    @DeleteMapping("/{id}")
    public Result<Void> deleteDevice(
            @PathVariable Long id,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        deviceService.deleteDevice(id, userId);
        return Result.success();
    }

    @Operation(summary = "获取设备手机号历史")
    @GetMapping("/{id}/phones")
    public Result<List<DevicePhoneHistory>> getPhoneHistory(
            @PathVariable Long id,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        List<DevicePhoneHistory> history = deviceService.getPhoneHistory(id, userId);
        return Result.success(history);
    }

    private Long getUserId(String sessionId) {
        Long userId = redisService.getSession(sessionId, Long.class);
        if (userId == null) {
            throw new RuntimeException("未登录");
        }
        return userId;
    }
}
```

**Step 2: Commit DeviceController**

```bash
git add backend/src/main/java/com/smsserver/controller/DeviceController.java
git commit -m "feat: add Device controller for device management"
```

Expected: DeviceController created with CRUD endpoints

---

### Task 14: Create Webhook Controller

**Files:**
- Create: `backend/src/main/java/com/smsserver/controller/WebhookController.java`

**Step 1: Create WebhookController**

Create `backend/src/main/java/com/smsserver/controller/WebhookController.java`:

```java
package com.smsserver.controller;

import com.smsserver.dto.webhook.HeartbeatRequest;
import com.smsserver.dto.webhook.HeartbeatResponse;
import com.smsserver.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Tag(name = "Webhook接口")
@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
public class WebhookController {
    private final WebhookService webhookService;

    @Operation(summary = "设备心跳接口（无需认证）")
    @PostMapping("/{token}")
    public HeartbeatResponse heartbeat(
            @PathVariable String token,
            @RequestBody HeartbeatRequest request) {
        log.info("Received heartbeat from token: {}", token);
        return webhookService.processHeartbeat(token, request);
    }
}
```

**Step 2: Commit WebhookController**

```bash
git add backend/src/main/java/com/smsserver/controller/WebhookController.java
git commit -m "feat: add Webhook controller for device heartbeat"
```

Expected: WebhookController created with heartbeat endpoint

---

### Task 15: Create Message Controller

**Files:**
- Create: `backend/src/main/java/com/smsserver/controller/MessageController.java`

**Step 1: Create MessageController**

Create `backend/src/main/java/com/smsserver/controller/MessageController.java`:

```java
package com.smsserver.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smsserver.common.Result;
import com.smsserver.dto.message.ConversationResponse;
import com.smsserver.dto.message.MessageResponse;
import com.smsserver.dto.message.SendSmsRequest;
import com.smsserver.service.MessageService;
import com.smsserver.service.RedisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Tag(name = "消息管理接口")
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;
    private final RedisService redisService;

    @Operation(summary = "获取设备的所有对话列表")
    @GetMapping("/{id}/conversations")
    public Result<List<ConversationResponse>> getConversations(
            @PathVariable Long id,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        List<ConversationResponse> conversations = messageService.getConversations(id, userId);
        return Result.success(conversations);
    }

    @Operation(summary = "获取指定对话的消息记录")
    @GetMapping("/{id}/messages")
    public Result<Page<MessageResponse>> getMessages(
            @PathVariable Long id,
            @RequestParam String phone,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        Page<MessageResponse> messages = messageService.getMessages(id, userId, phone, page, size);
        return Result.success(messages);
    }

    @Operation(summary = "发送短信")
    @PostMapping("/{id}/messages")
    public Result<Map<String, Object>> sendSms(
            @PathVariable Long id,
            @Valid @RequestBody SendSmsRequest request,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        Map<String, Object> response = messageService.sendSms(id, userId, request);
        return Result.success(response);
    }

    @Operation(summary = "批量标记消息已读")
    @PutMapping("/messages/read")
    public Result<Void> markMessagesRead(
            @RequestBody Map<String, List<Long>> request,
            @CookieValue("SESSION_ID") String sessionId) {
        getUserId(sessionId); // 验证登录
        List<Long> messageIds = request.get("message_ids");
        messageService.markMessagesRead(messageIds);
        return Result.success();
    }

    @Operation(summary = "搜索短信")
    @GetMapping("/{id}/messages/search")
    public Result<Page<MessageResponse>> searchMessages(
            @PathVariable Long id,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size,
            @CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);
        Page<MessageResponse> messages = messageService.searchMessages(id, userId, keyword, phone, startTime, endTime, page, size);
        return Result.success(messages);
    }

    @Operation(summary = "导出短信记录")
    @GetMapping("/{id}/messages/export")
    public void exportMessages(
            @PathVariable Long id,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime,
            @RequestParam(defaultValue = "csv") String format,
            @CookieValue("SESSION_ID") String sessionId,
            HttpServletResponse response) throws IOException {
        Long userId = getUserId(sessionId);
        messageService.exportMessages(id, userId, phone, startTime, endTime, format, response);
    }

    @Operation(summary = "批量标记来电已读")
    @PutMapping("/calls/read")
    public Result<Void> markCallsRead(
            @RequestBody Map<String, List<Long>> request,
            @CookieValue("SESSION_ID") String sessionId) {
        getUserId(sessionId); // 验证登录
        List<Long> callIds = request.get("call_ids");
        messageService.markCallsRead(callIds);
        return Result.success();
    }

    private Long getUserId(String sessionId) {
        Long userId = redisService.getSession(sessionId, Long.class);
        if (userId == null) {
            throw new RuntimeException("未登录");
        }
        return userId;
    }
}
```

**Step 2: Commit MessageController**

```bash
git add backend/src/main/java/com/smsserver/controller/MessageController.java
git commit -m "feat: add Message controller for SMS management"
```

Expected: MessageController created with message and conversation endpoints

---

### Task 16: Create Dashboard Controller

**Files:**
- Create: `backend/src/main/java/com/smsserver/controller/DashboardController.java`

**Step 1: Create DashboardController**

Create `backend/src/main/java/com/smsserver/controller/DashboardController.java`:

```java
package com.smsserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.common.Result;
import com.smsserver.entity.MissedCall;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.MissedCallMapper;
import com.smsserver.mapper.SmsMessageMapper;
import com.smsserver.service.DeviceService;
import com.smsserver.service.RedisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "看板接口")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DeviceService deviceService;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final RedisService redisService;

    @Operation(summary = "获取看板统计数据")
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats(@CookieValue("SESSION_ID") String sessionId) {
        Long userId = getUserId(sessionId);

        Map<String, Object> stats = new HashMap<>();

        // 获取设备列表
        var devices = deviceService.getUserDevices(userId);
        stats.put("devices", devices);

        // 统计在线设备数
        long onlineCount = devices.stream()
            .filter(d -> "online".equals(d.getStatus()))
            .count();
        stats.put("online_devices", onlineCount);

        // 统计未读消息数
        long unreadSmsCount = devices.stream()
            .mapToLong(d -> {
                Integer count = smsMessageMapper.selectCount(
                    new LambdaQueryWrapper<SmsMessage>()
                        .eq(SmsMessage::getDeviceId, d.getId())
                        .eq(SmsMessage::getIsRead, false)
                );
                return count;
            }).sum();

        long unreadCallCount = devices.stream()
            .mapToLong(d -> {
                Integer count = missedCallMapper.selectCount(
                    new LambdaQueryWrapper<MissedCall>()
                        .eq(MissedCall::getDeviceId, d.getId())
                        .eq(MissedCall::getIsRead, false)
                );
                return count;
            }).sum();

        stats.put("unread_count", unreadSmsCount + unreadCallCount);

        return Result.success(stats);
    }

    private Long getUserId(String sessionId) {
        Long userId = redisService.getSession(sessionId, Long.class);
        if (userId == null) {
            throw new RuntimeException("未登录");
        }
        return userId;
    }
}
```

**Step 2: Commit DashboardController**

```bash
git add backend/src/main/java/com/smsserver/controller/DashboardController.java
git commit -m "feat: add Dashboard controller for statistics"
```

Expected: DashboardController created with stats endpoint

---

### Task 17: Add Global Exception Handler

**Files:**
- Create: `backend/src/main/java/com/smsserver/exception/GlobalExceptionHandler.java`

**Step 1: Create GlobalExceptionHandler**

Create `backend/src/main/java/com/smsserver/exception/GlobalExceptionHandler.java`:

```java
package com.smsserver.exception;

import com.smsserver.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException e) {
        log.error("RuntimeException: ", e);
        return Result.error(e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : "参数校验失败";
        return Result.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("Exception: ", e);
        return Result.error("系统错误");
    }
}
```

**Step 2: Commit GlobalExceptionHandler**

```bash
git add backend/src/main/java/com/smsserver/exception/
git commit -m "feat: add global exception handler"
```

Expected: Global exception handler created

---

### Task 18: Configure CORS and ObjectMapper

**Files:**
- Create: `backend/src/main/java/com/smsserver/config/WebConfig.java`

**Step 1: Create WebConfig**

Create `backend/src/main/java/com/smsserver/config/WebConfig.java`:

```java
package com.smsserver.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "https://sms.sjsun.top")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
```

**Step 2: Commit WebConfig**

```bash
git add backend/src/main/java/com/smsserver/config/WebConfig.java
git commit -m "feat: add CORS configuration and ObjectMapper bean"
```

Expected: CORS and ObjectMapper configured

---

## Phase 5: Frontend Implementation

### Task 19: Initialize Next.js Project

**Files:**
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/.env.local`

**Step 1: Create TypeScript config**

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 2: Create Next.js config**

Create `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

**Step 3: Create Tailwind config**

Create `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c2905e',
        dark: 'rgb(45, 45, 45)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
```

**Step 4: Create PostCSS config**

Create `frontend/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 5: Create environment file**

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

**Step 6: Create global styles**

Create `frontend/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: rgb(45, 45, 45);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: #c2905e;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.8;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #c2905e;
  color: #c2905e;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(194, 144, 94, 0.1);
}
```

**Step 7: Commit frontend configuration**

```bash
git add frontend/
git commit -m "feat: initialize Next.js project with Tailwind CSS"
```

Expected: Frontend project configured with TypeScript and Tailwind

**Note:** The frontend implementation should include:
1. **Search functionality** in device detail pages:
   - Search bar in the toolbar above the message list
   - Support keyword search (message content) and phone number filtering
   - Time range picker for filtering messages
   - Real-time search with debounce
   - Display search results in the same message list format

2. **Export functionality**:
   - Export button in the toolbar (next to search)
   - Modal/dropdown to select export options:
     - Export current conversation or all messages
     - Select time range
     - Choose format (CSV or Excel)
   - Trigger download via API call to `/devices/:id/messages/export`
   - Show loading state during export
   - Handle large exports gracefully

---

## Phase 6: Final Steps

### Task 20: Create README and Deployment Instructions

**Files:**
- Update: `README.md`
- Create: `DEPLOYMENT.md`

**Step 1: Update README with complete instructions**

Update `README.md` with development and deployment instructions.

**Step 2: Create deployment guide**

Create `DEPLOYMENT.md` with production deployment steps.

**Step 3: Final commit**

```bash
git add README.md DEPLOYMENT.md
git commit -m "docs: add deployment instructions"
```

Expected: Documentation complete

---

## Summary

This implementation plan covers:

1. **Phase 1**: Project scaffolding (Tasks 1-3)
2. **Phase 2**: Backend entities and mappers (Tasks 4-6)
3. **Phase 3**: Service layer (Tasks 7-11)
4. **Phase 4**: Controller layer (Tasks 12-18)
5. **Phase 5**: Frontend initialization (Task 19)
6. **Phase 6**: Documentation (Task 20)

**Note**: Frontend pages implementation (Login, Dashboard, Device management, Message UI) is intentionally left as high-level tasks since you requested not to write detailed business code yet. These can be expanded when ready to implement.

**Testing and deployment tasks are marked as TODO** and can be detailed when needed.

---

## Execution Options

**1. Subagent-Driven (this session)** - Use @superpowers:subagent-driven-development to dispatch agents per task

**2. Parallel Session (separate)** - Use @superpowers:executing-plans in new session for batch execution

**Which approach would you prefer?**

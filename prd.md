# SMS Server 产品需求文档（PRD）

## 1. 项目概述

### 1.1 背景
管理多个 4G 终端模块，实现短信收发、未接电话记录管理的 Web 系统。适用于小团队共享使用，每个用户管理自己的设备，数据完全隔离。

### 1.2 核心约束
- 终端支持定时每分钟向外部发送 HTTP POST 请求（心跳）
- 终端不支持主动接收 HTTP 请求
- 所有命令通过心跳响应下发给设备

### 1.3 技术栈
- **前端：** Next.js + React + Element Plus + Tailwind CSS
- **后端：** Java 18 + Spring Boot + MyBatis-Plus + Lombok
- **数据库：** MySQL 8.0
- **缓存：** Redis 7（Session + 缓存 + 任务队列）
- **部署：** Docker + Docker Compose + Nginx
- **域名：** sms.sjsun.top

---

## 2. 功能需求

### 2.1 用户系统
- 注册/登录/登出
- 找回密码（邮件）
- 个人信息管理（用户名、邮箱、密码修改）
- 数据隔离：用户只能访问自己的设备和消息

### 2.2 设备管理
- **新建设备：**
  - 自动生成 16 位 webhook 地址（小写字母+数字）
  - 用户设置设备别名
  - 示例：`https://sms.sjsun.top/api/webhook/3a7f9b2c4e8d1f6a`

- **编辑设备：**
  - 只能修改别名
  - Webhook 地址不可修改

- **删除设备：**
  - 同步删除设备的所有短信、来电记录、历史数据

- **换卡支持：**
  - 设备更换 SIM 卡时自动记录手机号历史
  - 用户可查看和切换不同手机号的消息记录

### 2.3 设备心跳（Webhook）
- **频率：** 每分钟一次
- **请求格式（设备发送）：**
  ```json
  {
    "device_info": {
      "signal_strength": 85,
      "phone_number": "13800138000",
      "carrier": "中国移动"
    },
    "new_messages": [
      {
        "phone_number": "13900139000",
        "content": "你好",
        "direction": "received",
        "timestamp": 1709712000
      }
    ],
    "missed_calls": [
      {
        "phone_number": "13700137000",
        "timestamp": 1709712060
      }
    ]
  }
  ```

- **响应格式（服务器返回）：**
  ```json
  {
    "commands": [
      {
        "type": "send_sms",
        "phone_number": "13900139000",
        "content": "回复内容"
      }
    ]
  }
  ```

### 2.4 短信管理
- **对话列表：** 按手机号分组，仿微信样式
- **消息记录：**
  - 显示收/发消息
  - 时间戳
  - 已读/未读状态

- **自动已读：** 消息滚动到可见区域时自动标记已读（非手动点击）

- **发送短信：**
  - 用户在网页提交发送请求
  - 加入 Redis 任务队列
  - 提示"已加入发送队列，将在设备下次心跳时发送"
  - 发送失败只标记状态，需要用户手动重新发送

### 2.5 未接来电管理
- 按手机号分组显示
- 显示来电时间
- 已读/未读状态（自动标记规则同短信）

### 2.6 首页看板
- **第一行统计卡片：**
  - 当前在线设备 X 台
  - 当前未读记录 X 条
  - 占位卡片（预留功能）
  - 占位卡片（预留功能）

- **第二行设备状态卡片：**
  - 🟢 绿色：3 分钟内有心跳（在线）
  - 🟡 黄色：3-5 分钟内有心跳（警告）
  - 🔴 红色：超过 5 分钟未心跳（离线）
  - 显示：设备别名、手机号、运营商、信号强度、最后心跳时间
  - 每 30 秒自动刷新设备状态

### 2.7 数据永久保存
- 所有短信和来电记录永久保存，不做自动清理
- 用户可手动删除设备及关联数据

---

## 3. UI/UX 设计

### 3.1 主题风格
- **主题色：** #c2905e（金棕色）+ rgb(45, 45, 45)（深灰）
- **背景：** 深灰色 rgb(45, 45, 45)
- **卡片效果：** 毛玻璃（backdrop-blur）
- **无暗黑模式**

### 3.2 页面布局
- **导航：** 面包屑样式
- **卡片布局：** 统一使用毛玻璃卡片
- **消息界面：** 仿微信对话样式

### 3.3 页面结构
```
登录前：
├─ /login              登录页
├─ /register           注册页
└─ /forgot-password    找回密码页

登录后：
├─ /dashboard          首页看板
├─ /devices            设备列表页
│  ├─ /devices/new     新建设备页
│  ├─ /devices/:id     设备详情页（消息主页）
│  │  ├─ /devices/:id/messages/:phone    短信对话页
│  │  └─ /devices/:id/calls/:phone       来电记录页
│  └─ /devices/:id/edit  编辑设备页
└─ /profile            个人信息页
```

---

## 4. 数据库设计要点

### 4.1 核心表
- **user：** 用户表（id, username, password, email）
- **device：** 设备表（id, user_id, webhook_token, alias, current_phone_number, signal_strength, last_heartbeat_at）
- **device_phone_history：** 手机号历史表（支持换卡记录）
- **sms_message：** 短信记录表（device_id, phone_number, content, direction, is_read, timestamp）
- **missed_call：** 未接来电表（device_id, phone_number, is_read, timestamp）
- **pending_sms：** 待发送短信表（device_id, phone_number, content, status）

### 4.2 设计原则
- **无物理外键：** 所有关联只在业务层维护
- **合理索引：** 按查询场景优化索引
- **时间戳：** 使用 Unix 时间戳（BIGINT）

---

## 5. API 设计

### 5.1 基础路径
`https://sms.sjsun.top/api`

### 5.2 主要接口
- **认证：** `/auth/*`（register, login, logout, forgot-password, reset-password, me）
- **设备管理：** `/devices/*`（CRUD, 手机号历史）
- **Webhook：** `/webhook/:token`（心跳接口，公开无需认证）
- **短信：** `/devices/:id/conversations`, `/devices/:id/messages`, `/messages/read`
- **来电：** `/devices/:id/missed-calls`, `/devices/:id/calls`, `/calls/read`
- **看板：** `/dashboard/stats`
- **API 文档：** `/apidoc`（Swagger UI）

---

## 6. Redis 使用

### 6.1 三大角色
1. **Session 存储：** 用户登录状态（TTL: 7 天）
2. **缓存：** 设备状态、未读数量、统计数据（TTL: 1-10 分钟）
3. **任务队列：** 待发送短信命令（List 类型）

### 6.2 关键 Key
- `session:{session_id}`
- `device:status:{device_id}`
- `device:unread:{device_id}`
- `task:sms:{device_id}`（List）
- `stats:online_devices`

---

## 7. 部署方案

### 7.1 Docker 容器
- MySQL 8.0
- Redis 7
- Spring Boot 后端（Java 18）
- Next.js 前端（Node 20）
- Nginx 反向代理（SSL）

### 7.2 数据持久化
- `./data/mysql` → MySQL 数据
- `./data/redis` → Redis 持久化
- `./logs` → 应用日志

### 7.3 备份策略
- MySQL：每天凌晨 2 点自动备份，保留 7 天
- Redis：AOF + RDB

---

## 8. 性能和安全

### 8.1 性能优化
- Redis 缓存热数据
- 批量插入（MyBatis-Plus saveBatch）
- 分页查询
- 前端虚拟滚动（长消息列表）

### 8.2 安全措施
- HTTPS + SSL 证书
- 密码 BCrypt 加密
- Session 存储在 Redis
- 权限验证（设备归属检查）
- SQL 注入、XSS、CSRF 防护

---

## 9. 扩展性

### 9.1 当前能力
- 支持 50-100 台设备（QPS < 2）
- 单体应用架构

### 9.2 未来扩展
- 设备数量增加：拆分 Webhook 服务
- 数据增长：分库分表
- 新功能：群发短信、定时发送、短信模板

---

## 10. 开发计划

### 10.1 里程碑
1. **基础框架搭建**（1 周）：Docker 环境 + 数据库 + 项目初始化
2. **核心功能开发**（2 周）：用户认证 + 设备管理 + Webhook + Redis
3. **前端开发**（2 周）：页面实现 + 毛玻璃 UI + 仿微信消息界面
4. **测试和优化**（1 周）：单元测试 + 集成测试 + 性能测试
5. **部署上线**（3 天）：生产环境配置 + SSL + 备份 + 监控

---

## 11. 参考文档

详细设计文档：`docs/plans/2026-03-06-sms-server-design.md`
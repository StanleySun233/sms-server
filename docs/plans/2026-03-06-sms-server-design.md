# SMS Server 系统设计文档

**设计日期：** 2026-03-06
**版本：** 1.0
**设计目标：** 小团队共享管理多个 4G 终端设备，实现短信收发、未接来电记录管理

---

## 1. 项目概述

### 1.1 业务场景

小团队使用场景，多个用户各自管理自己的 4G 设备，数据完全隔离。

### 1.2 核心功能

- 用户注册/登录/密码找回
- 设备管理（新增、编辑、删除）
- 设备心跳接收（每分钟一次）
- 短信收发（仿微信对话界面）
- 短信搜索（关键词、号码、时间范围）
- 短信导出（CSV/Excel 格式）
- 未接来电记录
- 设备状态监控（在线/警告/离线）
- 换卡历史记录

### 1.3 技术栈

**前端：**
- Next.js 14 (React)
- Element Plus
- Tailwind CSS
- 毛玻璃 UI 效果
- 主题色：#c2905e（金棕色）+ rgb(45, 45, 45)（深灰）

**后端：**
- Java 18
- Spring Boot
- MyBatis-Plus
- Lombok

**数据存储：**
- MySQL 8.0（主数据）
- Redis 7（Session + 缓存 + 任务队列）

**部署：**
- Docker + Docker Compose
- Nginx 反向代理
- 域名：sms.sjsun.top

---

## 2. 架构设计

### 2.1 整体架构

**架构模式：** 单体应用 + 前后端分离

```
用户浏览器
    ↓
Nginx (反向代理)
    ├─→ Next.js 前端 (3000)
    └─→ Spring Boot 后端 (8080)
         ├─→ MySQL (3306)
         └─→ Redis (6379)

设备终端
    ↓
Webhook 心跳 (POST /api/webhook/:token)
    ↓
Spring Boot
```

### 2.2 关键设计决策

1. **单体应用 vs 微服务**：选择单体应用，理由如下
   - 小团队，设备数量有限（预计 50 台内）
   - 开发和运维成本低
   - 性能足够（QPS < 1）
   - 可渐进式拆分（未来如需要）

2. **无物理外键**：所有表关联只在业务层维护，便于数据迁移和分库

3. **Redis 多角色**：Session + 缓存 + 任务队列，减少组件复杂度

4. **命令不需要反馈**：设备执行命令后不反馈结果，简化流程

---

## 3. 数据库设计

### 3.1 表结构

#### 用户表（user）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| username | VARCHAR(50) | 用户名，唯一索引 |
| password | VARCHAR(255) | 密码（BCrypt） |
| email | VARCHAR(100) | 邮箱，唯一索引 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 设备表（device）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 业务层关联 user.id |
| webhook_token | VARCHAR(16) | 16位随机字符串，唯一索引 |
| alias | VARCHAR(100) | 设备别名 |
| current_phone_number | VARCHAR(20) | 当前手机号 |
| current_carrier | VARCHAR(50) | 当前运营商 |
| signal_strength | INT | 信号强度 0-100 |
| last_heartbeat_at | BIGINT | 最后心跳时间（Unix 时间戳） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引：** user_id

#### 设备手机号历史表（device_phone_history）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| device_id | BIGINT | 业务层关联 device.id |
| phone_number | VARCHAR(20) | 手机号 |
| carrier | VARCHAR(50) | 运营商 |
| first_seen_at | BIGINT | 首次使用时间 |
| last_seen_at | BIGINT | 最后使用时间 |
| is_current | BOOLEAN | 是否当前使用中 |

**索引：**
- 唯一索引：(device_id, phone_number)
- 普通索引：(device_id, is_current)

#### 短信记录表（sms_message）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| device_id | BIGINT | 业务层关联 device.id |
| phone_number | VARCHAR(20) | 对方号码 |
| content | TEXT | 短信内容 |
| direction | ENUM('received','sent') | 收发方向 |
| is_read | BOOLEAN | 已读状态，默认 false |
| timestamp | BIGINT | 短信时间戳 |
| created_at | DATETIME | 入库时间 |

**索引：**
- (device_id, phone_number, timestamp)
- (device_id, is_read)
- FULLTEXT(content) - 全文搜索索引（用于短信内容搜索）

#### 未接来电表（missed_call）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| device_id | BIGINT | 业务层关联 device.id |
| phone_number | VARCHAR(20) | 来电号码 |
| is_read | BOOLEAN | 已读状态，默认 false |
| timestamp | BIGINT | 来电时间戳 |
| created_at | DATETIME | 入库时间 |

**索引：**
- (device_id, phone_number, timestamp)
- (device_id, is_read)

#### 待发送短信表（pending_sms）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| device_id | BIGINT | 业务层关联 device.id |
| phone_number | VARCHAR(20) | 收信人号码 |
| content | TEXT | 短信内容 |
| status | ENUM('pending','sent','failed') | 发送状态 |
| created_at | DATETIME | 创建时间 |
| sent_at | DATETIME | 发送时间（NULL 表示未发送） |

**索引：** (device_id, status)

---

## 4. 后端 API 设计

### 4.1 基础路径

`https://sms.sjsun.top/api`

### 4.2 认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册账号 |
| POST | /auth/login | 登录 |
| POST | /auth/logout | 登出 |
| POST | /auth/forgot-password | 忘记密码（发送重置邮件） |
| POST | /auth/reset-password | 重置密码（通过邮件 token） |
| GET | /auth/me | 获取当前用户信息 |

### 4.3 设备管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /devices | 获取当前用户的所有设备列表 |
| POST | /devices | 创建新设备（生成 webhook_token） |
| GET | /devices/:id | 获取设备详情 |
| PUT | /devices/:id | 更新设备（只能改 alias） |
| DELETE | /devices/:id | 删除设备及关联数据 |
| GET | /devices/:id/phones | 获取设备的手机号历史记录 |

**GET /devices 响应示例：**
```json
[
  {
    "id": 1,
    "alias": "办公室设备",
    "webhook_url": "https://sms.sjsun.top/api/webhook/3a7f9b2c4e8d1f6a",
    "current_phone": "13800138000",
    "carrier": "中国移动",
    "signal_strength": 85,
    "status": "online",
    "last_heartbeat_at": 1709712000,
    "phone_history_count": 3
  }
]
```

### 4.4 Webhook 心跳 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /webhook/:token | 设备心跳接口（公开，无需认证） |

**请求体：**
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

**响应体：**
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

### 4.5 短信 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /devices/:id/conversations | 获取设备的所有对话列表（按手机号分组） |
| GET | /devices/:id/messages | 获取指定对话的消息记录 |
| POST | /devices/:id/messages | 发送短信（加入任务队列） |
| PUT | /messages/read | 批量标记已读 |
| GET | /devices/:id/messages/search | 搜索短信内容或号码 |
| GET | /devices/:id/messages/export | 导出短信记录（CSV/Excel） |

**GET /devices/:id/conversations 响应：**
```json
[
  {
    "phone_number": "13900139000",
    "last_message": "你好",
    "last_timestamp": 1709712000,
    "unread_count": 3,
    "total_count": 25
  }
]
```

**GET /devices/:id/messages?phone=13900139000&page=1&size=50 响应：**
```json
{
  "total": 25,
  "messages": [
    {
      "id": 1,
      "phone_number": "13900139000",
      "content": "你好",
      "direction": "received",
      "is_read": true,
      "timestamp": 1709712000
    }
  ]
}
```

**POST /devices/:id/messages 请求：**
```json
{
  "phone_number": "13900139000",
  "content": "回复内容"
}
```

响应：
```json
{
  "task_id": 123,
  "status": "pending",
  "message": "短信已加入发送队列，将在设备下次心跳时发送"
}
```

**GET /devices/:id/messages/search?keyword=你好&phone=13900139000&start_time=1709712000&end_time=1709798400&page=1&size=50 响应：**
```json
{
  "total": 10,
  "messages": [
    {
      "id": 1,
      "phone_number": "13900139000",
      "content": "你好，最近怎么样",
      "direction": "received",
      "is_read": true,
      "timestamp": 1709712000
    }
  ]
}
```

**说明：**
- `keyword`：搜索短信内容（可选，支持模糊匹配）
- `phone`：按号码筛选（可选，支持模糊匹配）
- `start_time`：开始时间戳（可选）
- `end_time`：结束时间戳（可选）
- `page`、`size`：分页参数

**GET /devices/:id/messages/export?phone=13900139000&start_time=1709712000&end_time=1709798400&format=csv 响应：**
- 响应头：`Content-Type: text/csv` 或 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 响应头：`Content-Disposition: attachment; filename="messages_13900139000_20260306.csv"`
- 响应体：文件流

**说明：**
- `phone`：导出指定号码的对话（可选，为空则导出所有）
- `start_time`：开始时间戳（可选）
- `end_time`：结束时间戳（可选）
- `format`：导出格式，`csv` 或 `excel`，默认 `csv`
- CSV 格式：时间,号码,方向,内容,已读状态
- Excel 格式：包含格式化的表格和样式

### 4.6 未接来电 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /devices/:id/missed-calls | 获取未接来电列表（按手机号分组） |
| GET | /devices/:id/calls | 获取指定号码的来电记录 |
| PUT | /calls/read | 批量标记已读 |

### 4.7 看板统计 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /dashboard/stats | 获取看板统计数据 |

**响应：**
```json
{
  "online_devices": 3,
  "unread_count": 15,
  "devices": [
    {
      "id": 1,
      "alias": "设备1",
      "status": "online",
      "last_heartbeat_at": 1709712000
    }
  ]
}
```

### 4.8 API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /apidoc | Swagger UI 文档页面 |
| GET | /apidoc/swagger.json | OpenAPI 规范文件 |

使用 SpringDoc (Swagger 3) 自动生成。

---

## 5. Redis 数据结构设计

### 5.1 Session 存储

**Key：** `session:{session_id}`
**Value：** JSON 字符串
```json
{
  "user_id": 1,
  "username": "admin",
  "login_time": 1709712000
}
```
**TTL：** 7 天（604800 秒）

### 5.2 设备状态缓存

**Key：** `device:status:{device_id}`
**Value：** JSON 字符串
```json
{
  "id": 1,
  "alias": "办公室设备",
  "current_phone": "13800138000",
  "carrier": "中国移动",
  "signal_strength": 85,
  "last_heartbeat_at": 1709712000
}
```
**TTL：** 10 分钟（600 秒）

### 5.3 未读消息数量缓存

**Key：** `device:unread:{device_id}`
**Value：** 数字
**TTL：** 5 分钟（300 秒）

### 5.4 待发送短信任务队列

**Key：** `task:sms:{device_id}`
**Type：** List
**Element：** JSON 字符串
```json
{
  "task_id": 123,
  "phone_number": "13900139000",
  "content": "回复内容"
}
```

**操作：**
- 发送短信：`LPUSH task:sms:{device_id} '{...}'`
- 心跳拉取：`LRANGE task:sms:{device_id} 0 -1` + `DEL task:sms:{device_id}`

### 5.5 在线设备数量缓存

**Key：** `stats:online_devices`
**Value：** 数字
**TTL：** 1 分钟（60 秒）

### 5.6 用户设备列表缓存

**Key：** `user:devices:{user_id}`
**Type：** Hash
**Field：** device_id
**Value：** JSON 字符串（设备信息）
**TTL：** 5 分钟（300 秒）

---

## 6. 核心业务流程

### 6.1 Webhook 心跳处理流程

1. **验证 token**：查询 Redis/MySQL，无效返回 404
2. **更新设备信息**：
   - 比对手机号，检测换卡
   - 更新 signal_strength, last_heartbeat_at
   - 更新 Redis 缓存
3. **保存新消息**：批量插入 sms_message，增加未读计数
4. **保存未接来电**：批量插入 missed_call
5. **拉取待发送任务**：从 Redis 拉取命令，更新 MySQL 状态
6. **返回命令列表**：响应 JSON 格式命令数组

### 6.2 发送短信流程

1. **权限验证**：检查设备归属
2. **创建待发送任务**：插入 MySQL pending_sms
3. **加入 Redis 队列**：LPUSH task:sms:{device_id}
4. **返回响应**：提示"已加入发送队列"

### 6.3 消息已读标记流程

1. **前端检测**：Intersection Observer 检测消息可见
2. **批量上报**：每 2 秒收集可见消息 ID
3. **后端更新**：批量更新 is_read=true
4. **更新缓存**：删除 Redis 未读计数缓存

### 6.4 设备状态计算

**规则：**
- 绿色（online）：3 分钟内有心跳
- 黄色（warning）：3-5 分钟内有心跳
- 红色（offline）：超过 5 分钟未心跳

**计算位置：** 后端实时计算，不存储

### 6.5 换卡检测逻辑

1. 比对 `device.current_phone_number` 与心跳中的 `phone_number`
2. 如不同：
   - 旧号码 `is_current=false`
   - 新号码插入/更新历史记录，`is_current=true`
   - 更新设备当前号码

### 6.6 数据一致性保障

**设备删除：**
- 使用 `@Transactional` 事务
- 手动级联删除：短信、来电、历史记录、待发送任务
- 清理 Redis 缓存

**并发控制：**
- 事务确保原子性
- 必要时使用乐观锁或分布式锁

---

## 7. 前端页面设计

### 7.1 路由结构

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

### 7.2 UI 风格规范

**颜色：**
- 主背景色：rgb(45, 45, 45)（深灰）
- 强调色/按钮：#c2905e（金棕色）
- 卡片背景：毛玻璃效果（backdrop-blur-lg）
- 文字颜色：白色/半透明白色

**毛玻璃效果：**
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 16px;
```

**状态指示器：**
- 🟢 绿色：#52c41a
- 🟡 黄色：#faad14
- 🔴 红色：#f5222d

### 7.3 首页看板（/dashboard）

**第一行：统计卡片**
- 当前在线设备 X 台
- 当前未读记录 X 条
- 占位卡片（预留）
- 占位卡片（预留）

**第二行：设备状态卡片**
- 状态指示器（绿/黄/红圆点）
- 设备别名 + 手机号 + 运营商
- 信号强度 + 最后心跳时间
- 点击跳转设备详情

**刷新机制：** 每 30 秒自动刷新

### 7.4 设备详情页（/devices/:id）

**布局：** 仿微信样式

**左侧：** 对话列表（手机号分组）
- 显示最后一条消息
- 未读数量 + 红点
- 未接来电标记

**右侧：** 消息记录
- 收发消息气泡
- 时间戳
- 滚动到可见区域自动标记已读

**底部：** 发送框
- 输入框 + 发送按钮
- 发送后提示"已加入队列"

**顶部工具栏：**
- 搜索框：支持搜索短信内容或号码
- 导出按钮：导出当前对话或全部短信记录
- 筛选选项：时间范围、收发方向

**设备信息卡片：**
- 设备别名 + 编辑按钮
- 当前号码/运营商/信号强度/状态
- 多号码历史切换下拉框

### 7.5 新建/编辑设备页

**新建：**
- 输入设备别名
- 自动生成 webhook 地址（只读 + 复制按钮）
- 保存/取消

**编辑：**
- 修改设备别名
- webhook 地址灰色显示（不可修改）
- 保存/取消/删除设备

### 7.6 个人信息页（/profile）

- 用户名（不可修改）
- 邮箱
- 注册时间
- 修改密码表单

---

## 8. Docker 部署方案

### 8.1 容器架构

```
sms-server/
├── backend/        # Spring Boot
├── frontend/       # Next.js
├── mysql/          # MySQL 8.0
├── redis/          # Redis 7
└── nginx/          # 反向代理
```

### 8.2 服务列表

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| MySQL | mysql:8.0 | 3306 | 数据库，仅内部访问 |
| Redis | redis:7-alpine | 6379 | 缓存，密码保护 |
| Backend | openjdk:18-slim | 8080 | Spring Boot 应用 |
| Frontend | node:20-alpine | 3000 | Next.js 应用 |
| Nginx | nginx:alpine | 80/443 | 反向代理 + SSL |

### 8.3 Nginx 路由规则

- `/` → 前端（3000）
- `/api` → 后端（8080）
- `/apidoc` → 后端（8080）

### 8.4 数据持久化

**挂载目录：**
```
./data/mysql    → MySQL 数据文件
./data/redis    → Redis 持久化文件
./logs          → 应用日志
```

### 8.5 环境变量

**.env 文件：**
```
MYSQL_ROOT_PASSWORD=xxx
MYSQL_DATABASE=sms_server
MYSQL_USER=sms_user
MYSQL_PASSWORD=xxx

REDIS_PASSWORD=xxx

SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=xxx

NEXT_PUBLIC_API_URL=https://sms.sjsun.top/api
```

### 8.6 备份策略

**MySQL：** 每天凌晨 2 点自动备份，保留 7 天
**Redis：** AOF 持久化（实时）+ RDB 快照（每小时）

### 8.7 监控和健康检查

- 后端：Spring Boot Actuator `/actuator/health`
- 前端：Next.js 健康端点
- 自动重启故障容器

---

## 9. 性能优化

### 9.1 数据库优化

- 合理索引（已在表设计中体现）
- 批量插入（MyBatis-Plus saveBatch）
- 分页查询（避免全表扫描）

### 9.2 缓存策略

- 热数据缓存（设备状态、未读数量）
- 查询结果缓存（设备列表、对话列表）
- 缓存穿透保护（布隆过滤器或空值缓存）

### 9.3 Webhook 性能

- 快速响应（< 100ms）
- 异步处理耗时操作
- Redis 管道减少网络往返

### 9.4 前端优化

- Next.js SSR/SSG
- 图片懒加载
- 虚拟滚动（长消息列表）
- 防抖/节流（自动刷新、已读上报）

---

## 10. 安全设计

### 10.1 认证授权

- Session 存储在 Redis，7 天过期
- 密码 BCrypt 加密
- HTTPS 传输（SSL 证书）

### 10.2 权限验证

- 所有设备操作检查 `device.user_id == 当前用户 ID`
- Webhook 接口通过 token 鉴权（无需登录）

### 10.3 数据安全

- SQL 注入防护（MyBatis-Plus 参数化查询）
- XSS 防护（前端输入转义）
- CSRF 防护（Spring Security）

### 10.4 敏感信息

- 环境变量存储密码、密钥
- 生产环境不暴露敏感端口（MySQL、Redis）

---

## 11. 扩展性考虑

### 11.1 数据增长

- 永久保存所有消息（用户需求）
- 定期优化索引和查询性能
- 必要时分库分表（按用户/设备）

### 11.2 设备数量增长

- 单体应用支持 100+ 设备（QPS < 2）
- 如需扩展：拆分 Webhook 服务（高性能语言）
- 引入消息队列（RabbitMQ/Kafka）异步处理

### 11.3 功能扩展

- 占位卡片预留统计功能
- 可能的新功能：群发短信、定时发送、短信模板等

---

## 12. 开发计划

### 12.1 里程碑

**阶段 1：基础框架搭建（1 周）**
- Docker 环境搭建
- 数据库表创建
- Spring Boot 项目初始化
- Next.js 项目初始化

**阶段 2：核心功能开发（2 周）**
- 用户认证系统
- 设备管理 API
- Webhook 心跳接口
- Redis 集成

**阶段 3：前端开发（2 周）**
- 登录/注册页面
- 首页看板
- 设备列表和详情页
- 仿微信消息界面

**阶段 4：测试和优化（1 周）**
- 单元测试
- 集成测试
- 性能测试
- Bug 修复

**阶段 5：部署上线（3 天）**
- 生产环境配置
- SSL 证书配置
- 备份策略实施
- 监控告警配置

### 12.2 技术风险

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| Webhook 高并发 | 性能瓶颈 | Redis 缓存 + 异步处理 |
| 设备换卡检测 | 数据不一致 | 事务保证原子性 |
| 前端消息滚动性能 | 长列表卡顿 | 虚拟滚动 |
| Docker 部署问题 | 上线延迟 | 提前测试环境验证 |

---

## 13. 附录

### 13.1 Webhook Token 生成规则

- 长度：16 位
- 字符集：小写字母 + 数字（[a-z0-9]）
- 生成方式：SecureRandom
- 唯一性：数据库唯一索引保证

### 13.2 时间戳处理

- 前端：JavaScript Date
- 后端：Java Instant
- 数据库：BIGINT 存储 Unix 时间戳（秒）
- Redis：Unix 时间戳（秒）

### 13.3 数据库字符集

- 字符集：utf8mb4
- 排序规则：utf8mb4_unicode_ci
- 支持 emoji 和特殊字符

---

**文档结束**

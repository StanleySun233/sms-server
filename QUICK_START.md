# SMS Server - 快速开始指南

## 🚀 立即开始测试

### 第一步：配置环境变量

```bash
# 进入项目目录
cd D:\code\sms-server

# 创建环境变量文件
copy .env.example .env

# 编辑 .env 文件，设置以下必要的密码：
# MYSQL_ROOT_PASSWORD=你的MySQL根密码
# MYSQL_PASSWORD=你的MySQL用户密码
# REDIS_PASSWORD=你的Redis密码
# JWT_SECRET=至少32字符的JWT密钥
# SESSION_SECRET=至少32字符的会话密钥
```

### 第二步：启动服务

```bash
# 启动所有 Docker 服务
docker-compose up -d

# 查看服务状态（确保所有服务都是 Up 状态）
docker-compose ps

# 查看日志（可选）
docker-compose logs -f
```

### 第三步：访问应用

- **前端界面**: http://localhost
- **后端 API**: http://localhost/api
- **API 文档**: http://localhost/apidoc

### 第四步：功能测试

1. **注册和登录**
   - 访问 http://localhost
   - 点击注册，创建新账号
   - 登录系统

2. **创建设备**
   - 进入设备管理页面
   - 点击"添加新设备"
   - 输入设备名称
   - 保存后会看到 Webhook URL（格式：`http://localhost/api/webhook/xxxxxxxxxxxxxxxx`）

3. **测试 Webhook（模拟 4G 设备）**
   ```bash
   # 将下面的 YOUR_TOKEN 替换为实际的 webhook token
   curl -X POST http://localhost/api/webhook/YOUR_TOKEN \
     -H "Content-Type: application/json" \
     -d '{
       "device_info": {
         "phone_number": "13800138000",
         "imei": "123456789012345",
         "signal_strength": 85,
         "battery_level": 75
       },
       "new_messages": [
         {
           "phone": "13900139000",
           "content": "测试消息",
           "timestamp": "2026-03-06T12:00:00Z"
         }
       ],
       "missed_calls": [
         {
           "phone": "13900139000",
           "timestamp": "2026-03-06T11:55:00Z"
         }
       ]
     }'
   ```

4. **查看消息和来电**
   - 点击设备卡片
   - 查看短信对话列表
   - 点击对话进入聊天界面
   - 查看未接来电

5. **发送短信**
   - 在聊天界面输入消息
   - 点击发送
   - 消息会进入待发送队列
   - 下次设备心跳时会收到发送指令

6. **查看仪表板**
   - 返回仪表板
   - 查看设备统计
   - 查看未读消息和来电数量

---

## 📊 预期的测试结果

### ✅ 正常情况
- 所有服务启动成功（MySQL, Redis, Backend, Frontend, Nginx）
- 可以注册和登录
- 可以创建设备并获取 Webhook URL
- Webhook 接收心跳返回 200
- 新消息和来电保存到数据库
- 前端正确显示消息和来电
- 可以发送短信（创建待发送任务）
- 仪表板显示正确的统计数据

### ⚠️ 可能的问题
1. **端口冲突**: 如果 80、3306、6379、8080、3000 端口被占用，需要修改 docker-compose.yml
2. **内存不足**: Docker 需要至少 4GB 内存
3. **网络问题**: 确保 Docker 网络正常

---

## 🔧 常用调试命令

```bash
# 查看所有容器状态
docker-compose ps

# 查看特定服务的日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs redis

# 重启服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 停止并删除所有数据（慎用！）
docker-compose down -v

# 进入 MySQL
docker exec -it sms-mysql mysql -uroot -p

# 进入 Redis
docker exec -it sms-redis redis-cli -a YOUR_REDIS_PASSWORD

# 查看设备状态
# 在 MySQL 中执行：
SELECT id, alias, webhook_token, last_heartbeat_at,
       TIMESTAMPDIFF(MINUTE, last_heartbeat_at, NOW()) as minutes_ago
FROM devices;

# 查看消息
SELECT * FROM sms_message ORDER BY created_at DESC LIMIT 10;

# 查看未接来电
SELECT * FROM missed_call ORDER BY call_time DESC LIMIT 10;
```

---

## 📝 测试检查清单

### 基础功能
- [ ] 用户注册成功
- [ ] 用户登录成功
- [ ] 会话持久（刷新页面仍然登录）
- [ ] 用户登出成功

### 设备管理
- [ ] 创建设备成功
- [ ] 获取到 Webhook URL
- [ ] 查看设备列表
- [ ] 编辑设备别名
- [ ] 删除设备

### Webhook 集成
- [ ] Webhook 接收心跳返回 200
- [ ] 设备 last_heartbeat_at 更新
- [ ] 新消息保存到数据库
- [ ] 未接来电保存到数据库
- [ ] 设备状态正确显示（在线/警告/离线）

### 短信功能
- [ ] 查看对话列表
- [ ] 对话按号码分组
- [ ] 显示未读数量
- [ ] 打开聊天界面
- [ ] 消息正确显示（发送/接收）
- [ ] 发送短信
- [ ] 消息自动标记已读
- [ ] 搜索消息
- [ ] 导出 CSV

### 未接来电
- [ ] 查看来电列表
- [ ] 来电按号码分组
- [ ] 查看来电历史
- [ ] 标记已读

### 仪表板
- [ ] 显示设备统计
- [ ] 显示未读数量
- [ ] 自动刷新

### 性能测试（可选）
- [ ] 创建多个设备
- [ ] 模拟多个设备同时心跳
- [ ] 发送大量消息
- [ ] 测试搜索性能

---

## 🐛 遇到问题？

1. **查看日志**: `docker-compose logs -f`
2. **参考故障排查文档**: `docs/TROUBLESHOOTING.md`
3. **检查环境变量**: 确保 `.env` 文件配置正确
4. **重启服务**: `docker-compose restart`

---

## 📞 需要帮助？

如果测试过程中遇到问题，可以：
1. 查看详细文档：`PROJECT_DELIVERY.md`
2. 查看故障排查：`docs/TROUBLESHOOTING.md`
3. 查看 API 文档：http://localhost/apidoc
4. 告诉我具体的错误信息，我会帮助解决

---

**祝测试顺利！** 🎉

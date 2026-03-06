# Docker Compose 使用指南

项目提供了三个 docker-compose 文件，适用于不同的使用场景：

## 📁 文件说明

### 1. `docker-compose.yml` (生产环境 - 使用预构建镜像)
**用途**: 生产环境部署，使用 GitHub Container Registry 上的预构建镜像

**特点**:
- ✅ 使用预构建的 Docker 镜像 (`ghcr.io/stanleysun233/sms-server-*`)
- ✅ 快速启动，无需本地构建
- ✅ 适合生产环境或快速体验
- ✅ 包含完整服务：MySQL、Redis、Backend、Frontend、Nginx

**使用方法**:
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

---

### 2. `docker-compose.dev.yml` (开发环境 - 从源码构建)
**用途**: 本地开发，从源码构建并支持热更新

**特点**:
- 🔨 从本地源码构建镜像
- 🔄 挂载源码目录，支持代码热更新
- 🐛 方便调试和开发
- ⏱️ 首次启动需要构建时间

**使用方法**:
```bash
# 首次启动（构建镜像）
docker-compose -f docker-compose.dev.yml up -d --build

# 后续启动
docker-compose -f docker-compose.dev.yml up -d

# 重新构建某个服务
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f backend

# 停止服务
docker-compose -f docker-compose.dev.yml down
```

**代码挂载**:
- Backend: `./backend/src` → `/app/src` (Java 源码)
- Frontend: `./frontend/src` → `/app/src` (React 源码)
- 修改代码后会自动生效（可能需要重启容器）

---

### 3. `docker-compose.prod.yml` (生产环境覆盖配置)
**用途**: 与 `docker-compose.yml` 组合使用，应用生产环境优化配置

**特点**:
- ⚙️ 优化的资源限制和配置
- 🚀 生产环境的 JVM 参数
- 🔒 更严格的资源管理
- 📊 性能监控配置

**使用方法**:
```bash
# 组合使用（推荐用于生产环境）
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 查看配置（不启动，验证配置是否正确）
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config

# 停止服务
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

**生产环境配置**:
- Backend: Spring Profile 设置为 `prod`，JVM 堆内存 512MB-1GB
- 资源限制：MySQL 2GB、Redis 512MB、Backend 2GB、Frontend 512MB
- 支持 Let's Encrypt SSL 证书

---

## 🎯 使用场景建议

### 场景 1: 快速体验项目
```bash
# 使用预构建镜像
docker-compose up -d
```
访问 http://localhost

### 场景 2: 本地开发调试
```bash
# 从源码构建，支持代码热更新
docker-compose -f docker-compose.dev.yml up -d --build
```
修改 `backend/src` 或 `frontend/src` 中的代码

### 场景 3: 生产环境部署
```bash
# 使用预构建镜像 + 生产优化配置
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
配置 SSL 证书、域名等

---

## 📝 环境变量配置

所有 docker-compose 文件都使用相同的 `.env` 文件。复制 `.env.example` 并修改：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env
```

**关键配置项**:
- `MYSQL_ROOT_PASSWORD`: MySQL root 密码
- `MYSQL_DATABASE`: 数据库名
- `MYSQL_USER` / `MYSQL_PASSWORD`: 应用数据库用户
- `REDIS_PASSWORD`: Redis 密码
- `JWT_SECRET` / `SESSION_SECRET`: 安全密钥
- `BACKEND_PORT`: 后端端口（默认 8080）
- `FRONTEND_PORT`: 前端端口（默认 3000）

---

## 🔧 常用命令

```bash
# 查看所有运行中的容器
docker-compose ps

# 查看特定服务的日志
docker-compose logs -f backend

# 进入容器 shell
docker-compose exec backend bash
docker-compose exec mysql mysql -uroot -p

# 重启特定服务
docker-compose restart backend

# 查看资源使用情况
docker stats

# 清理未使用的资源
docker system prune -a
```

---

## 🚨 注意事项

1. **首次启动**: 需要等待 MySQL 初始化完成（约 30-60 秒）
2. **数据持久化**: 数据存储在 Docker volumes 中，使用 `docker-compose down -v` 会删除数据
3. **端口冲突**: 确保 3306、6379、8080、3000、80、443 端口未被占用
4. **镜像拉取**: 生产模式首次使用需要从 GitHub Container Registry 拉取镜像
5. **内存要求**: 建议至少 4GB 可用内存

---

## 📊 服务访问地址

- **Frontend**: http://localhost (通过 Nginx) 或 http://localhost:3000 (直接访问)
- **Backend API**: http://localhost/api 或 http://localhost:8080
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

---

## 🐛 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs -f

# 检查健康状态
docker-compose ps

# 重新构建并启动
docker-compose up -d --build --force-recreate
```

### 数据库连接失败
```bash
# 检查 MySQL 是否就绪
docker-compose exec mysql mysqladmin ping -h localhost -uroot -p

# 查看 MySQL 日志
docker-compose logs mysql
```

### 端口已被占用
```bash
# 修改 .env 文件中的端口配置
BACKEND_PORT=8081
FRONTEND_PORT=3001
```

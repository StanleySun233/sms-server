# Docker 部署指南

本项目支持两种 Docker 部署方式：使用预构建镜像（生产环境）和本地构建（开发环境）。

## 📋 目录

- [快速开始](#快速开始)
- [生产环境部署](#生产环境部署)
- [开发环境部署](#开发环境部署)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [环境变量配置](#环境变量配置)

## 🚀 快速开始

### 前置要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### 克隆项目

```bash
git clone https://github.com/yourusername/sms-server.git
cd sms-server
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库密码等敏感信息
```

## 🏭 生产环境部署

生产环境使用预构建的 Docker 镜像，由 GitHub Actions 自动构建并推送到 GitHub Container Registry (GHCR)。

### 1. 配置环境变量

编辑 `.env` 文件，设置以下变量：

```bash
# Docker 镜像配置
GITHUB_REPOSITORY=yourusername/sms-server
BACKEND_TAG=latest
FRONTEND_TAG=latest

# 其他必需的环境变量
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret_at_least_32_characters
```

### 2. 拉取镜像并启动

```bash
# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 访问服务

- 前端：http://localhost
- 后端 API：http://localhost/api
- 直接访问后端：http://localhost:8080

### 4. 停止服务

```bash
docker-compose down
```

### 5. 更新到最新版本

```bash
# 拉取最新镜像
docker-compose pull

# 重新启动服务
docker-compose up -d

# 查看更新日志
docker-compose logs -f
```

## 🛠️ 开发环境部署

开发环境使用 `docker-compose.dev.yml`，从源代码本地构建镜像，支持热重载。

### 1. 启动开发环境

```bash
# 使用开发配置启动
docker-compose -f docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

### 2. 重新构建

当修改 Dockerfile 或依赖项时：

```bash
# 重新构建并启动
docker-compose -f docker-compose.dev.yml up -d --build

# 仅构建不启动
docker-compose -f docker-compose.dev.yml build
```

### 3. 停止开发环境

```bash
docker-compose -f docker-compose.dev.yml down
```

## 🤖 GitHub Actions CI/CD

项目配置了两个独立的 GitHub Actions 工作流，分别构建前端和后端镜像。

### 工作流说明

#### 后端构建 (`.github/workflows/backend-docker-build.yml`)

- **触发条件**：
  - 推送到 `main`/`master`/`dev` 分支且 `backend/` 目录有变化
  - 推送 `backend-v*` 标签
  - `backend/` 目录的 Pull Request

- **镜像标签**：
  - `ghcr.io/username/sms-server-backend:latest` (main/master 分支)
  - `ghcr.io/username/sms-server-backend:dev` (dev 分支)
  - `ghcr.io/username/sms-server-backend:sha-<commit>` (每次提交)

#### 前端构建 (`.github/workflows/frontend-docker-build.yml`)

- **触发条件**：
  - 推送到 `main`/`master`/`dev` 分支且 `frontend/` 目录有变化
  - 推送 `frontend-v*` 标签
  - `frontend/` 目录的 Pull Request

- **镜像标签**：
  - `ghcr.io/username/sms-server-frontend:latest` (main/master 分支)
  - `ghcr.io/username/sms-server-frontend:dev` (dev 分支)
  - `ghcr.io/username/sms-server-frontend:sha-<commit>` (每次提交)

### 配置 GitHub Actions

1. **启用 GitHub Container Registry**：
   - 仓库设置 → Actions → General
   - 启用 "Read and write permissions" for GITHUB_TOKEN

2. **设置镜像为公开**（可选）：
   - 访问 https://github.com/users/USERNAME/packages
   - 找到镜像包 → Package settings
   - Change visibility → Public

### 使用特定版本

```bash
# 使用特定提交的镜像
BACKEND_TAG=sha-abc1234 FRONTEND_TAG=sha-abc1234 docker-compose up -d

# 使用开发分支
BACKEND_TAG=dev FRONTEND_TAG=dev docker-compose up -d

# 使用版本标签
BACKEND_TAG=backend-v1.0.0 FRONTEND_TAG=frontend-v1.0.0 docker-compose up -d
```

## 🔧 环境变量配置

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | `StrongPassword123!` |
| `MYSQL_DATABASE` | 数据库名称 | `sms_server` |
| `MYSQL_USER` | 数据库用户名 | `sms_user` |
| `MYSQL_PASSWORD` | 数据库密码 | `UserPassword123!` |
| `REDIS_PASSWORD` | Redis 密码 | `RedisPassword123!` |
| `JWT_SECRET` | JWT 密钥（至少 32 字符） | `your-secret-key-here-32-chars` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MYSQL_PORT` | MySQL 端口 | `3306` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `BACKEND_PORT` | 后端端口 | `8080` |
| `FRONTEND_PORT` | 前端端口 | `3000` |
| `NEXT_PUBLIC_API_URL` | 前端 API 地址 | `http://localhost/api` |
| `GITHUB_REPOSITORY` | GitHub 仓库名 | `yourusername/sms-server` |
| `BACKEND_TAG` | 后端镜像标签 | `latest` |
| `FRONTEND_TAG` | 前端镜像标签 | `latest` |

## 📊 健康检查

所有服务都配置了健康检查：

```bash
# 查看服务健康状态
docker-compose ps

# 查看详细健康信息
docker inspect sms-backend | grep -A 10 Health
docker inspect sms-frontend | grep -A 10 Health
```

## 🐛 故障排查

### 服务无法启动

```bash
# 查看日志
docker-compose logs backend
docker-compose logs frontend

# 查看所有服务状态
docker-compose ps
```

### 数据库连接失败

```bash
# 检查 MySQL 健康状态
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# 进入 MySQL 容器
docker-compose exec mysql mysql -u root -p
```

### Redis 连接失败

```bash
# 测试 Redis 连接
docker-compose exec redis redis-cli -a your_redis_password ping
```

### 清理并重新开始

```bash
# 停止并移除容器
docker-compose down

# 移除数据卷（警告：会删除所有数据）
docker-compose down -v

# 移除镜像
docker-compose down --rmi all

# 重新启动
docker-compose up -d
```

## 📝 备份与恢复

### 数据库备份

```bash
# 导出数据库
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup.sql

# 使用内置备份脚本（如果有）
docker-compose exec mysql /backups/backup.sh
```

### 数据库恢复

```bash
# 从备份恢复
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < backup.sql
```

## 🔐 安全建议

1. **更改默认密码**：确保修改所有默认密码
2. **使用强密码**：密码至少 16 字符，包含大小写字母、数字和特殊字符
3. **限制端口暴露**：生产环境只暴露必要的端口（80/443）
4. **配置 SSL/TLS**：使用 Let's Encrypt 或其他证书
5. **定期更新镜像**：定期拉取最新的安全补丁

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 参考](https://docs.docker.com/compose/compose-file/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

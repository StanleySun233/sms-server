# SMS Server - GitHub Actions & Docker 快速开始

## ✨ 已完成的配置

本项目已配置好完整的 CI/CD 流程，包括：

### 1. GitHub Actions 工作流

- ✅ **后端构建流程** (`.github/workflows/backend-docker-build.yml`)
  - 当 `backend/` 目录有改动时自动触发
  - 构建并推送到 `ghcr.io/stanleysun233/sms-server-backend`
  - 支持多架构：linux/amd64, linux/arm64

- ✅ **前端构建流程** (`.github/workflows/frontend-docker-build.yml`)
  - 当 `frontend/` 目录有改动时自动触发
  - 构建并推送到 `ghcr.io/stanleysun233/sms-server-frontend`
  - 支持多架构：linux/amd64, linux/arm64

### 2. Docker Compose 配置

- ✅ **生产环境** (`docker-compose.yml`) - 使用预构建镜像
- ✅ **开发环境** (`docker-compose.dev.yml`) - 本地构建，支持热重载
- ✅ **环境变量模板** (`.env.example`)

### 3. 管理工具

- ✅ **Makefile** - 简化的命令行工具
- ✅ **完整文档** (`docs/DOCKER_DEPLOYMENT.md`)

## 🚀 快速开始

### 首次配置（仅需一次）

1. **启用 GitHub Actions**

   在 GitHub 仓库设置中：
   - 进入 `Settings` → `Actions` → `General`
   - 勾选 "Read and write permissions"
   - 点击 "Save"

2. **推送到 GitHub 触发首次构建**

   ```bash
   git add .
   git commit -m "Add Docker build workflows"
   git push origin main
   ```

3. **查看构建进度**

   访问：https://github.com/StanleySun233/sms-server/actions

4. **设置镜像为公开**（可选，用于无需登录即可拉取）

   - 访问：https://github.com/users/StanleySun233/packages
   - 找到 `sms-server-backend` 和 `sms-server-frontend`
   - 点击 `Package settings` → `Change visibility` → `Public`

### 开发环境部署（本地）

```bash
# 1. 克隆项目
git clone https://github.com/StanleySun233/sms-server.git
cd sms-server

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置数据库密码等

# 3. 启动开发环境（从源代码构建）
make dev

# 或使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d

# 4. 查看日志
make dev-logs
```

### 生产环境部署（使用预构建镜像）

```bash
# 1. 克隆项目
git clone https://github.com/StanleySun233/sms-server.git
cd sms-server

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置生产环境配置

# 3. 拉取最新镜像
make pull

# 4. 启动生产环境
make prod

# 访问
# 前端：http://localhost
# 后端 API：http://localhost/api
```

## 📦 可用的镜像标签

GitHub Actions 会自动生成以下标签：

| 标签 | 说明 | 使用场景 |
|------|------|---------|
| `latest` | main/master 分支的最新版本 | 生产环境 |
| `dev` | dev 分支的最新版本 | 测试环境 |
| `sha-<commit>` | 特定提交的版本 | 回滚或特定版本 |
| `backend-v1.0.0` | 版本标签 | 稳定版本发布 |

### 使用特定标签

编辑 `.env` 文件：

```bash
# 使用开发版本
BACKEND_TAG=dev
FRONTEND_TAG=dev

# 使用特定提交
BACKEND_TAG=sha-abc1234
FRONTEND_TAG=sha-def5678

# 使用版本标签
BACKEND_TAG=backend-v1.0.0
FRONTEND_TAG=frontend-v1.0.0
```

然后运行：

```bash
make pull
make prod
```

## 🛠️ 常用命令

### Makefile 命令

```bash
# 开发环境
make dev          # 启动开发环境
make dev-build    # 重新构建并启动
make dev-down     # 停止开发环境
make dev-logs     # 查看日志

# 生产环境
make prod         # 启动生产环境
make pull         # 拉取最新镜像
make update       # 更新到最新版本

# 通用
make logs         # 查看所有日志
make ps           # 查看服务状态
make restart      # 重启服务
make down         # 停止服务

# 数据库
make db-backup    # 备份数据库
make db-restore FILE=backup.sql  # 恢复数据库
make db-shell     # 进入数据库命令行
```

### Docker Compose 命令

```bash
# 生产环境
docker-compose up -d              # 启动
docker-compose down               # 停止
docker-compose logs -f            # 查看日志
docker-compose pull               # 拉取最新镜像

# 开发环境
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f
```

## 🔄 更新流程

### 自动更新（推荐）

1. 在 GitHub 上合并代码到 main 分支
2. GitHub Actions 自动构建并推送新镜像
3. 在服务器上运行：

```bash
make update
```

### 手动更新

1. 构建本地镜像：

```bash
cd backend
docker build -t ghcr.io/stanleysun233/sms-server-backend:latest .

cd ../frontend
docker build -t ghcr.io/stanleysun233/sms-server-frontend:latest .
```

2. 推送到 GHCR：

```bash
docker push ghcr.io/stanleysun233/sms-server-backend:latest
docker push ghcr.io/stanleysun233/sms-server-frontend:latest
```

## 🔐 私有镜像访问

如果镜像设置为私有，需要先登录：

```bash
# 创建 GitHub Personal Access Token (PAT)
# https://github.com/settings/tokens
# 需要 read:packages 权限

# 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 然后正常使用
make pull
make prod
```

## 🐛 故障排查

### 镜像拉取失败

```bash
# 检查镜像是否存在
docker pull ghcr.io/stanleysun233/sms-server-backend:latest
docker pull ghcr.io/stanleysun233/sms-server-frontend:latest

# 检查 GitHub Actions 构建状态
# https://github.com/StanleySun233/sms-server/actions
```

### 服务启动失败

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查容器状态
docker-compose ps

# 查看容器详细信息
docker inspect sms-backend
docker inspect sms-frontend
```

### 数据库连接问题

```bash
# 检查 MySQL 是否健康
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# 查看数据库日志
docker-compose logs mysql

# 进入数据库
make db-shell
```

## 📝 发布版本

创建版本标签会触发特定版本的构建：

```bash
# 后端版本
git tag backend-v1.0.0
git push origin backend-v1.0.0

# 前端版本
git tag frontend-v1.0.0
git push origin frontend-v1.0.0

# 查看 Actions 构建进度
# https://github.com/StanleySun233/sms-server/actions
```

## 📚 更多信息

详细文档请查看：[docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

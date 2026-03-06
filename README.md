# SMS Server

## 环境要求

- Docker（或 Docker Compose）
- 复制 `.env.example` 为 `.env` 并填写配置

## 启动方式

### 方式一：Docker Compose（推荐）

在**项目根目录**执行：

```bash
cp .env.example .env
# 编辑 .env，设置 MYSQL_ROOT_PASSWORD、MYSQL_PASSWORD、REDIS_PASSWORD、JWT_SECRET 等
docker compose -f docker/docker-compose.yml up -d
```

启动服务：MySQL、Redis、Backend（镜像）、Frontend（镜像）、Nginx。Nginx 占用 80/443，前端可通过 http://localhost 访问，API 通过 Nginx 反向代理。

仅本地试用、不启用 Nginx 时，可只起应用与依赖：

```bash
docker compose -f docker/docker-compose.yml up -d mysql redis backend frontend
```

则前端：http://localhost:2888（或 `.env` 中 `FRONTEND_PORT`），API：http://localhost:8080/api。

**开发模式**（本地构建 backend/frontend 并挂载源码）：

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```

**生产覆盖**（使用 prod 配置与资源限制）：

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

停止并删除容器：

```bash
docker compose -f docker/docker-compose.yml down
```

### 方式二：Shell 脚本（Linux/Mac）

```bash
cp .env.example .env
# 编辑 .env
./run.sh
```

脚本会依次启动 MySQL → Redis → 拉取并运行 Backend/Frontend 镜像（不包含 Nginx）。前端：http://localhost:2888，API：http://localhost:8080/api，Swagger：http://localhost:8080/api/swagger-ui.html。

停止：`docker stop sms-frontend sms-backend sms-redis sms-mysql`

## 本地开发
需本地已运行 MySQL、Redis，且库已按 `database/init.sql` 初始化。
后端
```bat
run-backend-dev.bat
```
前端
```bat
cd frontend
npm install
npm run dev
```
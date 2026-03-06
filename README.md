# SMS Server

## 环境要求

- Docker
- （Linux/Mac）复制 `.env.example` 为 `.env` 并填写配置

## 一键启动（Docker）

```bash
cp .env.example .env
# 编辑 .env，至少设置 MYSQL_ROOT_PASSWORD、MYSQL_PASSWORD、JWT_SECRET 等
./run.sh
```

脚本会依次启动：MySQL → Redis → 拉取并运行 Backend 镜像 → 拉取并运行 Frontend 镜像。

默认访问：

- 前端：http://localhost:2888（或 `.env` 中 `FRONTEND_PORT`）
- 后端 API：http://localhost:8080/api
- Swagger：http://localhost:8080/api/swagger-ui.html

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
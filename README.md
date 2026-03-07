# SMS Server

需先复制 `.env.example` 为 `.env` 并按需修改。

## run.sh / run.bat（本地开发，前后端并行）

- 依赖：已运行 MySQL、Redis，且已按 `database/init.sql` 初始化。
- Windows：双击或执行 `run.bat`，会开两个窗口分别跑后端与前端。
- Linux/Mac：`./run.sh`，后端后台、前端前台，Ctrl+C 会一并退出。

## build.sh（Docker 一键）

- 依赖：Docker，且已配置 `.env`。
- Linux/Mac 在项目根目录执行：`./build.sh`。会启动 MySQL、Redis 并拉取并运行 Backend/Frontend 镜像（无 Nginx）。前端默认 http://localhost:2888，API http://localhost:8080/api。

## Docker Compose

提供 `docker/docker-compose.yml`、`docker-compose.dev.yml`、`docker-compose.prod.yml`，可从项目根目录用 `docker compose -f docker/docker-compose.yml up -d` 等方式启动。**当前 Docker Compose 方案未经验证，仅供参考。**

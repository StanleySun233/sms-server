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

## 短信状态与升级

已有数据库先备份，在停止旧后端后执行一次 `database/migrations/002_sms_reliability.sql`，再启动新版后端。全新数据库直接使用 `database/init.sql`。旧记录里的「已发送」仅表示服务端生成过下发响应，升级后归为「发送结果未知」。新后端可以接收旧固件的上报，外发须等新固件（短信协议 2）上报 SIM。

| 状态 | 含义 |
| --- | --- |
| 排队中 | 等待设备心跳，24 小时未下发则过期 |
| 等待设备回执 | 同一启动会话、同一尝试 ID 最多下发三次，五分钟无回执则标记结果未知 |
| 设备确认发送 | 模块报告发送成功，无法据此确认收件人已收到 |
| 失败 / 已过期 | 原 SIM 满足条件时可人工重试，每条短信总计最多三次尝试 |
| 结果未知 | 暂停重试，可由匹配的设备回执更新最终状态 |

Redis 的 `sms:progress:<deviceId>:<taskId>` 保存状态、更新时间、尝试 ID、截止时间、尝试次数和本轮下发次数。Redis 短锁减少并发请求，MySQL 行锁负责串行化状态变更。固件在调用短信模块前写入发送尝试，上报成功前保留结果。收件和未接来电按事件 ID 去重，固件掉线时暂存在闪存，容量耗尽时会写入诊断日志。

`device_onboard/` 用于本地烧录，包含设备令牌，已加入 Git 忽略规则。模拟固件回归测试可用 `lua tests/firmware_webhook.lua`，后端测试可用 `mvn -f backend/pom.xml test`。

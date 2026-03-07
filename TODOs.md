# TODOs - High Concurrency Optimization

## Priority-Ordered Optimization Items

- [x] **加消息队列削峰（Kafka）** — 已完成 2026-03-07
  - Webhook 请求先入队再异步消费写库
  - 目标：解耦请求处理，防止流量突刺压垮数据库
  - 预期收益：支持 10x+ 并发峰值

- [ ] **Redis 缓存热点数据**
  - 缓存设备状态、最近消息等高频读取数据
  - 目标：减少数据库查询压力
  - 预期收益：读取响应时间降低 80%+

- [ ] **数据库读写分离**
  - MySQL 主从复制 + dynamic-datasource 路由
  - 目标：分散读写负载
  - 预期收益：数据库吞吐量提升 2-3x

- [ ] **WebSocket 替换轮询**
  - 配合 Redis pub/sub 推送实时通知
  - 目标：降低无效请求，提升实时性
  - 预期收益：减少 90%+ 无效轮询请求

- [ ] **sms_message 表按时间分表**
  - 使用 MyBatis-Plus 分表插件
  - 目标：单表数据量控制，提升查询性能
  - 预期收益：历史数据查询性能保持稳定

---

**Created:** 2026-03-07
**Status:** First item completed

# VERSIONS.md

## Dependency Changes

| Package | Version | Purpose | Date | Notes |
|---|---|---|---|---|
| `spring-kafka` | managed by Spring Boot 3.1.11 | Kafka producer/consumer for webhook event queue | 2026-03-07 | Replaced `spring-boot-starter-amqp` (RabbitMQ) |
| `apache/kafka` (Docker) | 3.7.0 | KRaft-mode Kafka broker | 2026-03-07 | Added to docker-compose.yml, no Zookeeper needed |

## Completed TODOs

### 2026-03-07 — Kafka 消息队列削峰
- **Goal:** Decouple webhook heartbeat processing from synchronous DB writes
- **Approach:** Replaced RabbitMQ with Kafka; webhook events published to Kafka topics and consumed asynchronously
- **Changed files:**
  - `backend/pom.xml` — swapped `spring-boot-starter-amqp` → `spring-kafka`
  - `backend/src/main/java/com/smsserver/config/KafkaConfig.java` — new topic definitions
  - `backend/src/main/java/com/smsserver/config/RabbitMQConfig.java` — deleted
  - `backend/src/main/java/com/smsserver/service/WebhookEventProducer.java` — rewritten to use KafkaTemplate
  - `backend/src/main/java/com/smsserver/service/WebhookEventConsumer.java` — rewritten to use @KafkaListener
  - `backend/src/main/java/com/smsserver/service/WebhookService.java` — heartbeat now publishes events asynchronously
  - `backend/src/main/resources/application.yml` — added shared Kafka config
  - `backend/src/main/resources/application-dev.yml` — added dev Kafka bootstrap server
  - `backend/src/main/resources/application-prod.yml` — added prod Kafka bootstrap server
  - `docker/docker-compose.yml` — added Kafka service, backend dependency, env var, and volume
- **Trade-off:** Message and missed-call persistence is eventually consistent, which is acceptable for webhook burst smoothing

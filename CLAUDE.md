# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack SMS management system with 4G terminal device (DT718) integration. Users manage SMS messages and missed calls through a web UI; devices push data via webhooks.

- **Backend:** Spring Boot 3.1.11, Java 18, MyBatis-Plus, MySQL 8, Redis, Kafka, JWT auth
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS, Element Plus, next-intl
- **Device:** Lua scripts running on 4G terminal hardware
- **Deployment:** Docker, GitHub Actions CI/CD, ghcr.io registry

## Build & Run Commands

### Backend (Maven, from `backend/`)
```bash
./mvnw clean package -DskipTests     # Build JAR
./mvnw spring-boot:run               # Run dev server (port 8080, context /api)
./mvnw test                           # Run all tests
./mvnw test -Dtest=ClassName          # Run single test class
./mvnw test -Dtest=ClassName#method   # Run single test method
```

### Frontend (npm, from `frontend/`)
```bash
npm install                           # Install dependencies
npm run dev                           # Dev server (port 3000)
npm run build                         # Production build (standalone output)
npm run lint                          # ESLint (next/core-web-vitals)
npm run type-check                    # TypeScript strict check
```

### Docker (from project root)
```bash
bash build.sh                         # One-click deployment (MySQL + Redis + Backend + Frontend)
```

### Docker Compose
```bash
docker compose -f docker/docker-compose.yml up -d
```

## Architecture

### Backend (`backend/src/main/java/com/smsserver/`)
- `controller/` — REST endpoints (devices, messages, users, webhooks)
- `service/` — Business logic layer
- `mapper/` — MyBatis-Plus data access (no raw SQL, uses mapper interfaces)
- `entity/` — Database entities mapped to MySQL tables
- `dto/` — Request/response objects (WebhookRequest, SendMessageRequest, etc.)
- `config/` — Spring Security, JWT, Redis, Swagger configuration

Key backend patterns:
- JWT authentication: 24h access token, 7-day refresh token
- Webhook token validation for device communication
- Spring profiles: `dev` (H2/relaxed), `prod` (MySQL/strict) — set via `SPRING_PROFILE` env var
- API docs available at `/api/swagger-ui.html`
- Health check at `/api/actuator/health`

### Frontend (`frontend/src/`)
- `app/` — Next.js App Router pages (device management, conversations, missed calls, settings)
- `components/` — Reusable React components
- `contexts/` — Auth context (JWT), Locale context (i18n)
- `i18n/` — Internationalization with next-intl
- `types/` — Shared TypeScript type definitions

### Device (`device/`)
- `config.lua` — All device settings (server URL, webhook token, notification channels)
- `main.lua` — Entry point; orchestrates SMS send/receive, heartbeats, missed calls
- `util_*.lua` — Utility modules (webhook, notify, mobile, location)
- Supports notification channels: Feishu, Telegram, Bark, DingTalk, WebUI

### Database (`database/init.sql`)
Key tables: `users`, `devices`, `sms_message`, `pending_sms`, `missed_call`, `sim_change_log`, `user_preferences`
- All tables use `BIGINT` PKs, `DATETIME(3)` timestamps in UTC, `utf8mb4` charset

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `SPRING_PROFILE` | Active Spring profile | `dev` |
| `BACKEND_PORT` | Backend port | `8080` |
| `FRONTEND_PORT` | Frontend port | `3000` |
| `JWT_SECRET` | JWT signing key (must be 512+ bits) | — |
| `MYSQL_HOST/PORT/DATABASE/USERNAME/PASSWORD` | DB connection | — |
| `REDIS_HOST/PORT/PASSWORD` | Redis connection | — |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker address | `localhost:9092` |
| `NEXT_PUBLIC_API_URL` | Frontend → Backend API URL | — |

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `backend-docker-build.yml` — Builds backend Docker image on backend file changes
- `frontend-docker-build.yml` — Builds frontend Docker image on frontend file changes
- Triggers: push to `main`/`master`/`dev`, PRs to `main`/`master`, version tags (`v*`, `backend-v*`, `frontend-v*`)
- Images pushed to `ghcr.io`

## Conventions

- Backend uses Lombok for boilerplate reduction (getters, setters, builders)
- All timestamps stored in UTC
- Webhook tokens are 16-character strings for device authentication
- Frontend uses TypeScript strict mode — all new code must be fully typed
- README and UI support Chinese; code comments in English

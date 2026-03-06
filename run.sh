#!/bin/bash
cd "$(dirname "$0")"
export MYSQL_HOST=${MYSQL_HOST:-localhost}
export MYSQL_DATABASE=${MYSQL_DATABASE:-sms_server}
export MYSQL_USER=${MYSQL_USER:-smsadmin}
export MYSQL_PASSWORD=${MYSQL_PASSWORD:-your_secure_password_here}
export MYSQL_PORT=${MYSQL_PORT:-3306}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PASSWORD=${REDIS_PASSWORD:-}
export REDIS_PORT=${REDIS_PORT:-6379}
export BACKEND_PORT=${BACKEND_PORT:-8080}
export JWT_SECRET=${JWT_SECRET:-your_jwt_secret_key_here_minimum_32_characters_recommended}
export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-dev}
[ -f .env ] && export $(grep -v '^#' .env | xargs)

mvn -f backend/pom.xml spring-boot:run &
BACKEND_PID=$!
trap "kill $BACKEND_PID 2>/dev/null" EXIT
cd frontend && npm run dev

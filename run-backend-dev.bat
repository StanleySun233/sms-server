@echo off
set MYSQL_HOST=45.207.211.30
set MYSQL_DATABASE=sms_server
set MYSQL_USER=smsadmin
set MYSQL_PASSWORD=Password@sms
set MYSQL_PORT=3306
set REDIS_HOST=45.207.211.30
set REDIS_PASSWORD=Password@redis
set REDIS_PORT=6379
set BACKEND_PORT=8080
set JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters_recommended
set SPRING_PROFILE=dev
set SPRING_PROFILES_ACTIVE=dev
cd /d "%~dp0"
mvn -f backend\pom.xml spring-boot:run

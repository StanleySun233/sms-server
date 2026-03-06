@echo off
set MYSQL_HOST=localhost
set MYSQL_DATABASE=sms_server
set MYSQL_USER=smsadmin
set MYSQL_PASSWORD=your_secure_password_here
set MYSQL_PORT=3306
set REDIS_HOST=localhost
set REDIS_PASSWORD=
set REDIS_PORT=6379
set BACKEND_PORT=8080
set JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters_recommended
set SPRING_PROFILE=dev
set SPRING_PROFILES_ACTIVE=dev
cd /d "%~dp0"
mvn -f backend\pom.xml spring-boot:run

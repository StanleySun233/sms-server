# SMS Server - Troubleshooting Guide

## Common Issues and Solutions

---

## Docker & Services

### Issue: Services won't start

**Symptoms**:
```bash
docker-compose up
# Services exit immediately or show errors
```

**Solutions**:
1. Check Docker logs:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs redis
```

2. Verify `.env` file exists and has correct values:
```bash
cat .env
```

3. Check port conflicts:
```bash
# Windows
netstat -ano | findstr "3306 6379 8080 3000 80"

# Linux/Mac
lsof -i :3306 -i :6379 -i :8080 -i :3000 -i :80
```

4. Rebuild containers:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

### Issue: MySQL won't initialize

**Symptoms**:
- Database schema not created
- Tables missing
- Connection refused errors

**Solutions**:
1. Check MySQL logs:
```bash
docker-compose logs mysql
```

2. Verify init script:
```bash
docker exec sms-mysql ls -la /docker-entrypoint-initdb.d/
```

3. Manually run init script:
```bash
docker exec -i sms-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} < database/init.sql
```

4. Remove volume and restart (⚠️ DATA LOSS):
```bash
docker-compose down -v
docker volume rm sms-server_mysql-data
docker-compose up -d mysql
```

---

### Issue: Redis connection failed

**Symptoms**:
- Backend can't connect to Redis
- "Connection refused" errors

**Solutions**:
1. Check Redis is running:
```bash
docker-compose ps redis
```

2. Test Redis connection:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} ping
# Should return: PONG
```

3. Check Redis password in backend config matches `.env`:
```bash
# In application-dev.yml
spring:
  data:
    redis:
      password: ${REDIS_PASSWORD}
```

---

## Backend Issues

### Issue: Backend won't compile

**Symptoms**:
- Maven build fails
- Missing dependencies
- Compilation errors

**Solutions**:
1. Clean Maven cache:
```bash
cd backend
./mvnw clean
```

2. Force update dependencies:
```bash
./mvnw dependency:purge-local-repository
./mvnw clean install
```

3. Check Java version:
```bash
java -version
# Should be 18 or higher
```

4. Verify pom.xml is valid:
```bash
./mvnw validate
```

---

### Issue: Backend starts but crashes

**Symptoms**:
- Application starts then exits
- Database connection errors
- Bean creation errors

**Solutions**:
1. Check application logs:
```bash
docker-compose logs backend -f
```

2. Verify environment variables:
```bash
docker exec sms-backend env | grep -E "MYSQL|REDIS"
```

3. Test database connection:
```bash
docker exec sms-backend ping mysql -c 1
docker exec sms-backend ping redis -c 1
```

4. Check for port binding issues:
```bash
# Inside container
docker exec sms-backend netstat -tuln | grep 8080
```

---

### Issue: 401 Unauthorized on protected endpoints

**Symptoms**:
- Login works but other endpoints return 401
- Session not persisting

**Solutions**:
1. Check session cookie is set:
```bash
# In browser DevTools > Application > Cookies
# Should see SESSION_ID cookie
```

2. Verify Redis session exists:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} KEYS "session:*"
```

3. Check cookie domain/path:
```java
// In AuthController
cookie.setPath("/");  // Must match request path
cookie.setHttpOnly(true);
```

4. Verify Security configuration allows session:
```java
// In SecurityConfig
http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
```

---

### Issue: Webhook returns 404

**Symptoms**:
- POST /api/webhook/{token} returns 404
- Device can't send heartbeats

**Solutions**:
1. Verify webhook token in database:
```sql
SELECT id, alias, webhook_token FROM devices;
```

2. Check Security config allows webhook:
```java
.requestMatchers("/api/webhook/**").permitAll()
```

3. Test with curl:
```bash
curl -X POST http://localhost/api/webhook/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"device_info":{"phone_number":"1234567890"}}'
```

4. Check nginx routing:
```bash
# In nginx.conf
location /api/webhook {
    proxy_pass http://backend;
}
```

---

## Frontend Issues

### Issue: Frontend won't compile

**Symptoms**:
- npm install fails
- TypeScript errors
- Build fails

**Solutions**:
1. Clear npm cache:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

2. Check Node version:
```bash
node -v
# Should be 20 or higher
```

3. Verify package.json is valid:
```bash
npm run build
```

4. Check for TypeScript errors:
```bash
npm run type-check
```

---

### Issue: Frontend can't reach backend

**Symptoms**:
- API calls fail with connection errors
- CORS errors in browser console
- Network errors

**Solutions**:
1. Check NEXT_PUBLIC_API_URL:
```bash
# In .env
NEXT_PUBLIC_API_URL=http://localhost/api
```

2. Verify CORS configuration in backend:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost", "http://localhost:3000"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    configuration.setAllowCredentials(true);
    // ...
}
```

3. Check nginx proxy:
```bash
curl http://localhost/api/auth/me
```

4. Test direct backend access:
```bash
curl http://localhost:8080/api/auth/me
```

---

### Issue: Styles not loading

**Symptoms**:
- Plain HTML with no styles
- Tailwind classes not working
- Glassmorphism not appearing

**Solutions**:
1. Verify Tailwind config:
```bash
# Check tailwind.config.js exists
# Check postcss.config.js exists
```

2. Rebuild with cleared cache:
```bash
rm -rf .next
npm run build
npm run dev
```

3. Check globals.css is imported:
```typescript
// In app/layout.tsx
import '@/styles/globals.css'
```

4. Verify Tailwind directives in globals.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Nginx Issues

### Issue: 502 Bad Gateway

**Symptoms**:
- Nginx shows 502 error
- Can't access frontend or backend

**Solutions**:
1. Check upstream services are running:
```bash
docker-compose ps backend frontend
```

2. Verify service names in nginx.conf:
```nginx
upstream backend {
    server backend:8080;  # Must match service name in docker-compose
}
```

3. Check nginx logs:
```bash
docker-compose logs nginx
```

4. Test upstream directly:
```bash
docker exec sms-nginx curl http://backend:8080/actuator/health
docker exec sms-nginx curl http://frontend:3000
```

---

### Issue: Rate limiting too aggressive

**Symptoms**:
- 429 Too Many Requests
- Legitimate requests blocked

**Solutions**:
1. Adjust rate limits in nginx.conf:
```nginx
limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=5r/s;
limit_req zone=webhook_limit burst=10 nodelay;
```

2. Reload nginx:
```bash
docker-compose exec nginx nginx -s reload
```

3. Check nginx error log:
```bash
docker-compose exec nginx cat /var/log/nginx/error.log
```

---

## Database Issues

### Issue: Connection pool exhausted

**Symptoms**:
- "Connection pool exhausted" errors
- Slow database queries
- Backend hangs

**Solutions**:
1. Increase pool size in application.yml:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

2. Check for unclosed connections:
```sql
SHOW PROCESSLIST;
```

3. Restart backend to reset connections:
```bash
docker-compose restart backend
```

---

### Issue: Slow queries

**Symptoms**:
- API endpoints slow
- Database CPU high
- Timeouts

**Solutions**:
1. Enable slow query log:
```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

2. Check slow queries:
```bash
docker exec sms-mysql cat /var/log/mysql/slow.log
```

3. Add missing indexes:
```sql
-- Example: if queries on sms_message are slow
EXPLAIN SELECT * FROM sms_message WHERE device_id = 1 AND phone_number = '123';

-- Add index if needed
CREATE INDEX idx_device_phone ON sms_message(device_id, phone_number);
```

4. Analyze table statistics:
```sql
ANALYZE TABLE sms_message;
```

---

## Redis Issues

### Issue: Out of memory

**Symptoms**:
- Redis OOM errors
- Keys not being set
- Eviction errors

**Solutions**:
1. Check memory usage:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} INFO memory
```

2. Increase maxmemory:
```bash
# In docker-compose.yml
command: redis-server --maxmemory 1gb
```

3. Check eviction policy:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} CONFIG GET maxmemory-policy
```

4. Clear old keys:
```bash
# Delete old sessions
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} KEYS "session:*" | xargs redis-cli -a ${REDIS_PASSWORD} DEL
```

---

### Issue: Keys expiring too quickly

**Symptoms**:
- Sessions expire unexpectedly
- Data disappears

**Solutions**:
1. Check TTL on keys:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} TTL session:YOUR_SESSION_ID
```

2. Verify expiry time in code:
```java
redisTemplate.opsForValue().set(key, value, 7 * 24 * 60 * 60, TimeUnit.SECONDS);
```

3. Check Redis time:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} TIME
```

---

## Authentication Issues

### Issue: Can't login

**Symptoms**:
- Login always fails
- "Invalid username or password" even with correct credentials

**Solutions**:
1. Check user exists:
```sql
SELECT id, username, email FROM users WHERE username = 'your_username';
```

2. Verify password hash:
```java
// In a test endpoint
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
boolean matches = encoder.matches("plainPassword", user.getPasswordHash());
```

3. Check logs for errors:
```bash
docker-compose logs backend | grep -i "auth\|login"
```

4. Test with curl:
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' \
  -v
```

---

## Device Issues

### Issue: Device status stuck offline

**Symptoms**:
- Device shows offline even though sending heartbeats
- last_heartbeat_at not updating

**Solutions**:
1. Check heartbeat endpoint is working:
```bash
curl -X POST http://localhost/api/webhook/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"device_info":{"phone_number":"123"}}'
```

2. Verify last_heartbeat_at in database:
```sql
SELECT id, alias, last_heartbeat_at, TIMESTAMPDIFF(MINUTE, last_heartbeat_at, NOW()) as minutes_ago
FROM devices;
```

3. Check status calculation logic:
```java
// Should be:
// < 3 min = online
// 3-5 min = warning
// > 5 min = offline
```

4. Clear device status cache:
```bash
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} DEL device:status:YOUR_DEVICE_ID
```

---

## Performance Issues

### Issue: High CPU usage

**Symptoms**:
- Backend container using high CPU
- Slow response times

**Solutions**:
1. Check running queries:
```sql
SHOW FULL PROCESSLIST;
```

2. Profile application:
```bash
# Add JVM flags in docker-compose.yml
JAVA_OPTS: "-Xms512m -Xmx1024m -XX:+UseG1GC"
```

3. Check for infinite loops in logs
4. Add caching for frequently accessed data

---

### Issue: High memory usage

**Symptoms**:
- Out of memory errors
- Container restarts

**Solutions**:
1. Check memory usage:
```bash
docker stats sms-backend
```

2. Adjust JVM heap:
```yaml
environment:
  JAVA_OPTS: "-Xms512m -Xmx1024m"
```

3. Check for memory leaks:
- Unclosed database connections
- Growing collections
- Cached objects not evicted

---

## Production Issues

### Issue: SSL certificate errors

**Symptoms**:
- HTTPS not working
- Certificate warnings

**Solutions**:
1. Check certificate files:
```bash
sudo ls -la /etc/letsencrypt/live/sms.sjsun.top/
```

2. Test certificate:
```bash
openssl x509 -in /etc/letsencrypt/live/sms.sjsun.top/fullchain.pem -text -noout
```

3. Renew certificate:
```bash
sudo certbot renew
docker-compose restart nginx
```

---

### Issue: Backup fails

**Symptoms**:
- Backup script errors
- Corrupted backups

**Solutions**:
1. Test manual backup:
```bash
docker exec sms-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} sms_server > test-backup.sql
```

2. Check backup directory permissions:
```bash
ls -la /backups
```

3. Verify backup cron job:
```bash
sudo crontab -l
```

---

## Debugging Commands

### View all logs:
```bash
docker-compose logs -f
```

### View specific service:
```bash
docker-compose logs -f backend
```

### Execute command in container:
```bash
docker exec -it sms-backend bash
```

### Check container health:
```bash
docker ps
docker-compose ps
```

### Restart specific service:
```bash
docker-compose restart backend
```

### View environment variables:
```bash
docker exec sms-backend env
```

### Check network connectivity:
```bash
docker exec sms-backend ping mysql
docker exec sms-backend ping redis
```

---

## Getting Help

1. Check logs first: `docker-compose logs`
2. Search error message in documentation
3. Check GitHub issues
4. Review implementation guides in `/docs/implementation/`
5. Verify configuration matches examples

---

## Prevention Tips

1. **Always** check logs when something doesn't work
2. **Test** each component in isolation before integration
3. **Verify** environment variables are set correctly
4. **Monitor** resource usage (CPU, memory, disk)
5. **Keep** Docker images updated
6. **Backup** database regularly
7. **Document** any custom configurations
8. **Test** in development before deploying to production

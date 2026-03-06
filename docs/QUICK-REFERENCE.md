# SMS Server - Quick Reference Card

## 🚀 Quick Start Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down
```

### Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run           # Run locally
./mvnw clean install             # Build
./mvnw test                      # Run tests
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev                      # Development server
npm run build                    # Production build
npm run start                    # Start production server
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns session cookie)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Devices
- `GET /api/devices` - List user's devices
- `POST /api/devices` - Create device (generates webhook token)
- `GET /api/devices/:id` - Get device details
- `PUT /api/devices/:id` - Update device alias
- `DELETE /api/devices/:id` - Delete device (cascade)

### Webhook (Public)
- `POST /api/webhook/:token` - Device heartbeat endpoint

### SMS Messages
- `GET /api/devices/:id/conversations` - List conversations
- `GET /api/devices/:id/messages?phone=xxx` - Get conversation history
- `POST /api/devices/:id/messages` - Send SMS
- `PUT /api/messages/read` - Mark messages as read
- `GET /api/devices/:id/messages/search` - Search messages
- `GET /api/devices/:id/messages/export` - Export to CSV

### Missed Calls
- `GET /api/devices/:id/missed-calls` - List missed calls
- `GET /api/devices/:id/calls?phone=xxx` - Get call history
- `PUT /api/calls/read` - Mark calls as read

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## 🗄️ Database Quick Access

### MySQL
```bash
# Connect to MySQL
docker exec -it sms-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD}

# Run query
docker exec sms-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} sms_server -e "SELECT * FROM users;"

# Backup database
docker exec sms-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} sms_server > backup.sql

# Restore database
docker exec -i sms-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} sms_server < backup.sql
```

### Redis
```bash
# Connect to Redis
docker exec -it sms-redis redis-cli -a ${REDIS_PASSWORD}

# Common commands
KEYS *                          # List all keys
GET session:xxx                 # Get session
LRANGE task:sms:1 0 -1         # List SMS tasks
DEL key                        # Delete key
FLUSHALL                       # Clear all (⚠️ dangerous)
```

---

## 🎨 UI Theme

### Colors
```css
--bg-dark: rgb(45, 45, 45);
--primary: #c2905e;           /* Gold-brown */
--online: #10b981;            /* Green */
--warning: #f59e0b;           /* Yellow */
--offline: #ef4444;           /* Red */
```

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

### Tailwind Classes
```
.glass-card         /* Glassmorphic card */
.btn-primary        /* Primary button */
.btn-secondary      /* Secondary button */
```

---

## 📦 Project Structure

```
sms-server/
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/smsserver/
│   │   ├── config/            # Configuration classes
│   │   ├── controller/        # REST controllers
│   │   ├── service/           # Business logic
│   │   ├── mapper/            # MyBatis mappers
│   │   ├── entity/            # Database entities
│   │   └── dto/               # Data transfer objects
│   └── src/main/resources/
│       ├── application.yml     # Main config
│       ├── application-dev.yml # Dev config
│       └── application-prod.yml# Prod config
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities
│   │   └── styles/            # Global CSS
│   └── public/                # Static assets
│
├── database/
│   └── init.sql               # Database schema
│
├── docker/
│   └── nginx/
│       └── nginx.conf         # Nginx config
│
├── docs/                      # Documentation
│   ├── implementation/        # Implementation guides
│   ├── PROGRESS.md           # Progress tracker
│   └── TROUBLESHOOTING.md    # Troubleshooting guide
│
├── docker-compose.yml         # Docker orchestration
├── docker-compose.prod.yml    # Production config
└── .env                       # Environment variables
```

---

## 🔐 Security Checklist

- [ ] Passwords hashed with BCrypt (strength 10)
- [ ] Sessions stored in Redis with 7-day TTL
- [ ] HTTP-only cookies for session management
- [ ] CORS configured for allowed origins
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting on webhook (2 req/s) and API (10 req/s)
- [ ] HTTPS enabled in production
- [ ] Environment variables not committed to git
- [ ] User data isolation (check user_id on all queries)

---

## 🐛 Common Issues

### Service won't start
```bash
docker-compose logs [service-name]
docker-compose restart [service-name]
```

### Database connection failed
```bash
# Check MySQL is running
docker-compose ps mysql
# Test connection
docker exec sms-mysql mysqladmin ping -h localhost -uroot -p
```

### Redis connection failed
```bash
# Check Redis is running
docker-compose ps redis
# Test connection
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} ping
```

### Frontend can't reach backend
```bash
# Check CORS configuration
# Check NEXT_PUBLIC_API_URL in .env
# Check nginx proxy is working
curl http://localhost/api/auth/me
```

---

## 📊 Device Status Logic

```
Online:  last_heartbeat_at < 3 minutes ago
Warning: last_heartbeat_at 3-5 minutes ago
Offline: last_heartbeat_at > 5 minutes ago
```

---

## 🔄 Webhook Flow

```
4G Device (every 60s)
    ↓
POST /api/webhook/{token}
    ↓
1. Validate token
2. Update last_heartbeat_at
3. Detect SIM changes
4. Save new messages/calls
5. Fetch pending SMS from Redis
6. Return commands
    ↓
Device executes commands
```

---

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git add .
git commit -m "feat: add feature description"

# Push to remote
git push origin feature/feature-name

# Commit message types:
feat:     New feature
fix:      Bug fix
refactor: Code refactoring
docs:     Documentation
style:    Formatting
test:     Tests
chore:    Dependencies, configs
```

---

## 🧪 Testing

### Manual API Test
```bash
# Register user
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@example.com"}'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' \
  -c cookies.txt

# Get current user (with session)
curl http://localhost/api/auth/me -b cookies.txt

# Test webhook
curl -X POST http://localhost/api/webhook/your-token-here \
  -H "Content-Type: application/json" \
  -d '{"device_info":{"phone_number":"1234567890"},"new_messages":[],"missed_calls":[]}'
```

---

## 📚 Documentation Links

- [README.md](../README.md) - Project overview
- [Authentication Guide](docs/implementation/authentication-guide.md)
- [Webhook Guide](docs/implementation/webhook-guide.md)
- [Code Patterns](docs/implementation/code-patterns.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Progress Tracker](docs/PROGRESS.md)

---

## 🎯 Key Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (passwords, secrets) |
| `docker-compose.yml` | Service orchestration |
| `backend/src/main/resources/application.yml` | Backend config |
| `frontend/next.config.js` | Frontend config |
| `docker/nginx/nginx.conf` | Reverse proxy config |
| `database/init.sql` | Database schema |

---

## 💡 Pro Tips

1. **Always check logs first** when debugging
2. **Use Redis caching** for frequently accessed data
3. **Add database indexes** on foreign keys and filter columns
4. **Test with curl** before testing in UI
5. **Keep sessions under 7 days** to prevent stale data
6. **Monitor webhook endpoint** - it's the most critical
7. **Use batch operations** for multiple inserts
8. **Cache device status** to reduce database load
9. **Implement pagination** on all list endpoints
10. **Log important business events** at INFO level

---

## 🚦 Service Health Checks

```bash
# Backend health
curl http://localhost/api/actuator/health

# Frontend health
curl http://localhost:3000

# MySQL health
docker exec sms-mysql mysqladmin ping -h localhost

# Redis health
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} ping

# Nginx health
curl http://localhost/health
```

---

## 📞 Support

- GitHub Issues: Create an issue for bugs or feature requests
- Documentation: Check `/docs` folder for detailed guides
- Logs: Always include relevant logs when reporting issues

---

**Version**: 1.0.0
**Last Updated**: 2026-03-06
**Team**: SMS Server Implementation Team

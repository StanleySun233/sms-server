# SMS Server - 4G Device Management System

A web-based SMS management system for small teams to manage multiple 4G terminal devices. Features SMS sending/receiving, missed call tracking, device heartbeat monitoring, and a WeChat-like message interface.

## 🌟 Features

- **Multi-Device Management**: Manage multiple 4G terminal devices from a single interface
- **Real-time Monitoring**: Device status tracking (online/warning/offline) based on heartbeat
- **SMS Conversations**: WeChat-like message interface with conversation grouping
- **Missed Call Tracking**: Track and manage missed calls from devices
- **SIM Card Change Detection**: Automatic detection and logging of SIM card changes
- **Message Search & Export**: Full-text search and CSV export functionality
- **User Isolation**: Complete data isolation between users
- **Secure Authentication**: Session-based authentication with Redis

## 🏗️ Architecture

- **Backend**: Spring Boot 3 + MyBatis-Plus + Spring Security
- **Frontend**: Next.js 14 + Element Plus + Tailwind CSS
- **Database**: MySQL 8.0
- **Cache/Queue**: Redis 7
- **Reverse Proxy**: Nginx
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
- JDK 18+ (for local development)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sms-server
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and set secure passwords
```

**Important**: Generate secure passwords for production:
```bash
# Generate random passwords
openssl rand -base64 32
```

### 3. Start Services

**Development Mode:**
```bash
docker-compose up -d
```

**Production Mode:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Access the Application

- **Frontend**: http://localhost (or https://sms.sjsun.top in production)
- **Backend API**: http://localhost/api
- **API Documentation**: http://localhost/apidoc

### 5. Initial Setup

1. Register a new user account
2. Login to the dashboard
3. Create a new device (you'll receive a webhook URL)
4. Configure your 4G device to send heartbeats to the webhook URL

## 📡 Webhook Integration

Your 4G devices should send POST requests to the webhook endpoint every 60 seconds:

**Endpoint**: `POST /api/webhook/{webhook_token}`

**Request Format**:
```json
{
  "device_info": {
    "phone_number": "1234567890",
    "imei": "123456789012345",
    "signal_strength": 85,
    "battery_level": 75
  },
  "new_messages": [
    {
      "phone": "0987654321",
      "content": "Hello World",
      "timestamp": "2026-03-06T12:00:00Z"
    }
  ],
  "missed_calls": [
    {
      "phone": "0987654321",
      "timestamp": "2026-03-06T11:55:00Z"
    }
  ]
}
```

**Response Format**:
```json
{
  "commands": [
    {
      "type": "send_sms",
      "task_id": "123",
      "phone": "0987654321",
      "content": "Reply message"
    }
  ]
}
```

## 🗂️ Project Structure

```
sms-server/
├── backend/                 # Spring Boot backend
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/smsserver/
│   │       │       ├── config/      # Configuration classes
│   │       │       ├── controller/  # REST controllers
│   │       │       ├── service/     # Business logic
│   │       │       ├── mapper/      # MyBatis mappers
│   │       │       ├── entity/      # Database entities
│   │       │       └── dto/         # Data transfer objects
│   │       └── resources/
│   │           ├── application.yml
│   │           ├── application-dev.yml
│   │           └── application-prod.yml
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities and API client
│   │   └── styles/         # Global styles
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── database/
│   └── init.sql            # Database schema
├── docker/
│   └── nginx/
│       └── nginx.conf      # Nginx configuration
├── docs/                   # Documentation
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

## 🔧 Development

### Backend Development

```bash
cd backend
mvn spring-boot:run
```

The backend will start on http://localhost:8080

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:3000

## 📊 Database Management

### Backup Database

```bash
docker exec sms-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} sms_server > backup.sql
```

### Restore Database

```bash
docker exec -i sms-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} sms_server < backup.sql
```

### Access MySQL

```bash
docker exec -it sms-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD}
```

### Access Redis

```bash
docker exec -it sms-redis redis-cli -a ${REDIS_PASSWORD}
```

## 🔒 Security

- All passwords are hashed with BCrypt (strength 10)
- Sessions stored in Redis with 7-day expiry
- HTTPS required in production
- Rate limiting on webhook and API endpoints
- SQL injection prevention via parameterized queries
- XSS prevention in frontend
- CORS configuration for API access

## 🌐 Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d sms.sjsun.top

# Uncomment HTTPS server block in docker/nginx/nginx.conf
```

### 3. Deploy

```bash
# Clone repository
git clone <repository-url>
cd sms-server

# Configure environment
cp .env.example .env
nano .env  # Set production passwords

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f
```

### 4. Setup Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-sms-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec sms-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} sms_server > /backups/sms_server_$DATE.sql
find /backups -name "sms_server_*.sql" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-sms-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-sms-db.sh
```

## 📈 Performance Tuning

### Device Status Calculation
- Online: Last heartbeat < 3 minutes ago
- Warning: Last heartbeat 3-5 minutes ago
- Offline: Last heartbeat > 5 minutes ago

### Recommended Limits
- Maximum devices per user: 50
- Heartbeat interval: 60 seconds
- Message history: Unlimited (with pagination)
- Session timeout: 7 days

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Restart services
docker-compose restart
```

### Database connection issues

```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL health
docker exec sms-mysql mysqladmin ping -h localhost -u root -p
```

### Redis connection issues

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker exec sms-redis redis-cli -a ${REDIS_PASSWORD} ping
```

## 📝 API Documentation

Once the backend is running, access the interactive API documentation at:

**Swagger UI**: http://localhost/apidoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Email: support@example.com

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] SMS templates
- [ ] Scheduled SMS sending
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Webhook retry mechanism
- [ ] Message encryption
- [ ] Group messaging

---

**Made with ❤️ for small teams managing 4G devices**

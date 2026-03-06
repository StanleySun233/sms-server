#!/bin/bash

set -e

# Use sudo for docker commands
DOCKER="sudo docker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables from .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    exit 1
fi

echo -e "${GREEN}Loading configuration from .env file...${NC}"
export $(grep -v '^#' .env | xargs)

# Set default values if not provided
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword}
MYSQL_DATABASE=${MYSQL_DATABASE:-sms_server}
MYSQL_USER=${MYSQL_USER:-sms_user}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-sms_password}
MYSQL_PORT=${MYSQL_PORT:-3306}
REDIS_PASSWORD=${REDIS_PASSWORD:-}
REDIS_PORT=${REDIS_PORT:-6379}
BACKEND_PORT=${BACKEND_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8080/api}
NODE_ENV=${NODE_ENV:-production}
JWT_SECRET=${JWT_SECRET:-changeme-this-is-a-very-long-secret-key-for-jwt-token-generation}
SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-dev}

NETWORK_NAME="sms-network"

echo -e "${GREEN}=== SMS Server Docker Startup Script ===${NC}"
echo ""

# Function to check if container is running
is_running() {
    [ "$($DOCKER ps -q -f name=$1)" ]
}

# Function to check if container exists (running or stopped)
container_exists() {
    [ "$($DOCKER ps -aq -f name=$1)" ]
}

# Create network if it doesn't exist
if [ ! "$($DOCKER network ls -q -f name=$NETWORK_NAME)" ]; then
    echo -e "${YELLOW}Creating Docker network: $NETWORK_NAME${NC}"
    $DOCKER network create $NETWORK_NAME
else
    echo -e "${GREEN}Docker network $NETWORK_NAME already exists${NC}"
fi

# Start MySQL
echo ""
echo -e "${YELLOW}[1/5] Starting MySQL...${NC}"
if is_running "sms-mysql"; then
    echo -e "${GREEN}MySQL is already running${NC}"
elif container_exists "sms-mysql"; then
    echo "Starting existing MySQL container..."
    $DOCKER start sms-mysql
else
    echo "Creating and starting new MySQL container..."
    $DOCKER run -d \
        --name sms-mysql \
        --network $NETWORK_NAME \
        -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
        -e MYSQL_DATABASE="$MYSQL_DATABASE" \
        -e MYSQL_USER="$MYSQL_USER" \
        -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
        -p $MYSQL_PORT:3306 \
        -v sms-mysql-data:/var/lib/mysql \
        --restart unless-stopped \
        mysql:8.0

    echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
    sleep 15
fi

# Start Redis
echo ""
echo -e "${YELLOW}[2/5] Starting Redis...${NC}"
if is_running "sms-redis"; then
    echo -e "${GREEN}Redis is already running${NC}"
elif container_exists "sms-redis"; then
    echo "Starting existing Redis container..."
    $DOCKER start sms-redis
else
    echo "Creating and starting new Redis container..."
    if [ -n "$REDIS_PASSWORD" ]; then
        $DOCKER run -d \
            --name sms-redis \
            --network $NETWORK_NAME \
            -p $REDIS_PORT:6379 \
            --restart unless-stopped \
            redis:7-alpine redis-server --requirepass "$REDIS_PASSWORD"
    else
        $DOCKER run -d \
            --name sms-redis \
            --network $NETWORK_NAME \
            -p $REDIS_PORT:6379 \
            --restart unless-stopped \
            redis:7-alpine
    fi
fi

# Pull backend image from GitHub Container Registry
echo ""
echo -e "${YELLOW}[3/5] Pulling backend image...${NC}"
BACKEND_TAG=${BACKEND_TAG:-latest}
BACKEND_IMAGE="ghcr.io/stanleysun233/sms-server-backend:${BACKEND_TAG}"

echo "Pulling image: $BACKEND_IMAGE"
$DOCKER pull $BACKEND_IMAGE

# Tag it locally for easier reference
$DOCKER tag $BACKEND_IMAGE sms-backend:latest

# Start backend
echo ""
echo -e "${YELLOW}[4/5] Starting Backend...${NC}"

# Remove existing backend container if it exists
if container_exists "sms-backend"; then
    echo "Removing existing backend container..."
    $DOCKER rm -f sms-backend
    echo "Existing backend container removed"
fi

echo "Starting new backend container..."

# Build Redis configuration
REDIS_HOST="sms-redis"
if [ -n "$REDIS_PASSWORD" ]; then
    REDIS_CONFIG="-e SPRING_DATA_REDIS_PASSWORD=$REDIS_PASSWORD"
else
    REDIS_CONFIG=""
fi

$DOCKER run -d \
    --name sms-backend \
    --network $NETWORK_NAME \
    -p $BACKEND_PORT:8080 \
    -e SPRING_PROFILES_ACTIVE="$SPRING_PROFILES_ACTIVE" \
    -e SPRING_DATASOURCE_URL="jdbc:mysql://sms-mysql:3306/$MYSQL_DATABASE?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true" \
    -e SPRING_DATASOURCE_USERNAME="$MYSQL_USER" \
    -e SPRING_DATASOURCE_PASSWORD="$MYSQL_PASSWORD" \
    -e SPRING_DATA_REDIS_HOST="$REDIS_HOST" \
    -e SPRING_DATA_REDIS_PORT=6379 \
    $REDIS_CONFIG \
    -e JWT_SECRET="$JWT_SECRET" \
    --restart unless-stopped \
    sms-backend:latest

# Pull frontend image from GitHub Container Registry
echo ""
echo -e "${YELLOW}[5/5] Pulling frontend image...${NC}"
FRONTEND_TAG=${FRONTEND_TAG:-latest}
FRONTEND_IMAGE="ghcr.io/stanleysun233/sms-server-frontend:${FRONTEND_TAG}"

echo "Pulling image: $FRONTEND_IMAGE"
$DOCKER pull $FRONTEND_IMAGE

# Tag it locally for easier reference
$DOCKER tag $FRONTEND_IMAGE sms-frontend:latest

# Start frontend
echo ""
echo -e "${YELLOW}Starting Frontend...${NC}"

# Remove existing frontend container if it exists (running or stopped)
if container_exists "sms-frontend"; then
    echo "Removing existing frontend container..."
    $DOCKER rm -f sms-frontend
    echo "Existing frontend container removed"
fi

echo "Starting new frontend container..."

$DOCKER run -d \
    --name sms-frontend \
    --network $NETWORK_NAME \
    -p $FRONTEND_PORT:3000 \
    -e NODE_ENV="$NODE_ENV" \
    -e NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    -e BACKEND_URL="http://sms-backend:8080" \
    --restart unless-stopped \
    sms-frontend:latest

echo ""
echo -e "${GREEN}=== All services started successfully! ===${NC}"
echo ""
echo -e "${GREEN}Service Status:${NC}"
$DOCKER ps --filter "name=sms-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo "  - Frontend: http://localhost:$FRONTEND_PORT"
echo "  - API Swagger UI: http://localhost:$BACKEND_PORT/api/swagger-ui.html"
echo "  - API Health Check: http://localhost:$BACKEND_PORT/api/actuator/health"
echo "  - MySQL: localhost:$MYSQL_PORT"
echo "  - Redis: localhost:$REDIS_PORT"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "  sudo docker logs -f sms-frontend"
echo "  sudo docker logs -f sms-backend"
echo ""
echo -e "${YELLOW}Stop all services:${NC}"
echo "  ./stop.sh"
echo ""

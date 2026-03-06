# SMS Server Backend

Spring Boot 3.x backend application for SMS Server.

## Technology Stack

- Spring Boot 3.2.3
- Spring Security
- MyBatis-Plus 3.5.5
- MySQL 8.0
- Redis (Lettuce client)
- JWT Authentication
- SpringDoc OpenAPI (Swagger)

## Project Structure

```
src/
├── main/
│   ├── java/com/smsserver/
│   │   ├── config/          # Configuration classes
│   │   ├── controller/      # REST controllers
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── entity/         # JPA/MyBatis entities
│   │   ├── mapper/         # MyBatis mappers
│   │   ├── service/        # Business logic
│   │   └── util/           # Utility classes
│   └── resources/
│       ├── application.yml      # Main configuration
│       ├── application-dev.yml  # Development profile
│       └── application-prod.yml # Production profile
└── test/                    # Test files
```

## Running Locally

1. Ensure MySQL and Redis are running
2. Configure database in `application-dev.yml`
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

## Building

```bash
./mvnw clean package
```

## API Documentation

Once running, access Swagger UI at:
- http://localhost:8080/api/swagger-ui.html

## Health Check

- http://localhost:8080/api/health
- http://localhost:8080/actuator/health

# SMS Server - Code Patterns & Conventions

## Backend (Spring Boot) Patterns

### 1. Entity Pattern
```java
@Data
@TableName("table_name")
public class EntityName {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String field;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

### 2. Mapper Pattern (MyBatis-Plus)
```java
@Mapper
public interface EntityMapper extends BaseMapper<Entity> {
    // Custom queries using annotations or XML
    @Select("SELECT * FROM table WHERE field = #{value}")
    Entity findByField(@Param("value") String value);
}
```

### 3. Service Pattern
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EntityService {
    private final EntityMapper mapper;

    @Transactional
    public Entity create(CreateRequest request) {
        // Business logic here
        Entity entity = new Entity();
        // ... set fields
        mapper.insert(entity);
        return entity;
    }

    public List<Entity> findByUserId(Long userId) {
        LambdaQueryWrapper<Entity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Entity::getUserId, userId);
        return mapper.selectList(wrapper);
    }
}
```

### 4. Controller Pattern
```java
@RestController
@RequestMapping("/api/resource")
@RequiredArgsConstructor
public class EntityController {
    private final EntityService service;

    @GetMapping
    public ResponseEntity<?> list() {
        try {
            List<Entity> entities = service.findAll();
            return ResponseEntity.ok(entities);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateRequest request) {
        try {
            Entity entity = service.create(request);
            return ResponseEntity.ok(entity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
```

### 5. DTO Pattern
```java
// Request DTO
@Data
public class CreateRequest {
    @NotBlank(message = "Field is required")
    private String field;
}

// Response DTO
@Data
public class EntityResponse {
    private Long id;
    private String field;
    private LocalDateTime createdAt;

    public static EntityResponse fromEntity(Entity entity) {
        EntityResponse response = new EntityResponse();
        response.setId(entity.getId());
        response.setField(entity.getField());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }
}
```

### 6. User Isolation Pattern

**Critical**: Always filter by user_id to prevent data leaks!

```java
// In Service layer
public List<Device> getUserDevices(Long userId) {
    LambdaQueryWrapper<Device> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(Device::getUserId, userId);
    return deviceMapper.selectList(wrapper);
}

// In Controller layer
@GetMapping("/devices/{id}")
public ResponseEntity<?> getDevice(@PathVariable Long id, @CookieValue String SESSION_ID) {
    User user = authService.getCurrentUser(SESSION_ID);
    Device device = deviceService.findById(id);

    // Check ownership
    if (!device.getUserId().equals(user.getId())) {
        return ResponseEntity.status(403).body("Access denied");
    }

    return ResponseEntity.ok(device);
}
```

### 7. Redis Operations Pattern
```java
// Simple key-value
redisTemplate.opsForValue().set("key", "value", duration, TimeUnit.SECONDS);
String value = redisTemplate.opsForValue().get("key");

// List operations (queue)
redisTemplate.opsForList().rightPush("queue:name", "value");
String value = redisTemplate.opsForList().leftPop("queue:name");

// Delete
redisTemplate.delete("key");
```

### 8. Transaction Pattern
```java
@Transactional
public void cascadeDelete(Long deviceId) {
    // All operations in same transaction
    smsMessageMapper.deleteByDeviceId(deviceId);
    missedCallMapper.deleteByDeviceId(deviceId);
    pendingSmsMapper.deleteByDeviceId(deviceId);
    deviceMapper.deleteById(deviceId);
    // If any fails, all rollback
}
```

## Frontend (Next.js) Patterns

### 1. Page Component Pattern (App Router)
```tsx
'use client'; // If using state/effects

import { useState, useEffect } from 'react';

export default function PageName() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      {/* Content */}
    </div>
  );
}
```

### 2. Reusable Component Pattern
```tsx
interface ComponentProps {
  title: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function Component({ title, onClick, children }: ComponentProps) {
  return (
    <div className="glass-card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### 3. API Call Pattern
```typescript
// In lib/api.ts
export const deviceApi = {
  list: () => api.get('/devices'),
  get: (id: number) => api.get(`/devices/${id}`),
  create: (data: CreateDeviceRequest) => api.post('/devices', data),
  update: (id: number, data: UpdateDeviceRequest) => api.put(`/devices/${id}`, data),
  delete: (id: number) => api.delete(`/devices/${id}`),
};

// In component
import { deviceApi } from '@/lib/api';

const devices = await deviceApi.list();
```

### 4. Form Handling Pattern
```tsx
const [form, setForm] = useState({ field: '' });
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await api.post('/endpoint', form);
    ElMessage.success('Success');
    router.push('/redirect');
  } catch (error: any) {
    ElMessage.error(error.response?.data || 'Error occurred');
  } finally {
    setLoading(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <ElInput
      value={form.field}
      onChange={(value) => setForm({ ...form, field: value })}
    />
    <ElButton type="primary" nativeType="submit" loading={loading}>
      Submit
    </ElButton>
  </form>
);
```

### 5. Glassmorphism Style Pattern
```tsx
// CSS class (in globals.css)
.glass-card {
  @apply bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl;
}

// Inline style
<div
  className="rounded-2xl p-6"
  style={{
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  }}
>
```

### 6. Status Indicator Pattern
```tsx
interface StatusProps {
  status: 'online' | 'warning' | 'offline';
}

const statusColors = {
  online: '#10b981',
  warning: '#f59e0b',
  offline: '#ef4444',
};

export default function StatusIndicator({ status }: StatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: statusColors[status] }}
      />
      <span className="capitalize">{status}</span>
    </div>
  );
}
```

### 7. Protected Route Pattern
```tsx
// In app/dashboard/layout.tsx
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

### 8. Auto-refresh Pattern
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

## Styling Conventions

### Color Palette
```css
/* Background */
background: rgb(45, 45, 45);

/* Primary (Gold-Brown) */
color: #c2905e;

/* Status Colors */
online: #10b981;   /* Green */
warning: #f59e0b;  /* Yellow */
offline: #ef4444;  /* Red */

/* Glass Effect */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

### Tailwind Classes
```
Container: container mx-auto px-4
Card: rounded-2xl p-6 shadow-xl
Button: px-6 py-2 rounded-lg
Text: text-white/90 (for light text on dark background)
Spacing: gap-4, space-y-4
```

## Security Patterns

### 1. Password Hashing
```java
// Always use BCrypt with strength 10
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
String hash = encoder.encode(plainPassword);
boolean matches = encoder.matches(plainPassword, hash);
```

### 2. Session Management
```java
// Redis session with TTL
String sessionId = UUID.randomUUID().toString();
redisService.setSession(sessionId, userId, 7 * 24 * 60 * 60); // 7 days

// Cookie configuration
Cookie cookie = new Cookie("SESSION_ID", sessionId);
cookie.setHttpOnly(true);
cookie.setPath("/");
cookie.setMaxAge(7 * 24 * 60 * 60);
```

### 3. Input Validation
```java
// Server-side validation (always!)
@Data
public class Request {
    @NotBlank(message = "Field is required")
    @Size(min = 3, max = 50)
    private String field;

    @Email(message = "Invalid email")
    private String email;
}

// Controller
@PostMapping
public ResponseEntity<?> create(@Valid @RequestBody Request request) {
    // Validation errors handled automatically
}
```

### 4. SQL Injection Prevention
```java
// MyBatis parameterized queries (automatic)
@Select("SELECT * FROM table WHERE id = #{id}")
Entity findById(@Param("id") Long id);

// MyBatis-Plus (automatic)
LambdaQueryWrapper<Entity> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(Entity::getId, id);
```

## Database Conventions

### 1. Naming
- Tables: lowercase with underscores (e.g., `sms_message`)
- Columns: lowercase with underscores (e.g., `user_id`)
- Foreign keys: `{table}_id` (e.g., `device_id`)
- Indexes: `idx_{column}` (e.g., `idx_user_id`)

### 2. Common Fields
```sql
id BIGINT AUTO_INCREMENT PRIMARY KEY
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 3. Foreign Keys
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### 4. Indexes
```sql
-- Single column
INDEX idx_user_id (user_id)

-- Composite
INDEX idx_device_phone (device_id, phone_number)

-- For sorting/filtering
INDEX idx_created_at (created_at)
```

## Redis Key Conventions

```
session:{sessionId}                 - User session (TTL: 7 days)
device:status:{deviceId}            - Device status cache (TTL: 10 min)
device:unread:{deviceId}            - Unread message count (TTL: varies)
task:sms:{deviceId}                 - Pending SMS queue (list)
```

## Error Handling Patterns

### Backend
```java
try {
    // Operation
} catch (SpecificException e) {
    log.error("Specific error: {}", e.getMessage());
    throw new RuntimeException("User-friendly message");
} catch (Exception e) {
    log.error("Unexpected error", e);
    throw new RuntimeException("An error occurred");
}
```

### Frontend
```typescript
try {
  await api.call();
  ElMessage.success('Success message');
} catch (error: any) {
  ElMessage.error(error.response?.data || 'An error occurred');
  console.error('Error:', error);
}
```

## Logging Conventions

### Log Levels
- `debug`: Detailed information for debugging (e.g., "Processing request for user 123")
- `info`: Important business events (e.g., "User registered", "Device created")
- `warn`: Recoverable issues (e.g., "Invalid timestamp format, using current time")
- `error`: Errors that need attention (e.g., "Database connection failed")

### Log Format
```java
log.info("Action performed: {} items affected, duration: {}ms", count, duration);
log.error("Operation failed for user {}: {}", userId, e.getMessage());
```

## Performance Best Practices

1. **Batch Operations**: Use MyBatis batch insert for multiple records
2. **Caching**: Cache frequently accessed data in Redis
3. **Pagination**: Always paginate list endpoints
4. **Indexes**: Add database indexes on foreign keys and filter columns
5. **Connection Pooling**: Configure appropriate pool sizes
6. **Lazy Loading**: Fetch related entities only when needed

## Testing Patterns

### Backend Test
```java
@SpringBootTest
class ServiceTest {
    @Autowired
    private Service service;

    @Test
    void testCreate() {
        Request request = new Request();
        request.setField("value");

        Entity result = service.create(request);

        assertNotNull(result.getId());
        assertEquals("value", result.getField());
    }
}
```

### Manual API Test
```bash
# Test endpoint with curl
curl -X POST http://localhost/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

## Git Commit Conventions

```
feat: Add SMS messaging feature
fix: Fix device status calculation
refactor: Refactor authentication service
docs: Update API documentation
style: Format code
test: Add unit tests for webhook
chore: Update dependencies
```

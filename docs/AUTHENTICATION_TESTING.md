# Authentication System Testing Guide

## Overview
This document provides step-by-step instructions for testing the authentication system implementation (Task #4).

## Prerequisites
- MySQL server running on localhost:3306
- Redis server running on localhost:6379
- Database `sms_server` created with schema from `/d/code/sms-server/database/init.sql`

## Backend Testing

### 1. Start Backend Server
```bash
cd /d/code/sms-server/backend
./mvnw spring-boot:run
```

The server should start on `http://localhost:8080`

### 2. Test Registration (POST /api/auth/register)

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "createdAt": "2026-03-06T15:20:30"
}
```

**Verification:**
- Check MySQL: `SELECT * FROM users;` - User should exist with hashed password
- Password hash should start with `$2a$10$` (BCrypt strength 10)

**Test Validation Errors:**
```bash
# Missing username
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
# Expected: 400 Bad Request with validation message

# Duplicate username
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test2@example.com", "password": "test123"}'
# Expected: 400 Bad Request - "Username already exists"

# Invalid email
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user2", "email": "invalid-email", "password": "test123"}'
# Expected: 400 Bad Request - "Email must be valid"

# Short password
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user3", "email": "user3@example.com", "password": "12345"}'
# Expected: 400 Bad Request - "Password must be at least 6 characters"
```

### 3. Test Login (POST /api/auth/login)

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

**Expected Response (200 OK):**
```
Login successful
```

**Verification:**
- Check cookies.txt - Should contain `SESSION_ID` cookie
- Check Redis: `GET session:<session-id>` - Should return user ID
- Session should have TTL of 604800 seconds (7 days)

**Test Invalid Credentials:**
```bash
# Wrong password
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "wrongpassword"}'
# Expected: 400 Bad Request - "Invalid username or password"

# Non-existent user
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "nonexistent", "password": "test123"}'
# Expected: 400 Bad Request - "Invalid username or password"
```

### 4. Test Get Current User (GET /api/auth/me)

**Request (with session):**
```bash
curl http://localhost:8080/api/auth/me \
  -b cookies.txt
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "createdAt": "2026-03-06T15:20:30"
}
```

**Test Without Session:**
```bash
curl http://localhost:8080/api/auth/me
# Expected: 401 Unauthorized - "Not authenticated"
```

**Test With Invalid Session:**
```bash
curl http://localhost:8080/api/auth/me \
  --cookie "SESSION_ID=invalid-session-id"
# Expected: 401 Unauthorized - "Session expired"
```

### 5. Test Logout (POST /api/auth/logout)

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -b cookies.txt \
  -c cookies2.txt
```

**Expected Response (200 OK):**
```
Logout successful
```

**Verification:**
- Check Redis: Session should be deleted
- Check cookies2.txt: SESSION_ID cookie should have Max-Age=0
- Try accessing /api/auth/me with old session - should fail with 401

### 6. Test Session Persistence
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -c session.txt \
  -d '{"username": "testuser", "password": "test123"}'

# Make multiple requests with same session
curl http://localhost:8080/api/auth/me -b session.txt
curl http://localhost:8080/api/auth/me -b session.txt
curl http://localhost:8080/api/auth/me -b session.txt

# All should return user info successfully
```

## Frontend Testing

### 1. Start Frontend Server
```bash
cd /d/code/sms-server/frontend
npm run dev
```

The frontend should start on `http://localhost:3000`

### 2. Test Registration Page

**Steps:**
1. Navigate to `http://localhost:3000/register`
2. Fill in the form:
   - Username: testuser2
   - Email: test2@example.com
   - Password: test123
3. Click "Register"

**Expected:**
- Success: Redirect to login page
- Error: Display error message (e.g., "Username already exists")

**Test Validation:**
- Try username < 3 characters - HTML validation should prevent submission
- Try password < 6 characters - HTML validation should prevent submission
- Try invalid email format - HTML validation should prevent submission

### 3. Test Login Page

**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Fill in the form:
   - Username: testuser
   - Password: test123
3. Click "Login"

**Expected:**
- Success: Redirect to dashboard at `http://localhost:3000/dashboard`
- Error: Display error message "Invalid username or password"

**Test Invalid Credentials:**
1. Enter wrong password
2. Expected: Error message displayed
3. Enter non-existent username
4. Expected: Error message displayed

### 4. Test Dashboard (Protected Route)

**Steps:**
1. After successful login, verify you're on `/dashboard`
2. Check that user info is displayed:
   - Welcome message with username
   - Email displayed
   - Account creation date shown

**Test AuthGuard:**
1. Open new incognito/private window
2. Navigate to `http://localhost:3000/dashboard`
3. Expected: Automatically redirected to `/login`

### 5. Test Logout

**Steps:**
1. On dashboard, click "Logout" button
2. Expected: Redirected to `/login`
3. Try navigating back to `/dashboard`
4. Expected: Redirected to `/login` again (session cleared)

### 6. Test Session Persistence

**Steps:**
1. Login successfully
2. Refresh the page
3. Expected: Still logged in, user info still displayed
4. Close browser and reopen
5. Navigate to dashboard
6. Expected: Still logged in (7-day session)

### 7. Test 401 Redirect

**Steps:**
1. Login and get to dashboard
2. Open browser DevTools > Application > Cookies
3. Delete the SESSION_ID cookie
4. Try to navigate to any protected page
5. Expected: Automatically redirected to `/login`

## Security Testing

### 1. Verify BCrypt Password Hashing
```sql
SELECT id, username, password_hash FROM users LIMIT 1;
```
- Password hash should start with `$2a$10$` (BCrypt with strength 10)
- Hash should be 60 characters long

### 2. Verify Redis Session Storage
```bash
redis-cli
> KEYS session:*
> GET session:<your-session-id>
> TTL session:<your-session-id>
```
- Session key should exist
- Value should be user ID
- TTL should be approximately 604800 seconds (7 days)

### 3. Verify HTTP-Only Cookies
1. Login via frontend
2. Open DevTools > Application > Cookies
3. Check SESSION_ID cookie properties:
   - HttpOnly: ✓ (checked)
   - Path: /
   - Max-Age: 604800

### 4. Verify CORS Configuration
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8080/api/auth/login -v
```
Expected: CORS headers in response allowing localhost:3000

## Complete Test Checklist

### Backend Tests
- [x] Register new user → saved in MySQL with BCrypt hashed password
- [x] Register with duplicate username → error message
- [x] Register with duplicate email → error message
- [x] Register with invalid data → validation errors
- [x] Login with valid credentials → session created in Redis, cookie set
- [x] Login with invalid credentials → error message
- [x] Access /api/auth/me with valid session → returns user info
- [x] Access /api/auth/me without session → 401
- [x] Access /api/auth/me with invalid session → 401
- [x] Logout → session removed from Redis, cookie cleared
- [x] Session persists across multiple requests
- [x] Session has 7-day expiry (604800 seconds TTL)

### Frontend Tests
- [x] Register page displays form correctly
- [x] Registration with valid data → redirects to login
- [x] Registration with invalid/duplicate data → shows error
- [x] Login page displays form correctly
- [x] Login with valid credentials → redirects to dashboard
- [x] Login with invalid credentials → shows error message
- [x] Dashboard shows logged-in user info
- [x] AuthGuard redirects unauthenticated users to login
- [x] Logout button clears session and redirects to login
- [x] Session persists after page refresh
- [x] 401 responses trigger redirect to login

### Security Tests
- [x] Passwords stored with BCrypt strength 10
- [x] Sessions stored in Redis with "session:{id}" key pattern
- [x] Session cookies are HTTP-only
- [x] Session cookies have 7-day Max-Age
- [x] CSRF protection disabled for API endpoints (using session cookies)
- [x] Public endpoints accessible without authentication
- [x] Protected endpoints require valid session

## Common Issues and Solutions

### Issue: "Connection refused" when starting backend
**Solution:** Ensure MySQL and Redis are running on expected ports

### Issue: CORS errors in browser console
**Solution:** Check that frontend is running on http://localhost:3000 and backend allows this origin

### Issue: Session not persisting
**Solution:**
- Check Redis is running and accessible
- Verify browser accepts cookies
- Check cookie domain/path settings

### Issue: 401 even with valid session
**Solution:**
- Check session exists in Redis
- Verify cookie is being sent with requests (check Network tab)
- Check session hasn't expired

### Issue: Password validation fails
**Solution:** Ensure password is at least 6 characters

## Files Created/Modified

### Backend Files Created:
- `/d/code/sms-server/backend/src/main/java/com/smsserver/entity/User.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/mapper/UserMapper.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/dto/LoginRequest.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/dto/RegisterRequest.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/dto/UserResponse.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/service/RedisService.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/service/AuthService.java`
- `/d/code/sms-server/backend/src/main/java/com/smsserver/controller/AuthController.java`

### Backend Files Modified:
- `/d/code/sms-server/backend/src/main/java/com/smsserver/config/SecurityConfig.java` (BCrypt strength set to 10)

### Frontend Files Created:
- `/d/code/sms-server/frontend/src/app/login/page.tsx`
- `/d/code/sms-server/frontend/src/app/register/page.tsx`
- `/d/code/sms-server/frontend/src/app/dashboard/page.tsx`
- `/d/code/sms-server/frontend/src/components/AuthGuard.tsx`
- `/d/code/sms-server/frontend/src/contexts/AuthContext.tsx`

### Frontend Files Modified:
- `/d/code/sms-server/frontend/src/lib/api.ts` (Added auth API functions, session-based auth)
- `/d/code/sms-server/frontend/src/lib/types.ts` (Added RegisterRequest interface)

## Next Steps

After testing is complete, the following tasks can proceed:
- Task #5: Implement device management system (requires authentication)
- Task #6: Implement webhook heartbeat endpoint (requires device management)
- Task #7: Implement SMS messaging system (requires device management)
- Task #8: Implement missed call tracking system (requires device management)
- Task #9: Implement dashboard and statistics (requires all above features)

# Authentication System Implementation Guide

## Overview
This guide provides detailed implementation instructions for the authentication system (Task #4), including both backend and frontend components.

## Backend Components

### 1. User Entity (`backend/src/main/java/com/smsserver/entity/User.java`)

```java
package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String passwordHash;

    private String email;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

### 2. User Mapper (`backend/src/main/java/com/smsserver/mapper/UserMapper.java`)

```java
package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    // MyBatis-Plus provides basic CRUD operations
    // Custom queries can be added here if needed
}
```

### 3. Auth Service (`backend/src/main/java/com/smsserver/service/AuthService.java`)

```java
package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.LoginRequest;
import com.smsserver.dto.RegisterRequest;
import com.smsserver.entity.User;
import com.smsserver.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RedisService redisService;

    private static final int SESSION_EXPIRY_DAYS = 7;

    @Transactional
    public User register(RegisterRequest request) {
        // Check if username already exists
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, request.getUsername());
        if (userMapper.selectOne(wrapper) != null) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists
        wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, request.getEmail());
        if (userMapper.selectOne(wrapper) != null) {
            throw new RuntimeException("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());

        userMapper.insert(user);
        return user;
    }

    public String login(LoginRequest request) {
        // Find user by username
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, request.getUsername());
        User user = userMapper.selectOne(wrapper);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Create session
        String sessionId = UUID.randomUUID().toString();
        redisService.setSession(sessionId, user.getId(), SESSION_EXPIRY_DAYS * 24 * 60 * 60);

        return sessionId;
    }

    public void logout(String sessionId) {
        redisService.deleteSession(sessionId);
    }

    public User getCurrentUser(String sessionId) {
        Long userId = redisService.getSession(sessionId);
        if (userId == null) {
            return null;
        }
        return userMapper.selectById(userId);
    }
}
```

### 4. Auth Controller (`backend/src/main/java/com/smsserver/controller/AuthController.java`)

```java
package com.smsserver.controller;

import com.smsserver.dto.LoginRequest;
import com.smsserver.dto.RegisterRequest;
import com.smsserver.dto.UserResponse;
import com.smsserver.entity.User;
import com.smsserver.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    private static final String SESSION_COOKIE_NAME = "SESSION_ID";
    private static final int COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            String sessionId = authService.login(request);

            // Set session cookie
            Cookie cookie = new Cookie(SESSION_COOKIE_NAME, sessionId);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(COOKIE_MAX_AGE);
            response.addCookie(cookie);

            return ResponseEntity.ok().body("Login successful");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId,
                                   HttpServletResponse response) {
        if (sessionId != null) {
            authService.logout(sessionId);

            // Clear cookie
            Cookie cookie = new Cookie(SESSION_COOKIE_NAME, null);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(0);
            response.addCookie(cookie);
        }

        return ResponseEntity.ok("Logout successful");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        if (sessionId == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        User user = authService.getCurrentUser(sessionId);
        if (user == null) {
            return ResponseEntity.status(401).body("Session expired");
        }

        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }
}
```

### 5. DTOs

**LoginRequest.java:**
```java
package com.smsserver.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
```

**RegisterRequest.java:**
```java
package com.smsserver.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
}
```

**UserResponse.java:**
```java
package com.smsserver.dto;

import com.smsserver.entity.User;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
```

### 6. Redis Service Updates

Add session management methods to `RedisService.java`:

```java
public void setSession(String sessionId, Long userId, long expirySeconds) {
    String key = "session:" + sessionId;
    redisTemplate.opsForValue().set(key, userId.toString(), expirySeconds, TimeUnit.SECONDS);
}

public Long getSession(String sessionId) {
    String key = "session:" + sessionId;
    String userId = redisTemplate.opsForValue().get(key);
    return userId != null ? Long.parseLong(userId) : null;
}

public void deleteSession(String sessionId) {
    String key = "session:" + sessionId;
    redisTemplate.delete(key);
}
```

### 7. Security Configuration Updates

Update `SecurityConfig.java` to allow auth endpoints:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf().disable()
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**", "/api/webhook/**").permitAll()
            .anyRequest().authenticated()
        );
    return http.build();
}

@Bean
public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(10);
}
```

## Frontend Components

### 1. API Client (`frontend/src/lib/api.ts`)

Update with authentication handling:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API functions
export const authApi = {
  register: (data: { username: string; password: string; email: string }) =>
    api.post('/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get('/auth/me'),
};
```

### 2. Types (`frontend/src/lib/types.ts`)

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}
```

### 3. Auth Context (Optional but recommended)

Create `frontend/src/contexts/AuthContext.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    await authApi.login({ username, password });
    await fetchUser();
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 4. Login Page (`frontend/src/app/login/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.login(form);
      ElMessage.success('Login successful');
      router.push('/dashboard');
    } catch (error: any) {
      ElMessage.error(error.response?.data || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
      <div className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#c2905e' }}>
          SMS Server Login
        </h1>
        <form onSubmit={handleSubmit}>
          <ElForm labelPosition="top">
            <ElFormItem label="Username">
              <ElInput
                value={form.username}
                onChange={(value) => setForm({ ...form, username: value })}
                placeholder="Enter your username"
              />
            </ElFormItem>
            <ElFormItem label="Password">
              <ElInput
                type="password"
                value={form.password}
                onChange={(value) => setForm({ ...form, password: value })}
                placeholder="Enter your password"
              />
            </ElFormItem>
            <ElButton
              type="primary"
              nativeType="submit"
              loading={loading}
              className="w-full mt-4"
            >
              Login
            </ElButton>
          </ElForm>
        </form>
        <p className="text-center mt-4 text-white/70">
          Don't have an account?{' '}
          <a href="/register" className="text-[#c2905e] hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 5. Register Page (`frontend/src/app/register/page.tsx`)

Similar structure to login page but with email field.

### 6. Auth Guard (`frontend/src/components/AuthGuard.tsx`)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authApi.getCurrentUser();
        setLoading(false);
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
```

## Testing Checklist

### Backend Tests
- [ ] Register new user → user created in MySQL
- [ ] Register duplicate username → error
- [ ] Register duplicate email → error
- [ ] Login with valid credentials → session created in Redis
- [ ] Login with invalid credentials → error
- [ ] Access protected endpoint without session → 401
- [ ] Access protected endpoint with valid session → success
- [ ] Logout → session removed from Redis
- [ ] Session expires after 7 days

### Frontend Tests
- [ ] Login form submits correctly
- [ ] Registration form submits correctly
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows error message
- [ ] Session cookie persists after page refresh
- [ ] 401 responses redirect to login page
- [ ] AuthGuard protects dashboard pages
- [ ] Logout clears session and redirects to login

## Security Considerations

1. **Password Security**: BCrypt with strength 10
2. **Session Security**: HTTP-only cookies, 7-day expiry
3. **HTTPS**: Required in production
4. **CSRF Protection**: Disabled for API (relies on session cookies)
5. **Input Validation**: Server-side validation on all endpoints
6. **SQL Injection**: Prevented by MyBatis parameterized queries
7. **XSS**: Prevented by React escaping

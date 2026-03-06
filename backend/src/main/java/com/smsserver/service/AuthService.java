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

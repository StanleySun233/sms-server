package com.smsserver.controller;

import com.smsserver.dto.CreateDeviceRequest;
import com.smsserver.dto.DeviceResponse;
import com.smsserver.dto.UpdateDeviceRequest;
import com.smsserver.entity.Device;
import com.smsserver.entity.User;
import com.smsserver.service.AuthService;
import com.smsserver.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {
    private final DeviceService deviceService;
    private final AuthService authService;

    private static final String SESSION_COOKIE_NAME = "SESSION_ID";

    /**
     * Get current user from session
     */
    private User getCurrentUser(String sessionId) {
        if (sessionId == null) {
            throw new RuntimeException("Not authenticated");
        }
        User user = authService.getCurrentUser(sessionId);
        if (user == null) {
            throw new RuntimeException("Session expired");
        }
        return user;
    }

    /**
     * List all devices for current user
     */
    @GetMapping
    public ResponseEntity<?> listDevices(@CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        try {
            User user = getCurrentUser(sessionId);
            List<Device> devices = deviceService.listUserDevices(user.getId());

            List<DeviceResponse> responses = devices.stream()
                    .map(device -> DeviceResponse.fromEntity(device, deviceService.calculateDeviceStatus(device)))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Not authenticated") || e.getMessage().equals("Session expired")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Create a new device
     */
    @PostMapping
    public ResponseEntity<?> createDevice(
            @Valid @RequestBody CreateDeviceRequest request,
            @CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        try {
            User user = getCurrentUser(sessionId);
            Device device = deviceService.createDevice(user.getId(), request);
            String status = deviceService.calculateDeviceStatus(device);
            return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Not authenticated") || e.getMessage().equals("Session expired")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get single device details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getDevice(
            @PathVariable Long id,
            @CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        try {
            User user = getCurrentUser(sessionId);
            Device device = deviceService.getDevice(id, user.getId());
            String status = deviceService.calculateDeviceStatus(device);
            return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Not authenticated") || e.getMessage().equals("Session expired")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            if (e.getMessage().equals("Access denied")) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if (e.getMessage().equals("Device not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Update device alias
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDevice(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeviceRequest request,
            @CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        try {
            User user = getCurrentUser(sessionId);
            Device device = deviceService.updateDevice(id, user.getId(), request);
            String status = deviceService.calculateDeviceStatus(device);
            return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Not authenticated") || e.getMessage().equals("Session expired")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            if (e.getMessage().equals("Access denied")) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if (e.getMessage().equals("Device not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Delete device
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(
            @PathVariable Long id,
            @CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        try {
            User user = getCurrentUser(sessionId);
            deviceService.deleteDevice(id, user.getId());
            return ResponseEntity.ok("Device deleted successfully");
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Not authenticated") || e.getMessage().equals("Session expired")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            if (e.getMessage().equals("Access denied")) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if (e.getMessage().equals("Device not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

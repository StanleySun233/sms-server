package com.smsserver.controller;

import com.smsserver.dto.CreateDeviceRequest;
import com.smsserver.dto.DeviceResponse;
import com.smsserver.dto.UpdateDeviceRequest;
import com.smsserver.entity.Device;
import com.smsserver.entity.User;
import com.smsserver.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {
    private final DeviceService deviceService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<?> listDevices() {
        User user = getCurrentUser();
        List<Device> devices = deviceService.listUserDevices(user.getId());
        List<DeviceResponse> responses = devices.stream()
                .map(device -> DeviceResponse.fromEntity(device, deviceService.calculateDeviceStatus(device)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<?> createDevice(@Valid @RequestBody CreateDeviceRequest request) {
        User user = getCurrentUser();
        Device device = deviceService.createDevice(user.getId(), request);
        String status = deviceService.calculateDeviceStatus(device);
        return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDevice(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            Device device = deviceService.getDevice(id, user.getId());
            String status = deviceService.calculateDeviceStatus(device);
            return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if ("Device not found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDevice(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeviceRequest request) {
        try {
            User user = getCurrentUser();
            Device device = deviceService.updateDevice(id, user.getId(), request);
            String status = deviceService.calculateDeviceStatus(device);
            return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if ("Device not found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            deviceService.deleteDevice(id, user.getId());
            return ResponseEntity.ok("Device deleted successfully");
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if ("Device not found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

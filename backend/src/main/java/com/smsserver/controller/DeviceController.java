package com.smsserver.controller;

import com.smsserver.dto.common.ApiResponse;
import com.smsserver.dto.device.CheckUsernameResponse;
import com.smsserver.dto.device.CreateDeviceRequest;
import com.smsserver.dto.device.DeviceResponse;
import com.smsserver.dto.device.TransferDeviceRequest;
import com.smsserver.dto.device.UpdateDeviceRequest;
import com.smsserver.dto.webhook.PagedWebhookLogsResponse;
import com.smsserver.entity.Device;
import com.smsserver.entity.User;
import com.smsserver.service.DeviceService;
import com.smsserver.service.WebhookLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {
    private final DeviceService deviceService;
    private final WebhookLogService webhookLogService;

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

    @GetMapping("/transfer/check-username")
    public ResponseEntity<?> checkTransferUsername(@RequestParam String username) {
        try {
            User user = getCurrentUser();
            CheckUsernameResponse resp = deviceService.checkTransferUsername(user.getId(), username);
            return ResponseEntity.ok(resp);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : ""));
        }
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

    @GetMapping("/{id}/webhook-logs")
    public ResponseEntity<?> getWebhookLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            User user = getCurrentUser();
            PagedWebhookLogsResponse data = webhookLogService.getLogsByDevice(id, user.getId(), page, size);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(ApiResponse.error(403, e.getMessage()));
            }
            if ("Device not found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(ApiResponse.error(404, e.getMessage()));
            }
            throw e;
        }
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<?> transferDevice(@PathVariable Long id, @Valid @RequestBody TransferDeviceRequest request) {
        try {
            User user = getCurrentUser();
            Device device = deviceService.transferDevice(id, user.getId(), request.getUsername());
            String status = deviceService.calculateDeviceStatus(device);
            return ResponseEntity.ok(DeviceResponse.fromEntity(device, status));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(e.getMessage());
            }
            if ("Device not found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            if ("User not found".equals(e.getMessage()) || "Cannot transfer to self".equals(e.getMessage()) || "Username is required".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

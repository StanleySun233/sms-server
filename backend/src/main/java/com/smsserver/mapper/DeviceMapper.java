package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.dto.dashboard.DeviceOverview;
import com.smsserver.entity.Device;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface DeviceMapper extends BaseMapper<Device> {

    @Select("SELECT * FROM devices WHERE webhook_token = #{token}")
    Device findByWebhookToken(@Param("token") String token);

    @Select("""
            SELECT d.id, d.alias, d.last_heartbeat_at, d.current_phone_number, d.imei, d.signal_strength,
                   (SELECT COUNT(*) FROM sms_message m
                    WHERE m.device_id = d.id AND m.direction = 'received' AND m.read_at IS NULL) AS unread_messages,
                   (SELECT COUNT(*) FROM missed_call c
                    WHERE c.device_id = d.id AND c.read_at IS NULL) AS unread_calls,
                   (SELECT COUNT(*) FROM sms_message m
                    WHERE m.device_id = d.id AND m.direction = 'sent') AS outgoing_tasks
            FROM devices d
            WHERE d.user_id = #{userId}
            ORDER BY d.created_at DESC, d.id DESC
            """)
    List<DeviceOverview> findDashboardDevices(@Param("userId") Long userId);

    @Delete("DELETE FROM sms_message WHERE device_id = #{deviceId}")
    int deleteSmsMessagesByDeviceId(@Param("deviceId") Long deviceId);

    @Delete("DELETE FROM missed_call WHERE device_id = #{deviceId}")
    int deleteMissedCallsByDeviceId(@Param("deviceId") Long deviceId);

    @Delete("DELETE FROM pending_sms WHERE device_id = #{deviceId}")
    int deletePendingSmsByDeviceId(@Param("deviceId") Long deviceId);

    @Delete("DELETE FROM sim_change_log WHERE device_id = #{deviceId}")
    int deleteSimChangeLogsByDeviceId(@Param("deviceId") Long deviceId);
}

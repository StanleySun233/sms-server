package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.Device;
import org.apache.ibatis.annotations.*;

@Mapper
public interface DeviceMapper extends BaseMapper<Device> {

    @Select("SELECT * FROM devices WHERE webhook_token = #{token}")
    Device findByWebhookToken(@Param("token") String token);

    @Delete("DELETE FROM sms_message WHERE device_id = #{deviceId}")
    int deleteSmsMessagesByDeviceId(@Param("deviceId") Long deviceId);

    @Delete("DELETE FROM missed_call WHERE device_id = #{deviceId}")
    int deleteMissedCallsByDeviceId(@Param("deviceId") Long deviceId);

    @Delete("DELETE FROM pending_sms WHERE device_id = #{deviceId}")
    int deletePendingSmsByDeviceId(@Param("deviceId") Long deviceId);

    @Delete("DELETE FROM sim_change_log WHERE device_id = #{deviceId}")
    int deleteSimChangeLogsByDeviceId(@Param("deviceId") Long deviceId);
}

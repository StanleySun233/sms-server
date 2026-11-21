package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.dto.missedcall.MissedCallSummary;
import com.smsserver.entity.MissedCall;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MissedCallMapper extends BaseMapper<MissedCall> {
    @Select("""
            SELECT phone_number AS phone, COUNT(*) AS count, MAX(call_time) AS last_call_time
            FROM missed_call
            WHERE device_id = #{deviceId}
            GROUP BY phone_number
            ORDER BY last_call_time DESC, phone_number
            """)
    List<MissedCallSummary> findSummaries(@Param("deviceId") Long deviceId);
}

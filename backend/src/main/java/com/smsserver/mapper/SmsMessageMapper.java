package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.dto.sms.ConversationResponse;
import com.smsserver.entity.SmsMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SmsMessageMapper extends BaseMapper<SmsMessage> {
    @Select("""
            <script>
            WITH ranked AS (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY phone_number ORDER BY created_at DESC, id DESC) AS position_no,
                       SUM(CASE WHEN direction = 'received' AND read_at IS NULL THEN 1 ELSE 0 END)
                           OVER (PARTITION BY phone_number) AS unread_count
                FROM sms_message
                WHERE device_id = #{deviceId}
                <if test="receiverPhone != null and receiverPhone != ''">
                    <choose>
                        <when test="receiverPhone == '__unknown__'">
                            AND (receiver_phone IS NULL OR receiver_phone = '')
                        </when>
                        <otherwise>AND receiver_phone = #{receiverPhone}</otherwise>
                    </choose>
                </if>
            )
            SELECT m.phone_number AS phone, m.content AS last_message,
                   m.direction AS last_message_direction, ranked.unread_count,
                   m.created_at AS last_message_time
            FROM ranked JOIN sms_message m ON m.id = ranked.id
            WHERE ranked.position_no = 1
            ORDER BY m.created_at DESC, m.id DESC
            </script>
            """)
    List<ConversationResponse> findConversationSummaries(@Param("deviceId") Long deviceId,
                                                         @Param("receiverPhone") String receiverPhone);
}

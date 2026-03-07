package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.WebhookLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WebhookLogMapper extends BaseMapper<WebhookLog> {
}

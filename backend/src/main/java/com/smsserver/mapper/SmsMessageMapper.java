package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.SmsMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SmsMessageMapper extends BaseMapper<SmsMessage> {
}

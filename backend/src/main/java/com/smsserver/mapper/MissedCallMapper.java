package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.MissedCall;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MissedCallMapper extends BaseMapper<MissedCall> {
}

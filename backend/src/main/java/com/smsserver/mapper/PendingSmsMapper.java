package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.PendingSms;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PendingSmsMapper extends BaseMapper<PendingSms> {
}

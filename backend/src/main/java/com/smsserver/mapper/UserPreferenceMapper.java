package com.smsserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smsserver.entity.UserPreference;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserPreferenceMapper extends BaseMapper<UserPreference> {

    @Select("SELECT * FROM user_preferences WHERE user_id = #{userId} AND pref_key = #{prefKey} LIMIT 1")
    UserPreference findByUserIdAndKey(@Param("userId") Long userId, @Param("prefKey") String prefKey);

    @Insert("INSERT INTO user_preferences (user_id, pref_key, pref_value, updated_at) VALUES (#{userId}, #{prefKey}, #{prefValue}, NOW(3)) ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value), updated_at = NOW(3)")
    int upsert(@Param("userId") Long userId, @Param("prefKey") String prefKey, @Param("prefValue") String prefValue);
}

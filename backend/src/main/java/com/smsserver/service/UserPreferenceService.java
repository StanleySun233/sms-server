package com.smsserver.service;

import com.smsserver.entity.UserPreference;
import com.smsserver.mapper.UserPreferenceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    public static final String KEY_LOCALE = "locale";
    public static final String DEFAULT_LOCALE = "zh";

    private final UserPreferenceMapper userPreferenceMapper;

    public String getPreference(Long userId, String key) {
        UserPreference pref = userPreferenceMapper.findByUserIdAndKey(userId, key);
        if (pref == null) {
            return KEY_LOCALE.equals(key) ? DEFAULT_LOCALE : null;
        }
        return pref.getPrefValue();
    }

    public Map<String, String> getPreferencesMap(Long userId) {
        Map<String, String> map = new HashMap<>();
        String locale = getPreference(userId, KEY_LOCALE);
        map.put(KEY_LOCALE, locale != null ? locale : DEFAULT_LOCALE);
        return map;
    }

    @Transactional
    public void setPreference(Long userId, String key, String value) {
        userPreferenceMapper.upsert(userId, key, value);
    }
}

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT 'User ID',
  `pref_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Preference key e.g. locale',
  `pref_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Preference value e.g. zh',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_pref` (`user_id`,`pref_key`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User preferences';

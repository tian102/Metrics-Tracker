-- Workout Templates Database Tables

-- Table structure for table `workout_templates`
CREATE TABLE IF NOT EXISTS `workout_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_favorite` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_workout_templates_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `workout_template_exercises`
CREATE TABLE IF NOT EXISTS `workout_template_exercises` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `muscle_group` varchar(50) NOT NULL,
  `equipment` varchar(100) NOT NULL,
  `exercise_name` varchar(100) NOT NULL,
  `default_sets` int(11) DEFAULT NULL,
  `default_reps` int(11) DEFAULT NULL,
  `default_weight` float DEFAULT NULL,
  `default_rir` int(11) DEFAULT NULL,
  `exercise_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `fk_workout_template_exercises_template_id` FOREIGN KEY (`template_id`) REFERENCES `workout_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
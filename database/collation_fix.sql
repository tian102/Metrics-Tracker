-- Fix collation issues in the database
-- This script updates the collation of key columns to ensure consistent string comparisons

-- Fix exercises table
ALTER TABLE exercises MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix workout_details table
ALTER TABLE workout_details MODIFY exercise_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE workout_details MODIFY muscle_group VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE workout_details MODIFY equipment VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix muscle_groups table
ALTER TABLE muscle_groups MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix equipment table
ALTER TABLE equipment MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update the database default collation
ALTER DATABASE metrics_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

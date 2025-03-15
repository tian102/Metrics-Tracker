-- Metrics Tracker Database Schema
-- This file contains the complete database structure for the Metrics Tracker application

-- Create the database
CREATE DATABASE IF NOT EXISTS metrics_tracker;
USE metrics_tracker;

-- Daily Metrics Table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    sleep_start DATETIME,
    sleep_end DATETIME,
    stress_level INT,
    energy_level INT,
    motivation_level INT,
    weight FLOAT,
    meals TEXT,
    calories INT,
    protein FLOAT,
    carbs FLOAT,
    fats FLOAT,
    water_intake FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Training Sessions Table
CREATE TABLE IF NOT EXISTS training_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    mesocycle_name VARCHAR(50),
    session_number INT,
    training_start DATETIME,
    training_end DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Workout Details Table
CREATE TABLE IF NOT EXISTS workout_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    muscle_group VARCHAR(50),
    exercise_name VARCHAR(100),
    pre_energy_level INT,
    pre_soreness_level INT,
    sets INT,
    reps INT,
    load_weight FLOAT,
    rir INT,
    stimulus INT,
    fatigue_level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sample data (optional - comment out if not needed)
-- INSERT INTO daily_metrics (date, sleep_start, sleep_end, stress_level, energy_level, motivation_level, calories, protein, carbs, fats, water_intake)
-- VALUES (CURDATE(), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 22:00:00'), CONCAT(CURDATE(), ' 06:30:00'), 4, 7, 8, 2200, 150, 220, 70, 2.5);

-- INSERT INTO training_sessions (date, mesocycle_name, session_number, training_start, training_end)
-- VALUES (CURDATE(), 'Mesocycle 1.2', 3, CONCAT(CURDATE(), ' 17:00:00'), CONCAT(CURDATE(), ' 18:30:00'));

-- SET @session_id = LAST_INSERT_ID();

-- INSERT INTO workout_details (session_id, muscle_group, exercise_name, pre_energy_level, pre_soreness_level, sets, reps, load_weight, rir, stimulus, fatigue_level)
-- VALUES (@session_id, 'Chest', 'Bench Press', 8, 3, 4, 10, 80, 2, 8, 7);

-- INSERT INTO workout_details (session_id, muscle_group, exercise_name, pre_energy_level, pre_soreness_level, sets, reps, load_weight, rir, stimulus, fatigue_level)
-- VALUES (@session_id, 'Back', 'Pull-ups', 7, 2, 4, 8, 0, 1, 9, 8);
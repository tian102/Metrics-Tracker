<?php
require_once 'db.php';

/**
 * Sanitize user input
 */
function sanitize($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    return $input;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate($date) {
    $format = 'Y-m-d';
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

/**
 * Validate time format (HH:MM)
 */
function validateTime($time) {
    $format = 'H:i';
    $t = DateTime::createFromFormat($format, $time);
    return $t && $t->format($format) === $time;
}

/**
 * Validate datetime (YYYY-MM-DD HH:MM:SS)
 */
function validateDateTime($datetime) {
    $format = 'Y-m-d H:i:s';
    $dt = DateTime::createFromFormat($format, $datetime);
    return $dt && $dt->format($format) === $datetime;
}

/**
 * Validate integer in range
 */
function validateIntRange($value, $min, $max) {
    $value = (int) $value;
    return ($value >= $min && $value <= $max);
}

/**
 * Validate float value
 */
function validateFloat($value) {
    return is_numeric($value);
}

/**
 * Format date for display
 */
function formatDate($date) {
    return date('F j, Y', strtotime($date));
}

/**
 * Format time for display
 */
function formatTime($time) {
    return date('g:i A', strtotime($time));
}

/**
 * Get daily metrics for a specific date
 */
function getDailyMetrics($date) {
    $db = new Database();
    $db->query("SELECT * FROM daily_metrics WHERE date = :date");
    $db->bind(':date', $date);
    return $db->single();
}

/**
 * Get training sessions for a specific date
 */
function getTrainingSessions($date) {
    $db = new Database();
    $db->query("SELECT * FROM training_sessions WHERE date = :date");
    $db->bind(':date', $date);
    return $db->resultSet();
}

/**
 * Get workout details for a specific session
 */
function getWorkoutDetails($sessionId) {
    $db = new Database();
    $db->query("SELECT * FROM workout_details WHERE session_id = :session_id");
    $db->bind(':session_id', $sessionId);
    return $db->resultSet();
}

/**
 * Get all daily metrics within a date range
 */
function getDailyMetricsRange($startDate, $endDate) {
    $db = new Database();
    $db->query("SELECT * FROM daily_metrics WHERE date BETWEEN :start_date AND :end_date ORDER BY date DESC");
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    return $db->resultSet();
}

/**
 * Get all training sessions within a date range
 */
function getTrainingSessionsRange($startDate, $endDate) {
    $db = new Database();
    $db->query("SELECT * FROM training_sessions WHERE date BETWEEN :start_date AND :end_date ORDER BY date DESC, training_start DESC");
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    return $db->resultSet();
}

/**
 * Create a new daily metric record
 */
function createDailyMetrics($data) {
    $db = new Database();
    
    if (!isset($data['user_id']) && isset($_SESSION['user_id'])) {
        $data['user_id'] = $_SESSION['user_id'];
    }
    
    $db->query("INSERT INTO daily_metrics (user_id, date, sleep_start, sleep_end, stress_level, energy_level, motivation_level, 
                weight, meals, calories, protein, carbs, fats, water_intake) 
                VALUES (:user_id, :date, :sleep_start, :sleep_end, :stress_level, :energy_level, :motivation_level, 
                :weight, :meals, :calories, :protein, :carbs, :fats, :water_intake)");
    
    $db->bind(':user_id', $data['user_id']);
    $db->bind(':date', $data['date']);
    $db->bind(':sleep_start', $data['sleep_start']);
    $db->bind(':sleep_end', $data['sleep_end']);
    $db->bind(':stress_level', $data['stress_level']);
    $db->bind(':energy_level', $data['energy_level']);
    $db->bind(':motivation_level', $data['motivation_level']);
    $db->bind(':weight', $data['weight']);
    $db->bind(':meals', $data['meals']);
    $db->bind(':calories', $data['calories']);
    $db->bind(':protein', $data['protein']);
    $db->bind(':carbs', $data['carbs']);
    $db->bind(':fats', $data['fats']);
    $db->bind(':water_intake', $data['water_intake']);
    
    return $db->execute();
}

/**
 * Update an existing daily metric record
 */
function updateDailyMetrics($data) {
    $db = new Database();
    
    if (!isset($data['user_id']) && isset($_SESSION['user_id'])) {
        $data['user_id'] = $_SESSION['user_id'];
    }
    
    $db->query("UPDATE daily_metrics SET 
                sleep_start = :sleep_start, 
                sleep_end = :sleep_end, 
                stress_level = :stress_level, 
                energy_level = :energy_level, 
                motivation_level = :motivation_level, 
                weight = :weight, 
                meals = :meals, 
                calories = :calories, 
                protein = :protein, 
                carbs = :carbs, 
                fats = :fats, 
                water_intake = :water_intake
                WHERE date = :date AND user_id = :user_id");
    
    $db->bind(':date', $data['date']);
    $db->bind(':user_id', $data['user_id']);
    $db->bind(':sleep_start', $data['sleep_start']);
    $db->bind(':sleep_end', $data['sleep_end']);
    $db->bind(':stress_level', $data['stress_level']);
    $db->bind(':energy_level', $data['energy_level']);
    $db->bind(':motivation_level', $data['motivation_level']);
    $db->bind(':weight', $data['weight']);
    $db->bind(':meals', $data['meals']);
    $db->bind(':calories', $data['calories']);
    $db->bind(':protein', $data['protein']);
    $db->bind(':carbs', $data['carbs']);
    $db->bind(':fats', $data['fats']);
    $db->bind(':water_intake', $data['water_intake']);
    
    return $db->execute();
}

/**
 * Create a new training session
 */
function createTrainingSession($data) {
    $db = new Database();
    
    if (!isset($data['user_id']) && isset($_SESSION['user_id'])) {
        $data['user_id'] = $_SESSION['user_id'];
    }
    
    $db->query("INSERT INTO training_sessions (user_id, date, mesocycle_name, session_number, training_start, training_end) 
                VALUES (:user_id, :date, :mesocycle_name, :session_number, :training_start, :training_end)");
    
    $db->bind(':user_id', $data['user_id']);
    $db->bind(':date', $data['date']);
    $db->bind(':mesocycle_name', $data['mesocycle_name']);
    $db->bind(':session_number', $data['session_number']);
    $db->bind(':training_start', $data['training_start']);
    $db->bind(':training_end', $data['training_end']);
    
    if($db->execute()) {
        return $db->lastInsertId();
    } else {
        return false;
    }
}

/**
 * Update an existing training session
 */
function updateTrainingSession($data) {
    $db = new Database();
    
    if (!isset($data['user_id']) && isset($_SESSION['user_id'])) {
        $data['user_id'] = $_SESSION['user_id'];
    }
    
    $db->query("UPDATE training_sessions SET 
                date = :date, 
                mesocycle_name = :mesocycle_name, 
                session_number = :session_number, 
                training_start = :training_start, 
                training_end = :training_end
                WHERE id = :id AND user_id = :user_id");
    
    $db->bind(':id', $data['id']);
    $db->bind(':user_id', $data['user_id']);
    $db->bind(':date', $data['date']);
    $db->bind(':mesocycle_name', $data['mesocycle_name']);
    $db->bind(':session_number', $data['session_number']);
    $db->bind(':training_start', $data['training_start']);
    $db->bind(':training_end', $data['training_end']);
    
    return $db->execute();
}

/**
 * Create workout details with equipment field support
 * @param array $data Workout details data
 * @return bool Success status
 */
function createWorkoutDetails($data) {
    $db = new Database();
    
    // First, check and store muscle group if new
    $muscleGroupId = ensureMuscleGroupExists($data['muscle_group']);
    
    // Then check and store equipment if new
    $equipmentId = ensureEquipmentExists($data['equipment']);
    
    // Finally, check and store exercise if new
    $exerciseId = ensureExerciseExists($data['exercise_name'], $muscleGroupId, $equipmentId);
    
    // Insert the workout details
    $db->query("INSERT INTO workout_details (session_id, muscle_group, exercise_name, equipment, 
                pre_energy_level, pre_soreness_level, sets, reps, load_weight, rir, stimulus, fatigue_level) 
                VALUES (:session_id, :muscle_group, :exercise_name, :equipment,
                :pre_energy_level, :pre_soreness_level, :sets, :reps, :load_weight, :rir, :stimulus, :fatigue_level)");
    
    $db->bind(':session_id', $data['session_id']);
    $db->bind(':muscle_group', $data['muscle_group']);
    $db->bind(':exercise_name', $data['exercise_name']);
    $db->bind(':equipment', $data['equipment']);
    $db->bind(':pre_energy_level', $data['pre_energy_level']);
    $db->bind(':pre_soreness_level', $data['pre_soreness_level']);
    $db->bind(':sets', $data['sets']);
    $db->bind(':reps', $data['reps']);
    $db->bind(':load_weight', $data['load_weight']);
    $db->bind(':rir', $data['rir']);
    $db->bind(':stimulus', $data['stimulus']);
    $db->bind(':fatigue_level', $data['fatigue_level']);
    
    return $db->execute();
}

/**
 * Update workout details with equipment field support
 * @param array $data Workout details data
 * @return bool Success status
 */
function updateWorkoutDetails($data) {
    $db = new Database();
    
    // First, check and store muscle group if new
    $muscleGroupId = ensureMuscleGroupExists($data['muscle_group']);
    
    // Then check and store equipment if new
    $equipmentId = ensureEquipmentExists($data['equipment']);
    
    // Finally, check and store exercise if new
    $exerciseId = ensureExerciseExists($data['exercise_name'], $muscleGroupId, $equipmentId);
    
    // Update the workout details
    $db->query("UPDATE workout_details SET 
                muscle_group = :muscle_group, 
                exercise_name = :exercise_name,
                equipment = :equipment,
                pre_energy_level = :pre_energy_level, 
                pre_soreness_level = :pre_soreness_level, 
                sets = :sets, 
                reps = :reps, 
                load_weight = :load_weight, 
                rir = :rir, 
                stimulus = :stimulus, 
                fatigue_level = :fatigue_level
                WHERE id = :id");
    
    $db->bind(':id', $data['id']);
    $db->bind(':muscle_group', $data['muscle_group']);
    $db->bind(':exercise_name', $data['exercise_name']);
    $db->bind(':equipment', $data['equipment']);
    $db->bind(':pre_energy_level', $data['pre_energy_level']);
    $db->bind(':pre_soreness_level', $data['pre_soreness_level']);
    $db->bind(':sets', $data['sets']);
    $db->bind(':reps', $data['reps']);
    $db->bind(':load_weight', $data['load_weight']);
    $db->bind(':rir', $data['rir']);
    $db->bind(':stimulus', $data['stimulus']);
    $db->bind(':fatigue_level', $data['fatigue_level']);
    
    return $db->execute();
}

/**
 * Check if a muscle group exists, create it if it doesn't
 * @param string $muscleGroupName Muscle group name
 * @return int Muscle group ID
 */
function ensureMuscleGroupExists($muscleGroupName) {
    $db = new Database();
    
    // Trim and sanitize
    $muscleGroupName = trim(sanitize($muscleGroupName));
    
    // Check if muscle group exists
    $db->query("SELECT id FROM muscle_groups WHERE LOWER(name) = LOWER(:name)");
    $db->bind(':name', $muscleGroupName);
    $existingGroup = $db->single();
    
    if ($existingGroup) {
        return $existingGroup['id'];
    } else {
        // Create new muscle group
        $db->query("INSERT INTO muscle_groups (name) VALUES (:name)");
        $db->bind(':name', $muscleGroupName);
        $db->execute();
        return $db->lastInsertId();
    }
}

/**
 * Check if equipment exists, create it if it doesn't
 * @param string $equipmentName Equipment name
 * @return int Equipment ID
 */
function ensureEquipmentExists($equipmentName) {
    $db = new Database();
    
    // Trim and sanitize
    $equipmentName = trim(sanitize($equipmentName));
    
    // Check if equipment exists
    $db->query("SELECT id FROM equipment WHERE LOWER(name) = LOWER(:name)");
    $db->bind(':name', $equipmentName);
    $existingEquipment = $db->single();
    
    if ($existingEquipment) {
        return $existingEquipment['id'];
    } else {
        // Create new equipment
        $db->query("INSERT INTO equipment (name) VALUES (:name)");
        $db->bind(':name', $equipmentName);
        $db->execute();
        return $db->lastInsertId();
    }
}

/**
 * Check if an exercise exists, create it if it doesn't
 * @param string $exerciseName Exercise name
 * @param int $muscleGroupId Muscle group ID
 * @param int $equipmentId Equipment ID
 * @return int Exercise ID
 */
function ensureExerciseExists($exerciseName, $muscleGroupId, $equipmentId) {
    $db = new Database();
    
    // Trim and sanitize
    $exerciseName = trim(sanitize($exerciseName));
    
    // Check if exercise exists with the same muscle group and equipment
    $db->query("SELECT id FROM exercises WHERE LOWER(name) = LOWER(:name) AND muscle_group_id = :muscle_group_id AND equipment_id = :equipment_id");
    $db->bind(':name', $exerciseName);
    $db->bind(':muscle_group_id', $muscleGroupId);
    $db->bind(':equipment_id', $equipmentId);
    $existingExercise = $db->single();
    
    if ($existingExercise) {
        return $existingExercise['id'];
    } else {
        // Create new exercise
        $db->query("INSERT INTO exercises (name, muscle_group_id, equipment_id) VALUES (:name, :muscle_group_id, :equipment_id)");
        $db->bind(':name', $exerciseName);
        $db->bind(':muscle_group_id', $muscleGroupId);
        $db->bind(':equipment_id', $equipmentId);
        $db->execute();
        return $db->lastInsertId();
    }
}

/**
 * Delete a workout detail entry
 */
function deleteWorkoutDetails($id) {
    $db = new Database();
    $db->query("DELETE FROM workout_details WHERE id = :id");
    $db->bind(':id', $id);
    return $db->execute();
}

/**
 * Delete a training session and its associated workout details
 */
function deleteTrainingSession($id) {
    $db = new Database();
    $db->beginTransaction();
    
    try {
        $db->query("DELETE FROM workout_details WHERE session_id = :id");
        $db->bind(':id', $id);
        $db->execute();
        
        $db->query("DELETE FROM training_sessions WHERE id = :id");
        $db->bind(':id', $id);
        $db->execute();
        
        $db->commit();
        return true;
    } catch (Exception $e) {
        $db->rollBack();
        return false;
    }
}

/**
 * Delete a daily metric entry
 */
function deleteDailyMetrics($date) {
    $db = new Database();
    $db->query("DELETE FROM daily_metrics WHERE date = :date");
    $db->bind(':date', $date);
    return $db->execute();
}
<?php
require_once '../includes/functions.php';
require_once '../includes/user_functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('HTTP/1.1 401 Unauthorized');
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Get current user ID
$userId = $_SESSION['user_id'];

// Set headers for JSON response
header('Content-Type: application/json');

// Check action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_records':
        // Get all personal records for the current user
        $records = getPersonalRecords($userId);
        echo json_encode(['success' => true, 'data' => $records]);
        break;
        
    case 'get_exercise_records':
        // Get personal records for a specific exercise
        if (!isset($_GET['exercise_id'])) {
            echo json_encode(['success' => false, 'message' => 'Exercise ID is required']);
            exit;
        }
        
        $exerciseId = (int)$_GET['exercise_id'];
        $records = getExercisePersonalRecords($userId, $exerciseId);
        echo json_encode(['success' => true, 'data' => $records]);
        break;
        
    case 'acknowledge':
        // Handle post data for acknowledging a personal record
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['record_id'])) {
            echo json_encode(['success' => false, 'message' => 'Record ID is required']);
            exit;
        }
        
        $recordId = (int)$data['record_id'];
        $result = acknowledgePersonalRecord($userId, $recordId);
        
        echo json_encode($result);
        break;
    
    case 'unacknowledged':
        // Get count of unacknowledged personal records
        $count = getUnacknowledgedRecordsCount($userId);
        echo json_encode(['success' => true, 'count' => $count]);
        break;
        
    case 'regenerate_records':
        // This is an admin action to regenerate all personal records from workout history
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $result = regeneratePersonalRecords($userId);
            echo json_encode($result);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get all personal records for a user
 * @param int $userId User ID
 * @return array Personal records
 */
function getPersonalRecords($userId) {
    $db = new Database();
    
    $db->query("SELECT pr.*, 
                e.name as exercise_name, 
                mg.name as muscle_group, 
                eq.name as equipment
                FROM personal_records pr
                JOIN exercises e ON pr.exercise_id = e.id
                JOIN muscle_groups mg ON e.muscle_group_id = mg.id
                JOIN equipment eq ON e.equipment_id = eq.id
                WHERE pr.user_id = :user_id
                ORDER BY pr.date DESC, pr.is_acknowledged ASC");
    
    $db->bind(':user_id', $userId);
    return $db->resultSet();
}

/**
 * Get personal records for a specific exercise
 * @param int $userId User ID
 * @param int $exerciseId Exercise ID
 * @return array Personal records for the exercise
 */
function getExercisePersonalRecords($userId, $exerciseId) {
    $db = new Database();
    
    $db->query("SELECT pr.*, 
                e.name as exercise_name, 
                mg.name as muscle_group, 
                eq.name as equipment
                FROM personal_records pr
                JOIN exercises e ON pr.exercise_id = e.id
                JOIN muscle_groups mg ON e.muscle_group_id = mg.id
                JOIN equipment eq ON e.equipment_id = eq.id
                WHERE pr.user_id = :user_id AND e.id = :exercise_id
                ORDER BY pr.date DESC, pr.is_acknowledged ASC");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    return $db->resultSet();
}

/**
 * Acknowledge a personal record
 * @param int $userId User ID
 * @param int $recordId Record ID
 * @return array Result with success status and message
 */
function acknowledgePersonalRecord($userId, $recordId) {
    $db = new Database();
    
    // Verify the record belongs to the user
    $db->query("SELECT id FROM personal_records WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $recordId);
    $db->bind(':user_id', $userId);
    $record = $db->single();
    
    if (!$record) {
        return ['success' => false, 'message' => 'Record not found or not authorized'];
    }
    
    // Update the record to acknowledged
    $db->query("UPDATE personal_records SET is_acknowledged = 1 WHERE id = :id");
    $db->bind(':id', $recordId);
    
    if ($db->execute()) {
        return ['success' => true, 'message' => 'Record acknowledged successfully'];
    } else {
        return ['success' => false, 'message' => 'Failed to acknowledge record'];
    }
}

/**
 * Get count of unacknowledged personal records
 * @param int $userId User ID
 * @return int Count of unacknowledged records
 */
function getUnacknowledgedRecordsCount($userId) {
    $db = new Database();
    
    $db->query("SELECT COUNT(*) as count FROM personal_records 
               WHERE user_id = :user_id AND is_acknowledged = 0");
    $db->bind(':user_id', $userId);
    $result = $db->single();
    
    return $result ? (int)$result['count'] : 0;
}

/**
 * Regenerate all personal records from workout history
 * This can be used if records weren't properly generated before
 * @param int $userId User ID
 * @return array Result with success status and message
 */
function regeneratePersonalRecords($userId) {
    $db = new Database();
    
    try {
        // Begin transaction
        $db->beginTransaction();
        
        // Delete existing personal records for this user
        $db->query("DELETE FROM personal_records WHERE user_id = :user_id");
        $db->bind(':user_id', $userId);
        $db->execute();
        
        // Get all workout details for this user with explicit collation specified to fix the mismatch
        $db->query("SELECT wd.*, e.id as exercise_id, ts.date 
                  FROM workout_details wd
                  JOIN training_sessions ts ON wd.session_id = ts.id
                  JOIN exercises e ON CAST(wd.exercise_name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci = e.name
                  WHERE ts.user_id = :user_id
                  ORDER BY ts.date ASC");
        $db->bind(':user_id', $userId);
        $workouts = $db->resultSet();
        
        $generated = 0;
        $exercises = [];
        
        // Track best records per exercise
        foreach ($workouts as $workout) {
            if (empty($workout['sets']) || empty($workout['reps']) || empty($workout['load_weight'])) {
                continue; // Skip incomplete workouts
            }
            
            $exerciseId = $workout['exercise_id'];
            
            // Initialize exercise records if not set
            if (!isset($exercises[$exerciseId])) {
                $exercises[$exerciseId] = [
                    'best_weight' => 0,
                    'best_weight_date' => null,
                    'best_weight_workout_id' => null,
                    'best_reps' => 0,
                    'best_reps_date' => null,
                    'best_reps_workout_id' => null,
                    'best_volume' => 0,
                    'best_volume_date' => null,
                    'best_volume_workout_id' => null
                ];
            }
            
            // Check for weight PR
            $weight = floatval($workout['load_weight']);
            if ($weight > $exercises[$exerciseId]['best_weight']) {
                $exercises[$exerciseId]['best_weight'] = $weight;
                $exercises[$exerciseId]['best_weight_date'] = $workout['date'];
                $exercises[$exerciseId]['best_weight_workout_id'] = $workout['id'];
            }
            
            // Check for reps PR
            $reps = intval($workout['reps']);
            if ($reps > $exercises[$exerciseId]['best_reps']) {
                $exercises[$exerciseId]['best_reps'] = $reps;
                $exercises[$exerciseId]['best_reps_date'] = $workout['date'];
                $exercises[$exerciseId]['best_reps_workout_id'] = $workout['id'];
            }
            
            // Check for volume PR
            $volume = floatval($workout['sets']) * floatval($workout['reps']) * floatval($workout['load_weight']);
            if ($volume > $exercises[$exerciseId]['best_volume']) {
                $exercises[$exerciseId]['best_volume'] = $volume;
                $exercises[$exerciseId]['best_volume_date'] = $workout['date'];
                $exercises[$exerciseId]['best_volume_workout_id'] = $workout['id'];
            }
        }
        
        // After processing all workouts, insert only the latest PRs for each exercise/type
        foreach ($exercises as $exerciseId => $records) {
            // Insert weight PR
            if ($records['best_weight'] > 0) {
                $db->query("INSERT INTO personal_records 
                          (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged, created_at) 
                          VALUES 
                          (:user_id, :exercise_id, :record_value, 'weight', :date, :workout_detail_id, 1, NOW())");
                
                $db->bind(':user_id', $userId);
                $db->bind(':exercise_id', $exerciseId);
                $db->bind(':record_value', $records['best_weight']);
                $db->bind(':date', $records['best_weight_date']);
                $db->bind(':workout_detail_id', $records['best_weight_workout_id']);
                $db->execute();
                $generated++;
            }
            
            // Insert reps PR
            if ($records['best_reps'] > 0) {
                $db->query("INSERT INTO personal_records 
                          (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged, created_at) 
                          VALUES 
                          (:user_id, :exercise_id, :record_value, 'reps', :date, :workout_detail_id, 1, NOW())");
                
                $db->bind(':user_id', $userId);
                $db->bind(':exercise_id', $exerciseId);
                $db->bind(':record_value', $records['best_reps']);
                $db->bind(':date', $records['best_reps_date']);
                $db->bind(':workout_detail_id', $records['best_reps_workout_id']);
                $db->execute();
                $generated++;
            }
            
            // Insert volume PR
            if ($records['best_volume'] > 0) {
                $db->query("INSERT INTO personal_records 
                          (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged, created_at) 
                          VALUES 
                          (:user_id, :exercise_id, :record_value, 'volume', :date, :workout_detail_id, 1, NOW())");
                
                $db->bind(':user_id', $userId);
                $db->bind(':exercise_id', $exerciseId);
                $db->bind(':record_value', $records['best_volume']);
                $db->bind(':date', $records['best_volume_date']);
                $db->bind(':workout_detail_id', $records['best_volume_workout_id']);
                $db->execute();
                $generated++;
            }
        }
        
        // Commit transaction
        $db->commit();
        
        return [
            'success' => true, 
            'message' => "Successfully regenerated $generated personal records", 
            'records_generated' => $generated
        ];
    } catch (Exception $e) {
        // Rollback on error
        $db->rollBack();
        return ['success' => false, 'message' => 'Error regenerating personal records: ' . $e->getMessage()];
    }
}
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

// Check request method
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_records':
        // Get personal records
        getPersonalRecords($userId);
        break;
        
    case 'acknowledge':
        // Mark a PR as acknowledged
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        acknowledgeRecord($userId);
        break;
        
    case 'check_workout':
        // Check a workout for new PRs
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        checkWorkoutForPRs($userId);
        break;
        
    case 'unacknowledged':
        // Get count of unacknowledged PRs
        getUnacknowledgedCount($userId);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get all personal records for a user
 * @param int $userId User ID
 */
function getPersonalRecords($userId) {
    $db = new Database();
    
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    if ($limit < 1 || $limit > 100) {
        $limit = 10;
    }
    
    // Get personal records
    $db->query("SELECT pr.*, e.name AS exercise_name, e.muscle_group_id,
                m.name AS muscle_group, eq.name AS equipment
                FROM personal_records pr
                JOIN exercises e ON pr.exercise_id = e.id
                JOIN muscle_groups m ON e.muscle_group_id = m.id
                JOIN equipment eq ON e.equipment_id = eq.id
                WHERE pr.user_id = :user_id 
                ORDER BY pr.date DESC, pr.created_at DESC
                LIMIT :limit");
    
    $db->bind(':user_id', $userId);
    $db->bind(':limit', $limit);
    
    $records = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $records]);
}

/**
 * Mark a PR as acknowledged
 * @param int $userId User ID
 */
function acknowledgeRecord($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['record_id'])) {
        echo json_encode(['success' => false, 'message' => 'Record ID is required']);
        return;
    }
    
    $recordId = (int)$data['record_id'];
    
    $db = new Database();
    
    // Ensure the record belongs to the user
    $db->query("SELECT id FROM personal_records WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $recordId);
    $db->bind(':user_id', $userId);
    
    $record = $db->single();
    
    if (!$record) {
        echo json_encode(['success' => false, 'message' => 'Record not found or access denied']);
        return;
    }
    
    // Update the record
    $db->query("UPDATE personal_records SET is_acknowledged = 1 WHERE id = :id");
    $db->bind(':id', $recordId);
    
    if ($db->execute()) {
        echo json_encode(['success' => true, 'message' => 'Record acknowledged']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to acknowledge record']);
    }
}

/**
 * Check a workout for new personal records
 * @param int $userId User ID
 */
function checkWorkoutForPRs($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['workout_id'])) {
        echo json_encode(['success' => false, 'message' => 'Workout ID is required']);
        return;
    }
    
    $workoutId = (int)$data['workout_id'];
    
    $db = new Database();
    
    // Get the workout details
    $db->query("SELECT w.*, t.date, t.user_id, e.id AS exercise_id, e.name AS exercise_name
                FROM workout_details w
                JOIN training_sessions t ON w.session_id = t.id
                JOIN exercises e ON w.exercise_name = e.name
                WHERE w.id = :id AND t.user_id = :user_id");
    
    $db->bind(':id', $workoutId);
    $db->bind(':user_id', $userId);
    
    $workout = $db->single();
    
    if (!$workout) {
        echo json_encode(['success' => false, 'message' => 'Workout not found or access denied']);
        return;
    }
    
    // Check for PRs
    $prs = [];
    
    // Check for weight PR (1RM)
    $db->query("SELECT MAX(pr.record_value) AS max_weight
                FROM personal_records pr
                WHERE pr.user_id = :user_id 
                AND pr.exercise_id = :exercise_id
                AND pr.record_type = 'weight'");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $workout['exercise_id']);
    
    $maxWeightRecord = $db->single();
    $currentMaxWeight = $maxWeightRecord ? $maxWeightRecord['max_weight'] : 0;
    
    if ($workout['load_weight'] > $currentMaxWeight) {
        // This is a new weight PR
        $pr = createPersonalRecord(
            $userId,
            $workout['exercise_id'],
            $workout['load_weight'],
            'weight',
            $workout['date'],
            $workoutId
        );
        
        if ($pr) {
            $prs[] = [
                'id' => $pr,
                'type' => 'weight',
                'value' => $workout['load_weight'],
                'exercise' => $workout['exercise_name']
            ];
        }
    }
    
    // Check for volume PR (sets * reps * weight)
    $volume = $workout['sets'] * $workout['reps'] * $workout['load_weight'];
    
    $db->query("SELECT MAX(pr.record_value) AS max_volume
                FROM personal_records pr
                WHERE pr.user_id = :user_id 
                AND pr.exercise_id = :exercise_id
                AND pr.record_type = 'volume'");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $workout['exercise_id']);
    
    $maxVolumeRecord = $db->single();
    $currentMaxVolume = $maxVolumeRecord ? $maxVolumeRecord['max_volume'] : 0;
    
    if ($volume > $currentMaxVolume) {
        // This is a new volume PR
        $pr = createPersonalRecord(
            $userId,
            $workout['exercise_id'],
            $volume,
            'volume',
            $workout['date'],
            $workoutId
        );
        
        if ($pr) {
            $prs[] = [
                'id' => $pr,
                'type' => 'volume',
                'value' => $volume,
                'exercise' => $workout['exercise_name']
            ];
        }
    }
    
    // Check for reps PR (at this weight or higher)
    $db->query("SELECT MAX(pr.record_value) AS max_reps
                FROM personal_records pr
                JOIN workout_details w ON pr.workout_detail_id = w.id
                WHERE pr.user_id = :user_id 
                AND pr.exercise_id = :exercise_id
                AND pr.record_type = 'reps'
                AND w.load_weight >= :load_weight");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $workout['exercise_id']);
    $db->bind(':load_weight', $workout['load_weight']);
    
    $maxRepsRecord = $db->single();
    $currentMaxReps = $maxRepsRecord ? $maxRepsRecord['max_reps'] : 0;
    
    if ($workout['reps'] > $currentMaxReps && $workout['load_weight'] > 0) {
        // This is a new reps PR at this weight
        $pr = createPersonalRecord(
            $userId,
            $workout['exercise_id'],
            $workout['reps'],
            'reps',
            $workout['date'],
            $workoutId
        );
        
        if ($pr) {
            $prs[] = [
                'id' => $pr,
                'type' => 'reps',
                'value' => $workout['reps'],
                'weight' => $workout['load_weight'],
                'exercise' => $workout['exercise_name']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => count($prs) > 0 ? 'New personal records found!' : 'No new personal records.',
        'records' => $prs
    ]);
}

/**
 * Get count of unacknowledged personal records
 * @param int $userId User ID
 */
function getUnacknowledgedCount($userId) {
    $db = new Database();
    
    $db->query("SELECT COUNT(*) AS count
                FROM personal_records
                WHERE user_id = :user_id AND is_acknowledged = 0");
    
    $db->bind(':user_id', $userId);
    
    $result = $db->single();
    $count = $result ? $result['count'] : 0;
    
    echo json_encode([
        'success' => true,
        'count' => $count
    ]);
}

/**
 * Create a new personal record
 * @param int $userId User ID
 * @param int $exerciseId Exercise ID
 * @param float $recordValue Record value
 * @param string $recordType Record type (weight, reps, volume, time)
 * @param string $date Date of the record
 * @param int $workoutDetailId Workout detail ID
 * @return int|bool New record ID or false on failure
 */
function createPersonalRecord($userId, $exerciseId, $recordValue, $recordType, $date, $workoutDetailId) {
    $db = new Database();
    
    $db->query("INSERT INTO personal_records 
               (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged) 
               VALUES 
               (:user_id, :exercise_id, :record_value, :record_type, :date, :workout_detail_id, 0)");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    $db->bind(':record_value', $recordValue);
    $db->bind(':record_type', $recordType);
    $db->bind(':date', $date);
    $db->bind(':workout_detail_id', $workoutDetailId);
    
    if ($db->execute()) {
        return $db->lastInsertId();
    }
    
    return false;
}
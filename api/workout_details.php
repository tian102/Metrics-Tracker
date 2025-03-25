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

switch ($method) {
    case 'GET':
        // Get workout details for a specific session
        if (isset($_GET['session_id']) && is_numeric($_GET['session_id'])) {
            // Security check: Verify the session belongs to the current user
            $db = new Database();
            $db->query("SELECT id FROM training_sessions WHERE id = :id AND user_id = :user_id");
            $db->bind(':id', $_GET['session_id']);
            $db->bind(':user_id', $userId);
            $session = $db->single();
            
            if (!$session) {
                echo json_encode(['success' => false, 'message' => 'Session not found or access denied']);
                exit;
            }
            
            $workoutDetails = getWorkoutDetails($_GET['session_id']);
            echo json_encode(['success' => true, 'data' => $workoutDetails]);
        } elseif (isset($_GET['id']) && is_numeric($_GET['id'])) {
            // Get specific workout detail by ID
            $db = new Database();
            
            // Join with training_sessions to verify user ownership
            $db->query("SELECT w.* FROM workout_details w 
                        JOIN training_sessions t ON w.session_id = t.id 
                        WHERE w.id = :id AND t.user_id = :user_id");
            $db->bind(':id', $_GET['id']);
            $db->bind(':user_id', $userId);
            $workoutDetail = $db->single();
            
            if ($workoutDetail) {
                echo json_encode(['success' => true, 'data' => $workoutDetail]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Workout details not found or access denied']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        }
        break;
        
    case 'POST':
        // Create new workout details
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($data['session_id']) || !is_numeric($data['session_id'])) {
            echo json_encode(['success' => false, 'message' => 'Valid session ID is required']);
            exit;
        }
        
        // Security check: Verify the session belongs to the current user
        $db = new Database();
        $db->query("SELECT id FROM training_sessions WHERE id = :id AND user_id = :user_id");
        $db->bind(':id', $data['session_id']);
        $db->bind(':user_id', $userId);
        $session = $db->single();
        
        if (!$session) {
            echo json_encode(['success' => false, 'message' => 'Session not found or access denied']);
            exit;
        }
        
        // Process and sanitize data
        $processedData = [
            'session_id' => (int)sanitize($data['session_id']),
            'muscle_group' => isset($data['muscle_group']) ? sanitize($data['muscle_group']) : null,
            'exercise_name' => isset($data['exercise_name']) ? sanitize($data['exercise_name']) : null,
            'equipment' => isset($data['equipment']) ? sanitize($data['equipment']) : null, // New equipment field
            'pre_energy_level' => isset($data['pre_energy_level']) ? (int)sanitize($data['pre_energy_level']) : null,
            'pre_soreness_level' => isset($data['pre_soreness_level']) ? (int)sanitize($data['pre_soreness_level']) : null,
            'sets' => isset($data['sets']) ? (int)sanitize($data['sets']) : null,
            'reps' => isset($data['reps']) ? (int)sanitize($data['reps']) : null,
            'load_weight' => isset($data['load_weight']) ? (float)sanitize($data['load_weight']) : null,
            'rir' => isset($data['rir']) ? (int)sanitize($data['rir']) : null,
            'stimulus' => isset($data['stimulus']) ? (int)sanitize($data['stimulus']) : null,
            'fatigue_level' => isset($data['fatigue_level']) ? (int)sanitize($data['fatigue_level']) : null
        ];
        
        // Create workout details
        if ($workoutDetailId = createWorkoutDetails($processedData)) {
            // Check for personal records after creating workout detail
            checkForPersonalRecords($processedData, $userId, $workoutDetailId);
            
            echo json_encode(['success' => true, 'message' => 'Workout details added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add workout details']);
        }
        break;
        
    case 'PUT':
        // Update existing workout details
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($data['id']) || !is_numeric($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Valid workout details ID is required']);
            exit;
        }
        
        // Security check: Verify ownership by checking if the session belongs to the current user
        $db = new Database();
        $db->query("SELECT t.user_id FROM workout_details w 
                    JOIN training_sessions t ON w.session_id = t.id 
                    WHERE w.id = :id");
        $db->bind(':id', $data['id']);
        $workoutDetail = $db->single();
        
        if (!$workoutDetail || $workoutDetail['user_id'] != $userId) {
            echo json_encode(['success' => false, 'message' => 'You do not have permission to modify this workout detail']);
            exit;
        }
        
        // Process and sanitize data
        $processedData = [
            'id' => (int)sanitize($data['id']),
            'muscle_group' => isset($data['muscle_group']) ? sanitize($data['muscle_group']) : null,
            'exercise_name' => isset($data['exercise_name']) ? sanitize($data['exercise_name']) : null,
            'equipment' => isset($data['equipment']) ? sanitize($data['equipment']) : null, // New equipment field
            'pre_energy_level' => isset($data['pre_energy_level']) ? (int)sanitize($data['pre_energy_level']) : null,
            'pre_soreness_level' => isset($data['pre_soreness_level']) ? (int)sanitize($data['pre_soreness_level']) : null,
            'sets' => isset($data['sets']) ? (int)sanitize($data['sets']) : null,
            'reps' => isset($data['reps']) ? (int)sanitize($data['reps']) : null,
            'load_weight' => isset($data['load_weight']) ? (float)sanitize($data['load_weight']) : null,
            'rir' => isset($data['rir']) ? (int)sanitize($data['rir']) : null,
            'stimulus' => isset($data['stimulus']) ? (int)sanitize($data['stimulus']) : null,
            'fatigue_level' => isset($data['fatigue_level']) ? (int)sanitize($data['fatigue_level']) : null
        ];
        
        // Update workout details
        if (updateWorkoutDetails($processedData)) {
            // Check for personal records after updating workout detail
            checkForPersonalRecords($processedData, $userId, $processedData['id']);
            
            echo json_encode(['success' => true, 'message' => 'Workout details updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update workout details']);
        }
        break;
        
    case 'DELETE':
        // Delete workout details
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || !is_numeric($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Valid workout details ID is required']);
            exit;
        }
        
        // Security check: Verify ownership by checking if the session belongs to the current user
        $db = new Database();
        $db->query("SELECT t.user_id FROM workout_details w 
                    JOIN training_sessions t ON w.session_id = t.id 
                    WHERE w.id = :id");
        $db->bind(':id', $data['id']);
        $workoutDetail = $db->single();
        
        if (!$workoutDetail || $workoutDetail['user_id'] != $userId) {
            echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this workout detail']);
            exit;
        }
        
        if (deleteWorkoutDetails($data['id'])) {
            echo json_encode(['success' => true, 'message' => 'Workout details deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete workout details']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}

/**
 * Check and record personal records based on workout details
 * @param array $workoutData The workout details data
 * @param int $userId The user ID
 * @param int $workoutDetailId The workout detail ID
 */
function checkForPersonalRecords($workoutData, $userId, $workoutDetailId) {
    if (empty($workoutData['exercise_name']) || empty($workoutData['sets']) || 
        empty($workoutData['reps']) || empty($workoutData['load_weight'])) {
        return; // Skip if essential workout data is missing
    }
    
    $db = new Database();
    
    // Get exercise ID using explicit collation
    $db->query("SELECT id FROM exercises WHERE CAST(name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci = :name");
    $db->bind(':name', $workoutData['exercise_name']);
    $exercise = $db->single();
    
    if (!$exercise) {
        return; // Exercise not found in database
    }
    
    $exerciseId = $exercise['id'];
    $date = date('Y-m-d'); // Use current date or get from workout if available
    
    if (!empty($workoutData['session_id'])) {
        // Get session date
        $db->query("SELECT date FROM training_sessions WHERE id = :id");
        $db->bind(':id', $workoutData['session_id']);
        $session = $db->single();
        
        if ($session && !empty($session['date'])) {
            $date = $session['date'];
        }
    }
    
    // Check for weight PR (maximum weight used)
    checkWeightPR($userId, $exerciseId, $workoutData['load_weight'], $date, $workoutDetailId);
    
    // Check for reps PR (maximum reps with this weight or higher)
    checkRepsPR($userId, $exerciseId, $workoutData['reps'], $workoutData['load_weight'], $date, $workoutDetailId);
    
    // Check for volume PR (sets * reps * weight)
    $volume = $workoutData['sets'] * $workoutData['reps'] * $workoutData['load_weight'];
    checkVolumePR($userId, $exerciseId, $volume, $date, $workoutDetailId);
}

/**
 * Check and record a weight personal record
 * @param int $userId The user ID
 * @param int $exerciseId The exercise ID
 * @param float $weight The weight lifted
 * @param string $date The date of the workout
 * @param int $workoutDetailId The workout detail ID
 */
function checkWeightPR($userId, $exerciseId, $weight, $date, $workoutDetailId) {
    $db = new Database();
    
    // Get current weight PR for this exercise
    $db->query("SELECT record_value FROM personal_records 
                WHERE user_id = :user_id AND exercise_id = :exercise_id 
                AND record_type = 'weight' 
                ORDER BY record_value DESC 
                LIMIT 1");
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    $currentPR = $db->single();
    
    // If no PR exists or this weight is higher
    if (!$currentPR || $weight > $currentPR['record_value']) {
        // First delete any existing weight PRs for this exercise (to keep only the latest)
        $db->query("DELETE FROM personal_records 
                   WHERE user_id = :user_id 
                   AND exercise_id = :exercise_id 
                   AND record_type = 'weight'");
        $db->bind(':user_id', $userId);
        $db->bind(':exercise_id', $exerciseId);
        $db->execute();
        
        // Insert new PR
        $db->query("INSERT INTO personal_records 
                  (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged, created_at) 
                  VALUES 
                  (:user_id, :exercise_id, :record_value, 'weight', :date, :workout_detail_id, 0, NOW())");
        
        $db->bind(':user_id', $userId);
        $db->bind(':exercise_id', $exerciseId);
        $db->bind(':record_value', $weight);
        $db->bind(':date', $date);
        $db->bind(':workout_detail_id', $workoutDetailId);
        
        $db->execute();
        
        // Log the PR
        error_log("New weight PR for user $userId, exercise $exerciseId: $weight kg");
    }
}

/**
 * Check and record a reps personal record
 * @param int $userId The user ID
 * @param int $exerciseId The exercise ID
 * @param int $reps The number of reps
 * @param float $weight The weight used
 * @param string $date The date of the workout
 * @param int $workoutDetailId The workout detail ID
 */
function checkRepsPR($userId, $exerciseId, $reps, $weight, $date, $workoutDetailId) {
    $db = new Database();
    
    // Get current reps PR for this exercise with this weight or higher - with explicit collation
    $db->query("SELECT wd.reps as record_value
                FROM workout_details wd
                JOIN training_sessions ts ON wd.session_id = ts.id
                JOIN exercises e ON CAST(wd.exercise_name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci = e.name
                WHERE ts.user_id = :user_id 
                AND e.id = :exercise_id
                AND wd.load_weight >= :weight
                ORDER BY wd.reps DESC
                LIMIT 1");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    $db->bind(':weight', $weight);
    $currentPR = $db->single();
    
    // If no PR exists or this reps count is higher
    if (!$currentPR || $reps > $currentPR['record_value']) {
        // First delete any existing reps PRs for this exercise (to keep only the latest)
        $db->query("DELETE FROM personal_records 
                   WHERE user_id = :user_id 
                   AND exercise_id = :exercise_id 
                   AND record_type = 'reps'");
        $db->bind(':user_id', $userId);
        $db->bind(':exercise_id', $exerciseId);
        $db->execute();
        
        // Insert new PR
        $db->query("INSERT INTO personal_records 
                  (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged, created_at) 
                  VALUES 
                  (:user_id, :exercise_id, :record_value, 'reps', :date, :workout_detail_id, 0, NOW())");
        
        $db->bind(':user_id', $userId);
        $db->bind(':exercise_id', $exerciseId);
        $db->bind(':record_value', $reps);
        $db->bind(':date', $date);
        $db->bind(':workout_detail_id', $workoutDetailId);
        
        $db->execute();
        
        // Log the PR
        error_log("New reps PR for user $userId, exercise $exerciseId: $reps reps with $weight kg");
    }
}

/**
 * Check and record a volume personal record
 * @param int $userId The user ID
 * @param int $exerciseId The exercise ID
 * @param float $volume The volume (sets*reps*weight)
 * @param string $date The date of the workout
 * @param int $workoutDetailId The workout detail ID
 */
function checkVolumePR($userId, $exerciseId, $volume, $date, $workoutDetailId) {
    $db = new Database();
    
    // Get current volume PR for this exercise
    $db->query("SELECT record_value FROM personal_records 
                WHERE user_id = :user_id AND exercise_id = :exercise_id 
                AND record_type = 'volume' 
                ORDER BY record_value DESC 
                LIMIT 1");
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    $currentPR = $db->single();
    
    // If no PR exists or this volume is higher
    if (!$currentPR || $volume > $currentPR['record_value']) {
        // First delete any existing volume PRs for this exercise (to keep only the latest)
        $db->query("DELETE FROM personal_records 
                   WHERE user_id = :user_id 
                   AND exercise_id = :exercise_id 
                   AND record_type = 'volume'");
        $db->bind(':user_id', $userId);
        $db->bind(':exercise_id', $exerciseId);
        $db->execute();
        
        // Insert new PR
        $db->query("INSERT INTO personal_records 
                  (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged, created_at) 
                  VALUES 
                  (:user_id, :exercise_id, :record_value, 'volume', :date, :workout_detail_id, 0, NOW())");
        
        $db->bind(':user_id', $userId);
        $db->bind(':exercise_id', $exerciseId);
        $db->bind(':record_value', $volume);
        $db->bind(':date', $date);
        $db->bind(':workout_detail_id', $workoutDetailId);
        
        $db->execute();
        
        // Log the PR
        error_log("New volume PR for user $userId, exercise $exerciseId: $volume kg total volume");
    }
}
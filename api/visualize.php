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

// Get current user ID from session - not from parameters to ensure security
$userId = $_SESSION['user_id'];

// Set headers for JSON response
header('Content-Type: application/json');

// Check action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_data':
        if (!isset($_GET['metric'])) {
            echo json_encode(['success' => false, 'message' => 'Metric parameter is required']);
            exit;
        }
        
        $metric = $_GET['metric'];
        
        // Get data for the specified metric, filtered by current user
        $data = getMetricData($metric, $userId);
        
        echo json_encode(['success' => true, 'data' => $data]);
        break;
        
    case 'get_exercise_progress':
        if (!isset($_GET['exercise'])) {
            echo json_encode(['success' => false, 'message' => 'Exercise parameter is required']);
            exit;
        }
        
        $exercise = $_GET['exercise'];
        
        // Get exercise progress data, filtered by current user
        $data = getExerciseProgressData($exercise, $userId);
        
        echo json_encode(['success' => true, 'data' => $data]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get data for a specific metric
 * @param string $metric Metric name
 * @param int $userId User ID - used to filter data by the current user
 * @return array Data for the metric
 */
function getMetricData($metric, $userId) {
    $db = new Database();
    
    // For weight data
    if ($metric === 'weight') {
        $db->query("SELECT date, weight as value FROM daily_metrics 
                   WHERE user_id = :userId AND weight IS NOT NULL 
                   ORDER BY date ASC");
        $db->bind(':userId', $userId);
        return $db->resultSet();
    }
    
    // For sleep data
    else if ($metric === 'sleep') {
        $db->query("SELECT date, 
                   ROUND(TIMESTAMPDIFF(HOUR, sleep_start, sleep_end) + 
                   (TIMESTAMPDIFF(MINUTE, sleep_start, sleep_end) % 60) / 60, 1) as value 
                   FROM daily_metrics 
                   WHERE user_id = :userId AND sleep_start IS NOT NULL AND sleep_end IS NOT NULL 
                   ORDER BY date ASC");
        $db->bind(':userId', $userId);
        return $db->resultSet();
    }
    
    // For energy, stress, motivation data
    else if ($metric === 'energy' || $metric === 'stress' || $metric === 'motivation') {
        $fieldMap = [
            'energy' => 'energy_level',
            'stress' => 'stress_level',
            'motivation' => 'motivation_level'
        ];
        
        $field = $fieldMap[$metric];
        
        $db->query("SELECT date, $field as value FROM daily_metrics 
                   WHERE user_id = :userId AND $field IS NOT NULL 
                   ORDER BY date ASC");
        $db->bind(':userId', $userId);
        return $db->resultSet();
    }
    
    // For nutrition data
    else if (in_array($metric, ['calories', 'protein', 'carbs', 'fats', 'water_intake'])) {
        $db->query("SELECT date, $metric as value FROM daily_metrics 
                   WHERE user_id = :userId AND $metric IS NOT NULL 
                   ORDER BY date ASC");
        $db->bind(':userId', $userId);
        return $db->resultSet();
    }
    
    // For muscle group volume data
    else if ($metric === 'muscle_group_volume') {
        $db->query("SELECT 
                   wd.muscle_group,
                   SUM(wd.sets * wd.reps * wd.load_weight) as total_volume
                   FROM workout_details wd
                   JOIN training_sessions ts ON wd.session_id = ts.id
                   WHERE ts.user_id = :userId
                   GROUP BY wd.muscle_group
                   ORDER BY total_volume DESC");
        $db->bind(':userId', $userId);
        return $db->resultSet();
    }
    
    // For training duration data
    else if ($metric === 'training_duration') {
        $db->query("SELECT 
                   date,
                   TIMESTAMPDIFF(MINUTE, training_start, training_end) as value
                   FROM training_sessions
                   WHERE user_id = :userId
                   AND training_start IS NOT NULL 
                   AND training_end IS NOT NULL
                   ORDER BY date ASC");
        $db->bind(':userId', $userId);
        return $db->resultSet();
    }
    
    // Safe default
    return [];
}

/**
 * Get progress data for a specific exercise
 * @param string $exercise Exercise name
 * @param int $userId User ID - used to filter data by the current user
 * @return array Exercise progress data
 */
function getExerciseProgressData($exercise, $userId) {
    $db = new Database();
    
    $db->query("SELECT 
               ts.date,
               wd.sets,
               wd.reps,
               wd.load_weight,
               (wd.sets * wd.reps * wd.load_weight) as volume
               FROM workout_details wd
               JOIN training_sessions ts ON wd.session_id = ts.id
               WHERE ts.user_id = :userId
               AND wd.exercise_name = :exercise
               ORDER BY ts.date ASC");
    
    $db->bind(':userId', $userId);
    $db->bind(':exercise', $exercise);
    
    return $db->resultSet();
}
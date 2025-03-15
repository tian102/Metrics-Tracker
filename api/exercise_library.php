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
        // Get exercise library data
        if (isset($_GET['action']) && $_GET['action'] === 'search') {
            // Search exercises based on criteria
            searchExercises($userId);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'favorites') {
            // Get user's favorite/most used exercises
            getFavoriteExercises($userId);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'muscle_groups') {
            // Get list of muscle groups
            getMuscleGroups();
        } elseif (isset($_GET['action']) && $_GET['action'] === 'equipment') {
            // Get list of equipment
            getEquipment();
        } else {
            // Default: return basic stats about the library
            getLibraryStats();
        }
        break;
        
    case 'POST':
        // Track exercise usage
        if (isset($_GET['action']) && $_GET['action'] === 'track_usage') {
            trackExerciseUsage($userId);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}

/**
 * Search exercises based on provided criteria
 * @param int $userId User ID for personalization
 */
function searchExercises($userId) {
    $db = new Database();
    
    // Build query based on search parameters
    $query = "SELECT e.id, e.name AS exercise_name, m.name AS muscle_group, eq.name AS equipment, 
              (SELECT usage_count FROM user_exercise_history WHERE user_id = :user_id AND exercise_id = e.id) AS usage_count
              FROM exercises e
              JOIN muscle_groups m ON e.muscle_group_id = m.id
              JOIN equipment eq ON e.equipment_id = eq.id
              WHERE 1=1";
    
    $params = [':user_id' => $userId];
    
    // Apply muscle group filter
    if (isset($_GET['muscle_group']) && !empty($_GET['muscle_group'])) {
        $query .= " AND m.name = :muscle_group";
        $params[':muscle_group'] = $_GET['muscle_group'];
    }
    
    // Apply equipment filter
    if (isset($_GET['equipment']) && !empty($_GET['equipment'])) {
        $query .= " AND eq.name = :equipment";
        $params[':equipment'] = $_GET['equipment'];
    }
    
    // Apply search term filter
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $query .= " AND (e.name LIKE :search OR m.name LIKE :search OR eq.name LIKE :search)";
        $params[':search'] = '%' . $_GET['search'] . '%';
    }
    
    // Order by specified field or default to name
    $orderBy = isset($_GET['order_by']) ? $_GET['order_by'] : 'exercise_name';
    $direction = isset($_GET['direction']) && strtolower($_GET['direction']) === 'desc' ? 'DESC' : 'ASC';
    
    // Sanitize order by to prevent SQL injection
    $allowedOrderFields = ['exercise_name', 'muscle_group', 'equipment', 'usage_count'];
    if (!in_array($orderBy, $allowedOrderFields)) {
        $orderBy = 'exercise_name';
    }
    
    // Add order by clause
    $query .= " ORDER BY " . $orderBy . " " . $direction;
    
    // Execute query
    $db->query($query);
    
    // Bind parameters
    foreach ($params as $param => $value) {
        $db->bind($param, $value);
    }
    
    // Get results
    $exercises = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $exercises]);
}

/**
 * Get user's favorite/most used exercises
 * @param int $userId User ID
 */
function getFavoriteExercises($userId) {
    $db = new Database();
    
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    if ($limit <= 0 || $limit > 100) {
        $limit = 10;
    }
    
    $db->query("SELECT e.id, e.name AS exercise_name, m.name AS muscle_group, eq.name AS equipment, 
                h.usage_count, h.last_used
                FROM user_exercise_history h
                JOIN exercises e ON h.exercise_id = e.id
                JOIN muscle_groups m ON e.muscle_group_id = m.id
                JOIN equipment eq ON e.equipment_id = eq.id
                WHERE h.user_id = :user_id
                ORDER BY h.usage_count DESC, h.last_used DESC
                LIMIT :limit");
    
    $db->bind(':user_id', $userId);
    $db->bind(':limit', $limit);
    
    $favorites = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $favorites]);
}

/**
 * Get list of all muscle groups
 */
function getMuscleGroups() {
    $db = new Database();
    
    $db->query("SELECT id, name FROM muscle_groups ORDER BY name");
    $muscleGroups = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $muscleGroups]);
}

/**
 * Get list of all equipment
 */
function getEquipment() {
    $db = new Database();
    
    $db->query("SELECT id, name FROM equipment ORDER BY name");
    $equipment = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $equipment]);
}

/**
 * Get basic stats about the exercise library
 */
function getLibraryStats() {
    $db = new Database();
    
    // Get count of exercises
    $db->query("SELECT COUNT(*) as count FROM exercises");
    $exerciseCount = $db->single()['count'];
    
    // Get count of muscle groups
    $db->query("SELECT COUNT(*) as count FROM muscle_groups");
    $muscleGroupCount = $db->single()['count'];
    
    // Get count of equipment
    $db->query("SELECT COUNT(*) as count FROM equipment");
    $equipmentCount = $db->single()['count'];
    
    echo json_encode([
        'success' => true, 
        'data' => [
            'exercise_count' => $exerciseCount,
            'muscle_group_count' => $muscleGroupCount,
            'equipment_count' => $equipmentCount
        ]
    ]);
}

/**
 * Track when a user uses an exercise
 * @param int $userId User ID
 */
function trackExerciseUsage($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['exercise_id']) || !is_numeric($data['exercise_id'])) {
        echo json_encode(['success' => false, 'message' => 'Valid exercise ID is required']);
        exit;
    }
    
    $exerciseId = (int)$data['exercise_id'];
    
    $db = new Database();
    
    // Check if the exercise exists
    $db->query("SELECT id FROM exercises WHERE id = :id");
    $db->bind(':id', $exerciseId);
    $exercise = $db->single();
    
    if (!$exercise) {
        echo json_encode(['success' => false, 'message' => 'Exercise not found']);
        exit;
    }
    
    // Update or insert usage history
    $db->query("INSERT INTO user_exercise_history (user_id, exercise_id, usage_count, last_used) 
                VALUES (:user_id, :exercise_id, 1, NOW()) 
                ON DUPLICATE KEY UPDATE 
                usage_count = usage_count + 1, 
                last_used = NOW()");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    
    if ($db->execute()) {
        echo json_encode(['success' => true, 'message' => 'Exercise usage tracked successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to track exercise usage']);
    }
}
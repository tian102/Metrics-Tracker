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

// Handle default request (without any action parameter)
if ($method === 'GET' && (!isset($_GET['action']) || $_GET['action'] === '')) {
    // Get all exercise data - default behavior
    getAllExerciseData();
    exit;
}

// Handle specific actions
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_all':
        getAllExerciseData();
        break;
        
    case 'get_filtered':
        getAllExerciseData(); // For now, same as get_all
        break;
        
    case 'add_muscle_group':
        // Add new muscle group
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || empty($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Muscle group name is required']);
            exit;
        }
        
        $muscleGroupId = ensureMuscleGroupExists(sanitize($data['name']));
        
        echo json_encode(['success' => true, 'message' => 'Muscle group added successfully', 'id' => $muscleGroupId]);
        break;
        
    case 'add_equipment':
        // Add new equipment
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || empty($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Equipment name is required']);
            exit;
        }
        
        $equipmentId = ensureEquipmentExists(sanitize($data['name']));
        
        echo json_encode(['success' => true, 'message' => 'Equipment added successfully', 'id' => $equipmentId]);
        break;
        
    case 'add_exercise':
        // Add new exercise
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || empty($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Exercise name is required']);
            exit;
        }
        
        if (!isset($data['muscle_group']) || empty($data['muscle_group'])) {
            echo json_encode(['success' => false, 'message' => 'Muscle group is required']);
            exit;
        }
        
        if (!isset($data['equipment']) || empty($data['equipment'])) {
            echo json_encode(['success' => false, 'message' => 'Equipment is required']);
            exit;
        }
        
        $muscleGroupId = ensureMuscleGroupExists(sanitize($data['muscle_group']));
        $equipmentId = ensureEquipmentExists(sanitize($data['equipment']));
        $exerciseId = ensureExerciseExists(sanitize($data['name']), $muscleGroupId, $equipmentId);
        
        echo json_encode(['success' => true, 'message' => 'Exercise added successfully', 'id' => $exerciseId]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get all exercise data including muscle groups, equipment, and exercises
 */
function getAllExerciseData() {
    $db = new Database();
    
    // Get muscle groups
    $db->query("SELECT * FROM muscle_groups ORDER BY name");
    $muscleGroups = $db->resultSet();
    
    // Get equipment
    $db->query("SELECT * FROM equipment ORDER BY name");
    $equipment = $db->resultSet();
    
    // Get exercises with relationships
    $db->query("SELECT e.id, e.name, e.muscle_group_id, e.equipment_id, mg.name as muscle_group, eq.name as equipment 
                FROM exercises e
                JOIN muscle_groups mg ON e.muscle_group_id = mg.id
                JOIN equipment eq ON e.equipment_id = eq.id
                ORDER BY e.name");
    $exercises = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'muscle_groups' => $muscleGroups,
            'equipment' => $equipment,
            'exercises' => $exercises
        ]
    ]);
    exit;
}
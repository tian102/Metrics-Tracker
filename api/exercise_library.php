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

// Set headers for JSON response
header('Content-Type: application/json');

// Get action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'muscle_groups':
        // Get all muscle groups
        $db = new Database();
        $db->query("SELECT id, name FROM muscle_groups ORDER BY name");
        $muscleGroups = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $muscleGroups]);
        break;
        
    case 'equipment':
        // Get all equipment
        $db = new Database();
        $db->query("SELECT id, name FROM equipment ORDER BY name");
        $equipment = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $equipment]);
        break;
        
    case 'search':
        // Get all exercises with their relationships
        $db = new Database();
        $db->query("SELECT e.id, e.name, e.description, e.muscle_group_id, mg.name as muscle_group, 
                    e.equipment_id, eq.name as equipment 
                   FROM exercises e
                   JOIN muscle_groups mg ON e.muscle_group_id = mg.id
                   JOIN equipment eq ON e.equipment_id = eq.id
                   ORDER BY e.name");
        $exercises = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $exercises]);
        break;
        
    case 'filter':
        // Filter exercises by muscle group and/or equipment
        $muscleGroupId = isset($_GET['muscle_group_id']) ? $_GET['muscle_group_id'] : null;
        $equipmentId = isset($_GET['equipment_id']) ? $_GET['equipment_id'] : null;
        
        $db = new Database();
        
        // Build the query based on provided filters
        $query = "SELECT e.id, e.name, e.description, e.muscle_group_id, mg.name as muscle_group, 
                 e.equipment_id, eq.name as equipment 
                 FROM exercises e
                 JOIN muscle_groups mg ON e.muscle_group_id = mg.id
                 JOIN equipment eq ON e.equipment_id = eq.id
                 WHERE 1=1";
        
        $params = [];
        
        if ($muscleGroupId) {
            $query .= " AND e.muscle_group_id = :muscle_group_id";
            $params[':muscle_group_id'] = $muscleGroupId;
        }
        
        if ($equipmentId) {
            $query .= " AND e.equipment_id = :equipment_id";
            $params[':equipment_id'] = $equipmentId;
        }
        
        $query .= " ORDER BY e.name";
        
        $db->query($query);
        
        foreach ($params as $param => $value) {
            $db->bind($param, $value);
        }
        
        $exercises = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $exercises]);
        break;
        
    // Additional cases for adding new entities (muscle groups, equipment, exercises)
    case 'add_muscle_group':
        // Add a new muscle group
        $data = json_decode(file_get_contents('php://input'), true);
    
        // Validate input
        if (!isset($data['name']) || empty($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Muscle group name is required']);
            return;
        }
        
        $name = sanitize($data['name']);
        
        // Check if muscle group already exists
        $db = new Database();
        $db->query("SELECT id FROM muscle_groups WHERE LOWER(name) = LOWER(:name)");
        $db->bind(':name', $name);
        $existingGroup = $db->single();
        
        if ($existingGroup) {
            // Return success with the existing ID to avoid duplicates
            echo json_encode([
                'success' => true, 
                'message' => 'Muscle group already exists', 
                'id' => $existingGroup['id'],
                'name' => $name
            ]);
            return;
        }
        
        // Create new muscle group
        $db->query("INSERT INTO muscle_groups (name) VALUES (:name)");
        $db->bind(':name', $name);
        
        try {
            $db->execute();
            $newId = $db->lastInsertId();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Muscle group added successfully', 
                'id' => $newId,
                'name' => $name
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Failed to add muscle group: ' . $e->getMessage()]);
        }
        break;
        
    case 'add_equipment':
        // Add a new equipment type
        $data = json_decode(file_get_contents('php://input'), true);
    
        // Validate input
        if (!isset($data['name']) || empty($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Equipment name is required']);
            return;
        }
        
        $name = sanitize($data['name']);
        
        // Check if equipment already exists
        $db = new Database();
        $db->query("SELECT id FROM equipment WHERE LOWER(name) = LOWER(:name)");
        $db->bind(':name', $name);
        $existingEquipment = $db->single();
        
        if ($existingEquipment) {
            // Return success with the existing ID to avoid duplicates
            echo json_encode([
                'success' => true, 
                'message' => 'Equipment already exists', 
                'id' => $existingEquipment['id'],
                'name' => $name
            ]);
            return;
        }
        
        // Create new equipment
        $db->query("INSERT INTO equipment (name) VALUES (:name)");
        $db->bind(':name', $name);
        
        try {
            $db->execute();
            $newId = $db->lastInsertId();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Equipment added successfully', 
                'id' => $newId,
                'name' => $name
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Failed to add equipment: ' . $e->getMessage()]);
        }
        break;
        
    case 'add_exercise_name':
        // Add a new exercise
        $data = json_decode(file_get_contents('php://input'), true);
    
        // Validate input
        if (!isset($data['name']) || empty($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Exercise name is required']);
            return;
        }
        
        if (!isset($data['muscle_group']) || empty($data['muscle_group'])) {
            echo json_encode(['success' => false, 'message' => 'Muscle group is required']);
            return;
        }
        
        if (!isset($data['equipment']) || empty($data['equipment'])) {
            echo json_encode(['success' => false, 'message' => 'Equipment is required']);
            return;
        }
        
        $name = sanitize($data['name']);
        $muscleGroupName = sanitize($data['muscle_group']);
        $equipmentName = sanitize($data['equipment']);
        
        // Get or create muscle group
        $muscleGroupId = ensureMuscleGroupExists($muscleGroupName);
        
        // Get or create equipment
        $equipmentId = ensureEquipmentExists($equipmentName);
        
        // Check if exercise already exists
        $db = new Database();
        $db->query("SELECT id FROM exercises 
                    WHERE LOWER(name) = LOWER(:name) 
                    AND muscle_group_id = :muscle_group_id 
                    AND equipment_id = :equipment_id");
        
        $db->bind(':name', $name);
        $db->bind(':muscle_group_id', $muscleGroupId);
        $db->bind(':equipment_id', $equipmentId);
        
        $existingExercise = $db->single();
        
        if ($existingExercise) {
            // Return success with the existing ID to avoid duplicates
            echo json_encode([
                'success' => true, 
                'message' => 'Exercise already exists', 
                'id' => $existingExercise['id'],
                'name' => $name,
                'muscle_group' => $muscleGroupName,
                'equipment' => $equipmentName
            ]);
            return;
        }
        
        // Create new exercise
        $db->query("INSERT INTO exercises (name, muscle_group_id, equipment_id) 
                    VALUES (:name, :muscle_group_id, :equipment_id)");
        
        $db->bind(':name', $name);
        $db->bind(':muscle_group_id', $muscleGroupId);
        $db->bind(':equipment_id', $equipmentId);
        
        try {
            $db->execute();
            $newId = $db->lastInsertId();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Exercise added successfully', 
                'id' => $newId,
                'name' => $name,
                'muscle_group' => $muscleGroupName,
                'equipment' => $equipmentName
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Failed to add exercise: ' . $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
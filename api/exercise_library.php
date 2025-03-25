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

// Check action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'muscle_groups':
        // Get all muscle groups
        $db = new Database();
        $db->query("SELECT * FROM muscle_groups ORDER BY name");
        $muscleGroups = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $muscleGroups]);
        break;
        
    case 'equipment':
        // Get all equipment
        $db = new Database();
        $db->query("SELECT * FROM equipment ORDER BY name");
        $equipment = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $equipment]);
        break;
        
    case 'search':
        // Search exercises
        $params = [];
        if (isset($_GET['search'])) $params['search'] = $_GET['search'];
        if (isset($_GET['muscle_group'])) $params['muscle_group'] = $_GET['muscle_group'];
        if (isset($_GET['equipment'])) $params['equipment'] = $_GET['equipment'];
        if (isset($_GET['page'])) $params['page'] = $_GET['page'];
        if (isset($_GET['per_page'])) $params['per_page'] = $_GET['per_page'];
        
        $result = searchExercises($params);
        
        echo json_encode($result);
        break;
    
    case 'stats':
        // Get library stats
        $result = getLibraryStats();
        
        echo json_encode($result);
        break;
        
    case 'get_exercise':
        // Get a specific exercise
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'Exercise ID is required']);
            break;
        }
        
        $db = new Database();
        $db->query("
            SELECT e.*, mg.name as muscle_group, eq.name as equipment
            FROM exercises e
            JOIN muscle_groups mg ON e.muscle_group_id = mg.id
            JOIN equipment eq ON e.equipment_id = eq.id
            WHERE e.id = :id
        ");
        $db->bind(':id', $_GET['id']);
        $exercise = $db->single();
        
        if ($exercise) {
            echo json_encode(['success' => true, 'data' => $exercise]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Exercise not found']);
        }
        break;
        
    case 'add_exercise':
        // Add a new exercise
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['muscle_group_id']) || !isset($data['equipment_id'])) {
            echo json_encode(['success' => false, 'message' => 'Name, muscle group, and equipment are required']);
            break;
        }
        
        $db = new Database();
        $db->query("INSERT INTO exercises (name, description, muscle_group_id, equipment_id) VALUES (:name, :description, :muscle_group_id, :equipment_id)");
        $db->bind(':name', $data['name']);
        $db->bind(':description', $data['description'] ?? null);
        $db->bind(':muscle_group_id', $data['muscle_group_id']);
        $db->bind(':equipment_id', $data['equipment_id']);
        
        if ($db->execute()) {
            echo json_encode(['success' => true, 'message' => 'Exercise added successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add exercise']);
        }
        break;
        
    case 'update_exercise':
        // Update an existing exercise
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || !isset($data['name']) || !isset($data['muscle_group_id']) || !isset($data['equipment_id'])) {
            echo json_encode(['success' => false, 'message' => 'ID, name, muscle group, and equipment are required']);
            break;
        }
        
        $db = new Database();
        $db->query("UPDATE exercises SET name = :name, description = :description, muscle_group_id = :muscle_group_id, equipment_id = :equipment_id WHERE id = :id");
        $db->bind(':id', $data['id']);
        $db->bind(':name', $data['name']);
        $db->bind(':description', $data['description'] ?? null);
        $db->bind(':muscle_group_id', $data['muscle_group_id']);
        $db->bind(':equipment_id', $data['equipment_id']);
        
        if ($db->execute()) {
            echo json_encode(['success' => true, 'message' => 'Exercise updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update exercise']);
        }
        break;
        
    case 'delete_exercise':
        // Delete an exercise
        if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['id'])) {
                echo json_encode(['success' => false, 'message' => 'Exercise ID is required']);
                break;
            }
            
            $db = new Database();
            
            try {
                // Begin transaction
                $db->beginTransaction();
                
                // First check if this exercise has workout_details records
                $db->query("SELECT COUNT(*) as count FROM workout_details WHERE exercise_id = :id");
                $db->bind(':id', $data['id']);
                $workoutCount = $db->single()['count'];
                
                if ($workoutCount > 0) {
                    // We have references - either abort or handle by orphaning or cascading
                    $db->rollBack();
                    echo json_encode([
                        'success' => false, 
                        'message' => 'Cannot delete exercise because it is used in ' . $workoutCount . ' workout records'
                    ]);
                    break;
                }
                
                // Delete the exercise
                $db->query("DELETE FROM exercises WHERE id = :id");
                $db->bind(':id', $data['id']);
                
                if ($db->execute()) {
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Exercise deleted successfully']);
                } else {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Failed to delete exercise']);
                }
            } catch (Exception $e) {
                $db->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        }
        break;
    
    case 'add_muscle_group':
        // Add a new muscle group
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Muscle group name is required']);
            break;
        }
        
        $db = new Database();
        $db->query("INSERT INTO muscle_groups (name) VALUES (:name)");
        $db->bind(':name', $data['name']);
        
        if ($db->execute()) {
            echo json_encode(['success' => true, 'message' => 'Muscle group added successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add muscle group']);
        }
        break;
    
    case 'add_equipment':
        // Add new equipment
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name'])) {
            echo json_encode(['success' => false, 'message' => 'Equipment name is required']);
            break;
        }
        
        $db = new Database();
        $db->query("INSERT INTO equipment (name) VALUES (:name)");
        $db->bind(':name', $data['name']);
        
        if ($db->execute()) {
            echo json_encode(['success' => true, 'message' => 'Equipment added successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add equipment']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get all exercise library stats 
 * @return array Stats for the exercise library
 */
function getLibraryStats() {
    $db = new Database();
    
    try {
        // Get counts for each table
        $db->query("SELECT COUNT(*) as muscle_groups_count FROM muscle_groups");
        $muscleGroupsCount = $db->single()['muscle_groups_count'];
        
        $db->query("SELECT COUNT(*) as equipment_count FROM equipment");
        $equipmentCount = $db->single()['equipment_count'];
        
        $db->query("SELECT COUNT(*) as exercises_count FROM exercises");
        $exercisesCount = $db->single()['exercises_count'];
        
        $db->query("SELECT
                      mg.name as muscle_group,
                      COUNT(e.id) as exercise_count
                    FROM muscle_groups mg
                    LEFT JOIN exercises e ON mg.id = e.muscle_group_id
                    GROUP BY mg.id
                    ORDER BY exercise_count DESC");
        $exercisesByMuscleGroup = $db->resultSet();
        
        $db->query("SELECT
                      eq.name as equipment,
                      COUNT(e.id) as exercise_count
                    FROM equipment eq
                    LEFT JOIN exercises e ON eq.id = e.equipment_id
                    GROUP BY eq.id
                    ORDER BY exercise_count DESC");
        $exercisesByEquipment = $db->resultSet();
        
        return [
            'success' => true,
            'data' => [
                'total_muscle_groups' => $muscleGroupsCount,
                'total_equipment' => $equipmentCount,
                'total_exercises' => $exercisesCount,
                'exercises_by_muscle_group' => $exercisesByMuscleGroup,
                'exercises_by_equipment' => $exercisesByEquipment
            ]
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Failed to retrieve library stats: ' . $e->getMessage()
        ];
    }
}

/**
 * Search exercises
 * @param array $params Search parameters
 * @return array Matched exercises
 */
function searchExercises($params) {
    $db = new Database();
    
    try {
        // Determine if we need pagination
        $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
        $perPage = isset($params['per_page']) ? max(1, intval($params['per_page'])) : 20;
        $offset = ($page - 1) * $perPage;
        
        // Base query
        $baseQuery = "FROM exercises e
                    JOIN muscle_groups mg ON e.muscle_group_id = mg.id
                    JOIN equipment eq ON e.equipment_id = eq.id";
        
        // Where conditions
        $where = [];
        $bindParams = [];
        
        if (!empty($params['search'])) {
            $where[] = "(e.name LIKE :search OR mg.name LIKE :search OR eq.name LIKE :search OR e.description LIKE :search)";
            $bindParams[':search'] = '%' . $params['search'] . '%';
        }
        
        if (!empty($params['muscle_group'])) {
            $where[] = "mg.name = :muscle_group";
            $bindParams[':muscle_group'] = $params['muscle_group'];
        }
        
        if (!empty($params['equipment'])) {
            $where[] = "eq.name = :equipment";
            $bindParams[':equipment'] = $params['equipment'];
        }
        
        // Final where clause
        $whereClause = empty($where) ? "" : "WHERE " . implode(" AND ", $where);
        
        // Count total results
        $countQuery = "SELECT COUNT(*) as total_count " . $baseQuery . " " . $whereClause;
        $db->query($countQuery);
        
        // Bind parameters for count query
        foreach ($bindParams as $param => $value) {
            $db->bind($param, $value);
        }
        
        $totalCount = $db->single();
        
        // Get paginated results
        $selectQuery = "SELECT 
                        e.id, 
                        e.name, 
                        e.description, 
                        mg.id as muscle_group_id, 
                        mg.name as muscle_group, 
                        eq.id as equipment_id, 
                        eq.name as equipment
                        " . $baseQuery . " " . $whereClause . " 
                        ORDER BY e.name 
                        LIMIT :offset, :per_page";
        
        $db->query($selectQuery);
        
        // Bind parameters for select query
        foreach ($bindParams as $param => $value) {
            $db->bind($param, $value);
        }
        $db->bind(':offset', $offset, PDO::PARAM_INT);
        $db->bind(':per_page', $perPage, PDO::PARAM_INT);
        
        $results = $db->resultSet();
        
        // Add exercise_name property to each result for compatibility
        foreach ($results as &$exercise) {
            $exercise['exercise_name'] = $exercise['name'];
        }
        
        // Ensure total_count is properly set
        $totalCount = isset($totalCount['total_count']) ? (int)$totalCount['total_count'] : 0;
        
        // Debug information
        error_log("Search query executed: " . $selectQuery);
        error_log("Results count: " . count($results));
        error_log("Total count: " . $totalCount);
        
        return [
            'success' => true,
            'data' => $results,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_count' => $totalCount,
                'total_pages' => ceil($totalCount / $perPage)
            ]
        ];
    } catch (Exception $e) {
        error_log("Error in searchExercises: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to search exercises: ' . $e->getMessage()
        ];
    }
}
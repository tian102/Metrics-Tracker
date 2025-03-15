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
        if (createWorkoutDetails($processedData)) {
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
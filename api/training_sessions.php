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

if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'recent') {
    // Get recent training sessions with exercise count
    $db = new Database();
    $db->query("SELECT ts.*, 
                (SELECT COUNT(*) FROM workout_details wd WHERE wd.session_id = ts.id) as exercise_count
                FROM training_sessions ts 
                WHERE ts.user_id = :user_id 
                ORDER BY ts.date DESC, ts.id DESC
                LIMIT 10");
    $db->bind(':user_id', $userId);
    $sessions = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $sessions]);
    exit;
}

switch ($method) {
    case 'GET':
        // Get all training sessions for the user
        $db = new Database();
        $db->query("SELECT * FROM training_sessions WHERE user_id = :user_id ORDER BY date DESC, id DESC");
        $db->bind(':user_id', $userId);
        $sessions = $db->resultSet();
        
        echo json_encode(['success' => true, 'data' => $sessions]);
        break;
        
    case 'POST':
        // Create new training session
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($data['date']) || !validateDate($data['date'])) {
            echo json_encode(['success' => false, 'message' => 'Valid date is required']);
            exit;
        }
        
        // Process and sanitize data
        $processedData = [
            'user_id' => $userId,
            'date' => sanitize($data['date']),
            'mesocycle_name' => isset($data['mesocycle_name']) ? sanitize($data['mesocycle_name']) : null,
            'session_number' => isset($data['session_number']) && is_numeric($data['session_number']) ? (int)sanitize($data['session_number']) : null,
            'training_start' => null,
            'training_end' => null
        ];
        
        // Process training times
        if (isset($data['training_start']) && !empty($data['training_start'])) {
            $processedData['training_start'] = sanitize($data['training_start']);
        } else if (isset($data['training_start_time']) && !empty($data['training_start_time'])) {
            $processedData['training_start'] = $processedData['date'] . ' ' . sanitize($data['training_start_time']) . ':00';
        }
        
        if (isset($data['training_end']) && !empty($data['training_end'])) {
            $processedData['training_end'] = sanitize($data['training_end']);
        } else if (isset($data['training_end_time']) && !empty($data['training_end_time'])) {
            $processedData['training_end'] = $processedData['date'] . ' ' . sanitize($data['training_end_time']) . ':00';
        }
        
        // Create training session
        $sessionId = createTrainingSession($processedData);
        
        if ($sessionId) {
            echo json_encode(['success' => true, 'message' => 'Training session created successfully', 'session_id' => $sessionId]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create training session']);
        }
        break;
        
    case 'PUT':
        // Update existing training session
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($data['id']) || !is_numeric($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Valid training session ID is required']);
            exit;
        }
        
        if (!isset($data['date']) || !validateDate($data['date'])) {
            echo json_encode(['success' => false, 'message' => 'Valid date is required']);
            exit;
        }
        
        // Security check: Verify ownership
        $db = new Database();
        $db->query("SELECT id FROM training_sessions WHERE id = :id AND user_id = :user_id");
        $db->bind(':id', $data['id']);
        $db->bind(':user_id', $userId);
        $session = $db->single();
        
        if (!$session) {
            echo json_encode(['success' => false, 'message' => 'You do not have permission to modify this training session']);
            exit;
        }
        
        // Process and sanitize data
        $processedData = [
            'id' => (int)sanitize($data['id']),
            'user_id' => $userId,
            'date' => sanitize($data['date']),
            'mesocycle_name' => isset($data['mesocycle_name']) ? sanitize($data['mesocycle_name']) : null,
            'session_number' => isset($data['session_number']) && is_numeric($data['session_number']) ? (int)sanitize($data['session_number']) : null,
            'training_start' => null,
            'training_end' => null
        ];
        
        // Process training times
        if (isset($data['training_start']) && !empty($data['training_start'])) {
            $processedData['training_start'] = sanitize($data['training_start']);
        } else if (isset($data['training_start_time']) && !empty($data['training_start_time'])) {
            $processedData['training_start'] = $processedData['date'] . ' ' . sanitize($data['training_start_time']) . ':00';
        }
        
        if (isset($data['training_end']) && !empty($data['training_end'])) {
            $processedData['training_end'] = sanitize($data['training_end']);
        } else if (isset($data['training_end_time']) && !empty($data['training_end_time'])) {
            $processedData['training_end'] = $processedData['date'] . ' ' . sanitize($data['training_end_time']) . ':00';
        }
        
        // Update training session
        if (updateTrainingSession($processedData)) {
            echo json_encode(['success' => true, 'message' => 'Training session updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update training session']);
        }
        break;
        
    case 'DELETE':
        // Delete training session
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || !is_numeric($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Valid training session ID is required']);
            exit;
        }
        
        // Security check: Verify ownership
        $db = new Database();
        $db->query("SELECT id FROM training_sessions WHERE id = :id AND user_id = :user_id");
        $db->bind(':id', $data['id']);
        $db->bind(':user_id', $userId);
        $session = $db->single();
        
        if (!$session) {
            echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this training session']);
            exit;
        }
        
        if (deleteTrainingSession($data['id'])) {
            echo json_encode(['success' => true, 'message' => 'Training session deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete training session']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}
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
        // Get training sessions (either single day, specific session, or date range)
        if (isset($_GET['id']) && is_numeric($_GET['id'])) {
            // Get specific session by ID
            $db = new Database();
            $db->query("SELECT * FROM training_sessions WHERE id = :id AND user_id = :user_id");
            $db->bind(':id', $_GET['id']);
            $db->bind(':user_id', $userId); // Security: Only get data for current user
            $session = $db->single();
            
            if ($session) {
                echo json_encode(['success' => true, 'data' => $session]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Training session not found']);
            }
        } elseif (isset($_GET['date']) && validateDate($_GET['date'])) {
            // Get all sessions for a specific date (filtered for current user)
            $db = new Database();
            $db->query("SELECT * FROM training_sessions WHERE date = :date AND user_id = :user_id");
            $db->bind(':date', $_GET['date']);
            $db->bind(':user_id', $userId); // Security: Only get data for current user
            $sessions = $db->resultSet();
            
            echo json_encode(['success' => true, 'data' => $sessions]);
        } elseif (isset($_GET['start_date']) && isset($_GET['end_date']) && 
                validateDate($_GET['start_date']) && validateDate($_GET['end_date'])) {
            // Get all sessions within a date range (filtered for current user)
            $db = new Database();
            $db->query("SELECT * FROM training_sessions WHERE date BETWEEN :start_date AND :end_date AND user_id = :user_id ORDER BY date DESC");
            $db->bind(':start_date', $_GET['start_date']);
            $db->bind(':end_date', $_GET['end_date']);
            $db->bind(':user_id', $userId); // Security: Only get data for current user
            $sessions = $db->resultSet();
            
            echo json_encode(['success' => true, 'data' => $sessions]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        }
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
            'user_id' => $userId, // Always use the current user's ID
            'date' => sanitize($data['date']),
            'mesocycle_name' => isset($data['mesocycle_name']) ? sanitize($data['mesocycle_name']) : null,
            'session_number' => isset($data['session_number']) ? (int)sanitize($data['session_number']) : null,
            'training_start' => isset($data['training_start']) ? sanitize($data['training_start']) : null,
            'training_end' => isset($data['training_end']) ? sanitize($data['training_end']) : null
        ];
        
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
            echo json_encode(['success' => false, 'message' => 'Valid session ID is required']);
            exit;
        }
        
        if (!isset($data['date']) || !validateDate($data['date'])) {
            echo json_encode(['success' => false, 'message' => 'Valid date is required']);
            exit;
        }
        
        // Security check: Verify ownership of the session
        $db = new Database();
        $db->query("SELECT user_id FROM training_sessions WHERE id = :id");
        $db->bind(':id', $data['id']);
        $existingSession = $db->single();
        
        if (!$existingSession || $existingSession['user_id'] != $userId) {
            echo json_encode(['success' => false, 'message' => 'You do not have permission to modify this training session']);
            exit;
        }
        
        // Process and sanitize data
        $processedData = [
            'id' => (int)sanitize($data['id']),
            'user_id' => $userId, // Always use the current user's ID
            'date' => sanitize($data['date']),
            'mesocycle_name' => isset($data['mesocycle_name']) ? sanitize($data['mesocycle_name']) : null,
            'session_number' => isset($data['session_number']) ? (int)sanitize($data['session_number']) : null,
            'training_start' => isset($data['training_start']) ? sanitize($data['training_start']) : null,
            'training_end' => isset($data['training_end']) ? sanitize($data['training_end']) : null
        ];
        
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
            echo json_encode(['success' => false, 'message' => 'Valid session ID is required']);
            exit;
        }
        
        // Security check: Verify ownership of the session
        $db = new Database();
        $db->query("SELECT user_id FROM training_sessions WHERE id = :id");
        $db->bind(':id', $data['id']);
        $existingSession = $db->single();
        
        if (!$existingSession || $existingSession['user_id'] != $userId) {
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
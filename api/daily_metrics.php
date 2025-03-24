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
        // Get daily metrics (either single day or date range)
        if (isset($_GET['date']) && validateDate($_GET['date'])) {
            $metrics = getDailyMetrics($_GET['date']);
            
            // Security check: Only return data if it belongs to the current user
            if (!$metrics || $metrics['user_id'] != $userId) {
                echo json_encode(['success' => false, 'message' => 'No data found for this date']);
                exit;
            }
            
            echo json_encode(['success' => true, 'data' => $metrics]);
        } elseif (isset($_GET['start_date']) && isset($_GET['end_date']) && 
                validateDate($_GET['start_date']) && validateDate($_GET['end_date'])) {
            $metrics = getDailyMetricsRange($_GET['start_date'], $_GET['end_date']);
            
            // Security check: Filter to only include current user's data
            $metrics = array_filter($metrics, function($item) use ($userId) {
                return $item['user_id'] == $userId;
            });
            
            echo json_encode(['success' => true, 'data' => array_values($metrics)]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid date parameters']);
        }
        break;
        
    case 'POST':
        // Create new daily metrics record
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
            'sleep_start' => isset($data['sleep_start']) ? sanitize($data['sleep_start']) : null,
            'sleep_end' => isset($data['sleep_end']) ? sanitize($data['sleep_end']) : null,
            'stress_level' => isset($data['stress_level']) ? (int)sanitize($data['stress_level']) : null,
            'energy_level' => isset($data['energy_level']) ? (int)sanitize($data['energy_level']) : null,
            'motivation_level' => isset($data['motivation_level']) ? (int)sanitize($data['motivation_level']) : null,
            'weight' => isset($data['weight']) ? (float)sanitize($data['weight']) : null,
            'meals' => isset($data['meals']) ? sanitize($data['meals']) : null,
            'calories' => isset($data['calories']) ? (int)sanitize($data['calories']) : null,
            'protein' => isset($data['protein']) ? (float)sanitize($data['protein']) : null,
            'carbs' => isset($data['carbs']) ? (float)sanitize($data['carbs']) : null,
            'fats' => isset($data['fats']) ? (float)sanitize($data['fats']) : null,
            'water_intake' => isset($data['water_intake']) ? (float)sanitize($data['water_intake']) : null
        ];
        
        // Check if record exists for this date
        $existingRecord = getDailyMetrics($processedData['date']);
        
        if ($existingRecord) {
            // Security check: Only update if data belongs to current user
            if ($existingRecord['user_id'] != $userId) {
                echo json_encode(['success' => false, 'message' => 'You do not have permission to modify this data']);
                exit;
            }
            
            // Update existing record
            if (updateDailyMetrics($processedData)) {
                echo json_encode(['success' => true, 'message' => 'Daily metrics updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update daily metrics']);
            }
        } else {
            // Create new record
            if (createDailyMetrics($processedData)) {
                echo json_encode(['success' => true, 'message' => 'Daily metrics added successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to add daily metrics']);
            }
        }
        break;
        
    case 'DELETE':
        // Consolidate DELETE handling into a single block
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Handle both ID-based and date-based deletion
        if (isset($data['id']) && is_numeric($data['id'])) {
            $metricsId = (int)$data['id'];
            
            // Check if the metrics entry exists and belongs to the current user
            $db = new Database();
            $db->query("SELECT id FROM daily_metrics WHERE id = :id AND user_id = :user_id");
            $db->bind(':id', $metricsId);
            $db->bind(':user_id', $userId);
            $entry = $db->single();
            
            if (!$entry) {
                header('HTTP/1.1 404 Not Found');
                echo json_encode(['success' => false, 'message' => 'Metrics entry not found or you do not have permission to delete it']);
                exit;
            }
            
            // Delete the metrics entry
            $db->query("DELETE FROM daily_metrics WHERE id = :id");
            $db->bind(':id', $metricsId);
            
            if ($db->execute()) {
                echo json_encode(['success' => true, 'message' => 'Metrics entry deleted successfully']);
            } else {
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['success' => false, 'message' => 'Failed to delete metrics entry']);
            }
            exit;
        } 
        // Handle date-based deletion (the old path)
        else if (isset($data['date']) && validateDate($data['date'])) {
            // Security check: Verify the data belongs to the current user
            $existingRecord = getDailyMetrics($data['date']);
            if (!$existingRecord || $existingRecord['user_id'] != $userId) {
                echo json_encode(['success' => false, 'message' => 'No data found or you do not have permission to delete this data']);
                exit;
            }
            
            if (deleteDailyMetrics($data['date'])) {
                echo json_encode(['success' => true, 'message' => 'Daily metrics deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete daily metrics']);
            }
            exit;
        }
        else {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['success' => false, 'message' => 'Either valid metrics ID or date is required']);
            exit;
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}
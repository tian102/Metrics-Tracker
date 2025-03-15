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

// Check the action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'export':
        // Handle data export
        exportUserData($userId);
        break;
        
    case 'remove':
        // Handle data removal
        if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            header('Content-Type: application/json');
            $result = removeUserData($userId);
            echo json_encode($result);
        } else {
            header('HTTP/1.1 405 Method Not Allowed');
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    default:
        header('HTTP/1.1 400 Bad Request');
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Export user data as a single CSV file
 * 
 * @param int $userId The user ID
 */
function exportUserData($userId) {
    $db = new Database();
    
    // Get user data
    $db->query("SELECT username FROM users WHERE id = :user_id");
    $db->bind(':user_id', $userId);
    $userData = $db->single();
    $username = $userData['username'];
    
    // Set filename
    $filename = 'metrics_tracker_' . $username . '_' . date('Y-m-d') . '.csv';
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Create output handle
    $output = fopen('php://output', 'w');
    
    // Add header to CSV
    fputcsv($output, ['Metrics Tracker Data Export', 'User: ' . $username, 'Date: ' . date('Y-m-d H:i:s')]);
    fputcsv($output, []); // Empty line
    
    // ==== DAILY METRICS ====
    fputcsv($output, ['DAILY METRICS']);
    
    // Get daily metrics data
    $db->query("SELECT * FROM daily_metrics WHERE user_id = :user_id ORDER BY date DESC");
    $db->bind(':user_id', $userId);
    $dailyMetrics = $db->resultSet();
    
    if (count($dailyMetrics) > 0) {
        // Write headers
        $headers = array_keys($dailyMetrics[0]);
        fputcsv($output, $headers);
        
        // Write daily metrics data
        foreach ($dailyMetrics as $row) {
            fputcsv($output, $row);
        }
    } else {
        fputcsv($output, ['No daily metrics data found']);
    }
    
    fputcsv($output, []); // Empty line
    
    // ==== TRAINING SESSIONS ====
    fputcsv($output, ['TRAINING SESSIONS']);
    
    // Get training sessions data
    $db->query("SELECT * FROM training_sessions WHERE user_id = :user_id ORDER BY date DESC");
    $db->bind(':user_id', $userId);
    $trainingSessions = $db->resultSet();
    
    if (count($trainingSessions) > 0) {
        // Write headers
        $headers = array_keys($trainingSessions[0]);
        fputcsv($output, $headers);
        
        // Write training sessions data
        foreach ($trainingSessions as $row) {
            fputcsv($output, $row);
        }
        
        fputcsv($output, []); // Empty line
        
        // ==== WORKOUT DETAILS ====
        fputcsv($output, ['WORKOUT DETAILS']);
        
        // Get session IDs
        $sessionIds = array_column($trainingSessions, 'id');
        
        if (!empty($sessionIds)) {
            $idList = implode(',', $sessionIds);
            $db->query("SELECT * FROM workout_details WHERE session_id IN ($idList) ORDER BY session_id, id");
            $workoutDetails = $db->resultSet();
            
            if (count($workoutDetails) > 0) {
                // Write headers
                $headers = array_keys($workoutDetails[0]);
                fputcsv($output, $headers);
                
                // Write workout details data
                foreach ($workoutDetails as $row) {
                    fputcsv($output, $row);
                }
            } else {
                fputcsv($output, ['No workout details data found']);
            }
        } else {
            fputcsv($output, ['No workout details data found']);
        }
    } else {
        fputcsv($output, ['No training sessions data found']);
    }
    
    // Close the output
    fclose($output);
    exit;
}

/**
 * Remove all user data except account information
 * 
 * @param int $userId The user ID
 * @return array Result with success status and message
 */
function removeUserData($userId) {
    $db = new Database();
    
    try {
        // Begin transaction
        $db->beginTransaction();
        
        // Step 1: Get all training sessions for the user
        $db->query("SELECT id FROM training_sessions WHERE user_id = :user_id");
        $db->bind(':user_id', $userId);
        $trainingSessions = $db->resultSet();
        
        // Step 2: Delete workout details for these sessions
        if (!empty($trainingSessions)) {
            $sessionIds = array_column($trainingSessions, 'id');
            $idList = implode(',', $sessionIds);
            $db->query("DELETE FROM workout_details WHERE session_id IN ($idList)");
            $db->execute();
        }
        
        // Step 3: Delete training sessions
        $db->query("DELETE FROM training_sessions WHERE user_id = :user_id");
        $db->bind(':user_id', $userId);
        $db->execute();
        
        // Step 4: Delete daily metrics
        $db->query("DELETE FROM daily_metrics WHERE user_id = :user_id");
        $db->bind(':user_id', $userId);
        $db->execute();
        
        // Commit transaction
        $db->commit();
        
        return ['success' => true, 'message' => 'All your data has been successfully removed.'];
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        return ['success' => false, 'message' => 'An error occurred while removing data: ' . $e->getMessage()];
    }
}
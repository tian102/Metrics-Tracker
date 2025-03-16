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
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_widgets':
        // Get all widgets for the user
        getUserWidgets($userId);
        break;
        
    case 'add_widget':
        // Add a new widget
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        addWidget($userId);
        break;
        
    case 'remove_widget':
        // Remove a widget
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        removeWidget($userId);
        break;
        
    case 'update_positions':
        // Update widget positions
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        updateWidgetPositions($userId);
        break;
        
    case 'save_preferences':
        // Save dashboard preferences
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        savePreferences($userId);
        break;
        
    case 'reset_dashboard':
        // Reset dashboard to default settings
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        resetDashboard($userId);
        break;
        
    case 'get_data':
        // Get data for a specific widget
        getWidgetData($userId);
        break;
    
    case 'update_widget':
        // Update widget properties
        if ($method !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            break;
        }
        updateWidget($userId);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

/**
 * Get all widgets for a user
 * @param int $userId User ID
 */
function getUserWidgets($userId) {
    $db = new Database();
    
    $db->query("SELECT * FROM dashboard_widgets WHERE user_id = :user_id ORDER BY widget_position");
    $db->bind(':user_id', $userId);
    
    $widgets = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $widgets]);
}

/**
 * Add a new widget
 * @param int $userId User ID
 */
function addWidget($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['widget_type']) || !isset($data['widget_title']) || !isset($data['widget_size'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    // Validate widget size
    if (!in_array($data['widget_size'], ['small', 'medium', 'large'])) {
        $data['widget_size'] = 'medium';
    }
    
    $db = new Database();
    
    // Get the highest current position
    $db->query("SELECT MAX(widget_position) AS max_position FROM dashboard_widgets WHERE user_id = :user_id");
    $db->bind(':user_id', $userId);
    $result = $db->single();
    
    $position = ($result && isset($result['max_position'])) ? $result['max_position'] + 1 : 1;
    
    // Insert the new widget
    $db->query("INSERT INTO dashboard_widgets 
               (user_id, widget_type, widget_title, widget_position, widget_size) 
               VALUES 
               (:user_id, :widget_type, :widget_title, :widget_position, :widget_size)");
    
    $db->bind(':user_id', $userId);
    $db->bind(':widget_type', $data['widget_type']);
    $db->bind(':widget_title', $data['widget_title']);
    $db->bind(':widget_position', $position);
    $db->bind(':widget_size', $data['widget_size']);
    
    if ($db->execute()) {
        echo json_encode([
            'success' => true, 
            'message' => 'Widget added successfully',
            'widget_id' => $db->lastInsertId()
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add widget']);
    }
}

/**
 * Remove a widget
 * @param int $userId User ID
 */
function removeWidget($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'Widget ID is required']);
        return;
    }
    
    $widgetId = (int)$data['id'];
    
    $db = new Database();
    
    // Ensure the widget belongs to the user
    $db->query("SELECT id FROM dashboard_widgets WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $widgetId);
    $db->bind(':user_id', $userId);
    
    $widget = $db->single();
    
    if (!$widget) {
        echo json_encode(['success' => false, 'message' => 'Widget not found or access denied']);
        return;
    }
    
    // Delete the widget
    $db->query("DELETE FROM dashboard_widgets WHERE id = :id");
    $db->bind(':id', $widgetId);
    
    if ($db->execute()) {
        echo json_encode(['success' => true, 'message' => 'Widget removed successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove widget']);
    }
}

/**
 * Update widget positions
 * @param int $userId User ID
 */
function updateWidgetPositions($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['positions']) || !is_array($data['positions'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid position data']);
        return;
    }
    
    $db = new Database();
    $updateCount = 0;
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        foreach ($data['positions'] as $position) {
            if (!isset($position['id']) || !isset($position['position'])) {
                continue;
            }
            
            $widgetId = (int)$position['id'];
            $newPosition = (int)$position['position'];
            
            // Ensure the widget belongs to the user
            $db->query("SELECT id FROM dashboard_widgets WHERE id = :id AND user_id = :user_id");
            $db->bind(':id', $widgetId);
            $db->bind(':user_id', $userId);
            
            $widget = $db->single();
            
            if (!$widget) {
                continue;
            }
            
            // Update the position
            $db->query("UPDATE dashboard_widgets SET widget_position = :position WHERE id = :id");
            $db->bind(':position', $newPosition);
            $db->bind(':id', $widgetId);
            
            if ($db->execute()) {
                $updateCount++;
            }
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Widget positions updated successfully',
            'updated_count' => $updateCount
        ]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to update widget positions: ' . $e->getMessage()]);
    }
}

/**
 * Update widget properties
 * @param int $userId User ID
 */
function updateWidget($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'Widget ID is required']);
        return;
    }
    
    $widgetId = (int)$data['id'];
    
    $db = new Database();
    
    // Ensure the widget belongs to the user
    $db->query("SELECT id FROM dashboard_widgets WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $widgetId);
    $db->bind(':user_id', $userId);
    
    $widget = $db->single();
    
    if (!$widget) {
        echo json_encode(['success' => false, 'message' => 'Widget not found or access denied']);
        return;
    }
    
    // Build update query based on provided fields
    $updates = [];
    $params = [':id' => $widgetId];
    
    // Handle widget_size
    if (isset($data['widget_size'])) {
        if (in_array($data['widget_size'], ['small', 'medium', 'large'])) {
            $updates[] = "widget_size = :widget_size";
            $params[':widget_size'] = $data['widget_size'];
        }
    }
    
    // Handle widget_title
    if (isset($data['widget_title'])) {
        $updates[] = "widget_title = :widget_title";
        $params[':widget_title'] = $data['widget_title'];
    }
    
    // Handle widget_position
    if (isset($data['widget_position']) && is_numeric($data['widget_position'])) {
        $updates[] = "widget_position = :widget_position";
        $params[':widget_position'] = (int)$data['widget_position'];
    }
    
    // Handle is_visible
    if (isset($data['is_visible']) && is_bool($data['is_visible'])) {
        $updates[] = "is_visible = :is_visible";
        $params[':is_visible'] = $data['is_visible'] ? 1 : 0;
    }
    
    // No valid updates provided
    if (empty($updates)) {
        echo json_encode(['success' => false, 'message' => 'No valid widget properties provided to update']);
        return;
    }
    
    // Execute the update
    $db->query("UPDATE dashboard_widgets SET " . implode(', ', $updates) . " WHERE id = :id");
    
    foreach ($params as $param => $value) {
        $db->bind($param, $value);
    }
    
    if ($db->execute()) {
        echo json_encode(['success' => true, 'message' => 'Widget updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update widget']);
    }
}

/**
 * Save dashboard preferences
 * @param int $userId User ID
 */
function savePreferences($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['default_view'])) {
        echo json_encode(['success' => false, 'message' => 'Default view is required']);
        return;
    }
    
    // Validate default view
    if (!in_array($data['default_view'], ['daily', 'weekly', 'monthly'])) {
        $data['default_view'] = 'daily';
    }
    
    $db = new Database();
    
    // Check if preferences already exist
    $db->query("SELECT id FROM dashboard_preferences WHERE user_id = :user_id");
    $db->bind(':user_id', $userId);
    $preferences = $db->single();
    
    if ($preferences) {
        // Update existing preferences
        $db->query("UPDATE dashboard_preferences SET default_view = :default_view WHERE user_id = :user_id");
        $db->bind(':default_view', $data['default_view']);
        $db->bind(':user_id', $userId);
        
        if ($db->execute()) {
            echo json_encode(['success' => true, 'message' => 'Preferences updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update preferences']);
        }
    } else {
        // Insert new preferences
        $db->query("INSERT INTO dashboard_preferences (user_id, default_view) VALUES (:user_id, :default_view)");
        $db->bind(':user_id', $userId);
        $db->bind(':default_view', $data['default_view']);
        
        if ($db->execute()) {
            echo json_encode(['success' => true, 'message' => 'Preferences saved successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save preferences']);
        }
    }
}

/**
 * Reset dashboard to default settings
 * @param int $userId User ID
 */
function resetDashboard($userId) {
    $db = new Database();
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Delete all existing widgets
        $db->query("DELETE FROM dashboard_widgets WHERE user_id = :user_id");
        $db->bind(':user_id', $userId);
        $db->execute();
        
        // Reset preferences to default
        $db->query("UPDATE dashboard_preferences SET default_view = 'daily' WHERE user_id = :user_id");
        $db->bind(':user_id', $userId);
        $db->execute();
        
        // Add default widgets
        $defaultWidgets = [
            ['widget_type' => 'sleep_stats', 'widget_title' => 'Sleep', 'widget_position' => 1, 'widget_size' => 'medium'],
            ['widget_type' => 'energy_stats', 'widget_title' => 'Energy & Motivation', 'widget_position' => 2, 'widget_size' => 'medium'],
            ['widget_type' => 'nutrition_stats', 'widget_title' => 'Nutrition', 'widget_position' => 3, 'widget_size' => 'medium'],
            ['widget_type' => 'training_stats', 'widget_title' => 'Training', 'widget_position' => 4, 'widget_size' => 'medium'],
            ['widget_type' => 'weight_chart', 'widget_title' => 'Weight Progress', 'widget_position' => 5, 'widget_size' => 'large'],
            ['widget_type' => 'recent_daily', 'widget_title' => 'Recent Daily Metrics', 'widget_position' => 6, 'widget_size' => 'large'],
            ['widget_type' => 'recent_training', 'widget_title' => 'Recent Training Sessions', 'widget_position' => 7, 'widget_size' => 'large']
        ];
        
        foreach ($defaultWidgets as $widget) {
            $db->query("INSERT INTO dashboard_widgets 
                       (user_id, widget_type, widget_title, widget_position, widget_size) 
                       VALUES 
                       (:user_id, :widget_type, :widget_title, :widget_position, :widget_size)");
            $db->bind(':user_id', $userId);
            $db->bind(':widget_type', $widget['widget_type']);
            $db->bind(':widget_title', $widget['widget_title']);
            $db->bind(':widget_position', $widget['widget_position']);
            $db->bind(':widget_size', $widget['widget_size']);
            $db->execute();
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode(['success' => true, 'message' => 'Dashboard reset to default settings']);
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to reset dashboard: ' . $e->getMessage()]);
    }
}

/**
 * Get data for a specific widget
 * @param int $userId User ID
 */
function getWidgetData($userId) {
    if (!isset($_GET['widget_type'])) {
        echo json_encode(['success' => false, 'message' => 'Widget type is required']);
        return;
    }
    
    $widgetType = $_GET['widget_type'];
    
    // Get date range based on user preferences or default to 'daily'
    $db = new Database();
    $db->query("SELECT default_view FROM dashboard_preferences WHERE user_id = :user_id");
    $db->bind(':user_id', $userId);
    $preferences = $db->single();
    
    $view = ($preferences && isset($preferences['default_view'])) ? $preferences['default_view'] : 'daily';
    
    $endDate = date('Y-m-d');
    
    switch ($view) {
        case 'weekly':
            $startDate = date('Y-m-d', strtotime('-7 days'));
            break;
        case 'monthly':
            $startDate = date('Y-m-d', strtotime('-30 days'));
            break;
        case 'daily':
        default:
            $startDate = date('Y-m-d', strtotime('-1 day'));
            break;
    }
    
    // Override date range if specified in request
    if (isset($_GET['start_date']) && validateDate($_GET['start_date'])) {
        $startDate = $_GET['start_date'];
    }
    
    if (isset($_GET['end_date']) && validateDate($_GET['end_date'])) {
        $endDate = $_GET['end_date'];
    }
    
    // Get data based on widget type
    switch ($widgetType) {
        case 'sleep_stats':
            getSleepStats($userId, $startDate, $endDate);
            break;
            
        case 'energy_stats':
            getEnergyStats($userId, $startDate, $endDate);
            break;
            
        case 'nutrition_stats':
            getNutritionStats($userId, $startDate, $endDate);
            break;
            
        case 'training_stats':
            getTrainingStats($userId, $startDate, $endDate);
            break;
            
        case 'weight_chart':
            getWeightChart($userId, $startDate, $endDate);
            break;
            
        case 'sleep_chart':
            getSleepChart($userId, $startDate, $endDate);
            break;
            
        case 'energy_chart':
            getEnergyChart($userId, $startDate, $endDate);
            break;
            
        case 'nutrition_chart':
            getNutritionChart($userId, $startDate, $endDate);
            break;
            
        case 'recent_daily':
            getRecentDailyMetrics($userId, $startDate, $endDate);
            break;
            
        case 'recent_training':
            getRecentTrainingSessions($userId, $startDate, $endDate);
            break;
            
        case 'personal_records':
            getPersonalRecords($userId);
            break;
            
        case 'activity_heatmap':
            getActivityHeatmap($userId, $startDate, $endDate);
            break;
            
        case 'recent_insights':
            getRecentInsights($userId);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid widget type']);
            break;
    }
}

/**
 * Get sleep statistics
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getSleepStats($userId, $startDate, $endDate) {
    $db = new Database();
    
    // Get average sleep duration
    $db->query("SELECT AVG(TIMESTAMPDIFF(HOUR, sleep_start, sleep_end)) AS avg_sleep_hours,
                MIN(TIMESTAMPDIFF(HOUR, sleep_start, sleep_end)) AS min_sleep_hours,
                MAX(TIMESTAMPDIFF(HOUR, sleep_start, sleep_end)) AS max_sleep_hours,
                COUNT(*) AS sleep_entries_count
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                AND sleep_start IS NOT NULL 
                AND sleep_end IS NOT NULL");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $sleepStats = $db->single();
    
    echo json_encode([
        'success' => true,
        'data' => $sleepStats,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get energy, stress, and motivation statistics
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getEnergyStats($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT AVG(energy_level) AS avg_energy,
                AVG(stress_level) AS avg_stress,
                AVG(motivation_level) AS avg_motivation,
                COUNT(*) AS entry_count
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $energyStats = $db->single();
    
    echo json_encode([
        'success' => true,
        'data' => $energyStats,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get nutrition statistics
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getNutritionStats($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT AVG(calories) AS avg_calories,
                AVG(protein) AS avg_protein,
                AVG(carbs) AS avg_carbs,
                AVG(fats) AS avg_fats,
                AVG(water_intake) AS avg_water,
                COUNT(*) AS entry_count
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $nutritionStats = $db->single();
    
    echo json_encode([
        'success' => true,
        'data' => $nutritionStats,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get training statistics
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getTrainingStats($userId, $startDate, $endDate) {
    $db = new Database();
    
    // Get training session count
    $db->query("SELECT COUNT(*) AS session_count
                FROM training_sessions 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $sessionStats = $db->single();
    
    // Get average training duration
    $db->query("SELECT AVG(TIMESTAMPDIFF(MINUTE, training_start, training_end)) AS avg_duration
                FROM training_sessions 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                AND training_start IS NOT NULL 
                AND training_end IS NOT NULL");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $durationStats = $db->single();
    
    // Get total training volume
    $db->query("SELECT SUM(w.sets * w.reps * w.load_weight) AS total_volume
                FROM training_sessions t
                JOIN workout_details w ON t.id = w.session_id
                WHERE t.user_id = :user_id 
                AND t.date BETWEEN :start_date AND :end_date
                AND w.sets IS NOT NULL 
                AND w.reps IS NOT NULL 
                AND w.load_weight IS NOT NULL");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $volumeStats = $db->single();
    
    $trainingStats = [
        'session_count' => $sessionStats ? $sessionStats['session_count'] : 0,
        'avg_duration' => $durationStats ? $durationStats['avg_duration'] : 0,
        'total_volume' => $volumeStats ? $volumeStats['total_volume'] : 0
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $trainingStats,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get weight chart data
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getWeightChart($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT date, weight
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                AND weight IS NOT NULL
                ORDER BY date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $weightData = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $weightData,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get sleep chart data
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getSleepChart($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT date, TIMESTAMPDIFF(HOUR, sleep_start, sleep_end) AS sleep_hours
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                AND sleep_start IS NOT NULL 
                AND sleep_end IS NOT NULL
                ORDER BY date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $sleepData = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $sleepData,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get energy, stress, and motivation chart data
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getEnergyChart($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT date, energy_level, stress_level, motivation_level
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                AND (energy_level IS NOT NULL OR stress_level IS NOT NULL OR motivation_level IS NOT NULL)
                ORDER BY date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $energyData = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $energyData,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get nutrition chart data
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getNutritionChart($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT date, calories, protein, carbs, fats, water_intake
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                AND (calories IS NOT NULL OR protein IS NOT NULL OR carbs IS NOT NULL OR fats IS NOT NULL OR water_intake IS NOT NULL)
                ORDER BY date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $nutritionData = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $nutritionData,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get recent daily metrics
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getRecentDailyMetrics($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT *
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date
                ORDER BY date DESC
                LIMIT 10");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $dailyMetrics = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $dailyMetrics,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get recent training sessions
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getRecentTrainingSessions($userId, $startDate, $endDate) {
    $db = new Database();
    
    $db->query("SELECT t.*, 
                TIMESTAMPDIFF(MINUTE, t.training_start, t.training_end) AS duration_minutes,
                (SELECT COUNT(*) FROM workout_details w WHERE w.session_id = t.id) AS exercise_count
                FROM training_sessions t
                WHERE t.user_id = :user_id 
                AND t.date BETWEEN :start_date AND :end_date
                ORDER BY t.date DESC
                LIMIT 10");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $trainingSessions = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $trainingSessions,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get personal records
 * @param int $userId User ID
 */
function getPersonalRecords($userId) {
    $db = new Database();
    
    $db->query("SELECT pr.*, e.name AS exercise_name, e.muscle_group_id,
                m.name AS muscle_group, eq.name AS equipment
                FROM personal_records pr
                JOIN exercises e ON pr.exercise_id = e.id
                JOIN muscle_groups m ON e.muscle_group_id = m.id
                JOIN equipment eq ON e.equipment_id = eq.id
                WHERE pr.user_id = :user_id 
                ORDER BY pr.date DESC, pr.created_at DESC
                LIMIT 10");
    
    $db->bind(':user_id', $userId);
    
    $personalRecords = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $personalRecords
    ]);
}

/**
 * Get activity heatmap data
 * @param int $userId User ID
 * @param string $startDate Start date
 * @param string $endDate End date
 */
function getActivityHeatmap($userId, $startDate, $endDate) {
    $db = new Database();
    
    // Get training activity
    $db->query("SELECT t.date, 
                COUNT(*) AS session_count,
                SUM(TIMESTAMPDIFF(MINUTE, t.training_start, t.training_end)) AS total_duration,
                (SELECT COUNT(*) FROM workout_details w WHERE w.session_id = t.id) AS exercise_count
                FROM training_sessions t
                WHERE t.user_id = :user_id 
                AND t.date BETWEEN :start_date AND :end_date
                AND t.training_start IS NOT NULL 
                AND t.training_end IS NOT NULL
                GROUP BY t.date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $trainingActivity = $db->resultSet();
    $trainingByDate = [];
    
    foreach ($trainingActivity as $activity) {
        $trainingByDate[$activity['date']] = [
            'session_count' => $activity['session_count'],
            'total_duration' => $activity['total_duration'],
            'exercise_count' => $activity['exercise_count']
        ];
    }
    
    // Get daily metrics activity
    $db->query("SELECT date, 
                CASE WHEN sleep_start IS NOT NULL AND sleep_end IS NOT NULL THEN 1 ELSE 0 END AS has_sleep,
                CASE WHEN energy_level IS NOT NULL THEN 1 ELSE 0 END AS has_energy,
                CASE WHEN weight IS NOT NULL THEN 1 ELSE 0 END AS has_weight,
                CASE WHEN calories IS NOT NULL THEN 1 ELSE 0 END AS has_nutrition
                FROM daily_metrics 
                WHERE user_id = :user_id 
                AND date BETWEEN :start_date AND :end_date");
    
    $db->bind(':user_id', $userId);
    $db->bind(':start_date', $startDate);
    $db->bind(':end_date', $endDate);
    
    $dailyActivity = $db->resultSet();
    $dailyByDate = [];
    
    foreach ($dailyActivity as $activity) {
        $dailyByDate[$activity['date']] = [
            'has_sleep' => $activity['has_sleep'],
            'has_energy' => $activity['has_energy'],
            'has_weight' => $activity['has_weight'],
            'has_nutrition' => $activity['has_nutrition']
        ];
    }
    
    // Combine data for each date in the range
    $heatmapData = [];
    $current = new DateTime($startDate);
    $end = new DateTime($endDate);
    $end->modify('+1 day');
    
    while ($current < $end) {
        $date = $current->format('Y-m-d');
        $hasTraining = isset($trainingByDate[$date]);
        $hasDaily = isset($dailyByDate[$date]);
        
        $activityLevel = 0;
        
        if ($hasTraining) {
            // Training is weighted more heavily in activity level
            $activityLevel += 2;
            
            // Add extra weight for longer sessions or more exercises
            if ($trainingByDate[$date]['total_duration'] > 60) {
                $activityLevel += 1;
            }
            
            if ($trainingByDate[$date]['exercise_count'] > 5) {
                $activityLevel += 1;
            }
        }
        
        if ($hasDaily) {
            // Each tracked daily metric adds a bit to activity level
            if ($dailyByDate[$date]['has_sleep']) $activityLevel += 0.5;
            if ($dailyByDate[$date]['has_energy']) $activityLevel += 0.5;
            if ($dailyByDate[$date]['has_weight']) $activityLevel += 0.5;
            if ($dailyByDate[$date]['has_nutrition']) $activityLevel += 0.5;
        }
        
        $heatmapData[] = [
            'date' => $date,
            'activity_level' => $activityLevel,
            'has_training' => $hasTraining,
            'has_daily' => $hasDaily,
            'training_data' => $hasTraining ? $trainingByDate[$date] : null,
            'daily_data' => $hasDaily ? $dailyByDate[$date] : null
        ];
        
        $current->modify('+1 day');
    }
    
    echo json_encode([
        'success' => true,
        'data' => $heatmapData,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate,
            'days' => dateDiffDays($startDate, $endDate)
        ]
    ]);
}

/**
 * Get recent correlation insights
 * @param int $userId User ID
 */
function getRecentInsights($userId) {
    $db = new Database();
    
    $db->query("SELECT *
                FROM correlation_insights
                WHERE user_id = :user_id 
                ORDER BY created_at DESC
                LIMIT 5");
    
    $db->bind(':user_id', $userId);
    
    $insights = $db->resultSet();
    
    echo json_encode([
        'success' => true,
        'data' => $insights
    ]);
}

/**
 * Calculate the number of days between two dates
 * @param string $startDate Start date (YYYY-MM-DD)
 * @param string $endDate End date (YYYY-MM-DD)
 * @return int Number of days
 */
function dateDiffDays($startDate, $endDate) {
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $interval = $start->diff($end);
    return $interval->days + 1; // Include both start and end dates
}
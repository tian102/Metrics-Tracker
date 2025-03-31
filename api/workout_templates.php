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

switch ($method) {
    case 'GET':
        // Get templates or template details
        if (isset($_GET['id'])) {
            // Get specific template
            getTemplate($userId, $_GET['id']);
        } elseif ($action === 'get_exercises' && isset($_GET['template_id'])) {
            // Get exercises for a template
            getTemplateExercises($userId, $_GET['template_id']);
        } elseif ($action === 'get_exercise_count' && isset($_GET['template_id'])) {
            // Get exercise count for a template
            getExerciseCount($userId, $_GET['template_id']);
        } else {
            // Get all templates
            getTemplates($userId);
        }
        break;
        
    case 'POST':
        // Create template, add exercise, or perform other actions
        if ($action === 'toggle_favorite' && isset($_GET['template_id'])) {
            // Toggle favorite status
            toggleFavorite($userId, $_GET['template_id']);
        } elseif ($action === 'reorder_exercises' && isset($_GET['template_id'])) {
            // Reorder exercises
            reorderExercises($userId, $_GET['template_id']);
        } elseif ($action === 'create_exercise' && isset($_GET['template_id'])) {
            // Add exercise to template
            createExercise($userId, $_GET['template_id']);
        } else {
            // Create new template
            createTemplate($userId);
        }
        break;
        
    case 'PUT':
        // Update template or exercise
        if ($action === 'update_exercise' && isset($_GET['id'])) {
            // Update exercise
            updateExercise($userId, $_GET['id']);
        } else {
            // Update template
            updateTemplate($userId);
        }
        break;
        
    case 'DELETE':
        // Delete template or exercise
        if ($action === 'delete_exercise' && isset($_GET['id'])) {
            // Delete exercise
            deleteExercise($userId, $_GET['id']);
        } else {
            // Delete template
            deleteTemplate($userId);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}

/**
 * Get all templates for a user
 * @param int $userId User ID
 */
function getTemplates($userId) {
    $db = new Database();
    
    $db->query("SELECT wt.*, 
                (SELECT COUNT(*) FROM workout_template_exercises wte WHERE wte.template_id = wt.id) as exercise_count
                FROM workout_templates wt 
                WHERE wt.user_id = :user_id 
                ORDER BY wt.is_favorite DESC, wt.name ASC");
    $db->bind(':user_id', $userId);
    
    $templates = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $templates]);
}

/**
 * Get a specific template
 * @param int $userId User ID
 * @param int $templateId Template ID
 */
function getTemplate($userId, $templateId) {
    $db = new Database();
    
    $db->query("SELECT * FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if ($template) {
        echo json_encode(['success' => true, 'data' => $template]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
    }
}

/**
 * Get exercises for a template
 * @param int $userId User ID
 * @param int $templateId Template ID
 */
function getTemplateExercises($userId, $templateId) {
    $db = new Database();
    
    // First verify the template belongs to the user
    $db->query("SELECT id FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Get exercises
    $db->query("SELECT * FROM workout_template_exercises WHERE template_id = :template_id ORDER BY exercise_order ASC");
    $db->bind(':template_id', $templateId);
    
    $exercises = $db->resultSet();
    
    echo json_encode(['success' => true, 'data' => $exercises]);
}

/**
 * Get exercise count for a template
 * @param int $userId User ID
 * @param int $templateId Template ID
 */
function getExerciseCount($userId, $templateId) {
    $db = new Database();
    
    // First verify the template belongs to the user
    $db->query("SELECT id FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Get exercise count
    $db->query("SELECT COUNT(*) as count FROM workout_template_exercises WHERE template_id = :template_id");
    $db->bind(':template_id', $templateId);
    
    $result = $db->single();
    
    echo json_encode(['success' => true, 'count' => $result ? $result['count'] : 0]);
}

/**
 * Create a new template
 * @param int $userId User ID
 */
function createTemplate($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['name']) || empty(trim($data['name']))) {
        echo json_encode(['success' => false, 'message' => 'Template name is required']);
        return;
    }
    
    $db = new Database();
    
    $db->query("INSERT INTO workout_templates (user_id, name, description, is_favorite) 
               VALUES (:user_id, :name, :description, :is_favorite)");
    
    $db->bind(':user_id', $userId);
    $db->bind(':name', trim($data['name']));
    $db->bind(':description', isset($data['description']) ? trim($data['description']) : null);
    $db->bind(':is_favorite', isset($data['is_favorite']) && $data['is_favorite'] ? 1 : 0);
    
    if ($db->execute()) {
        $templateId = $db->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Template created successfully',
            'template_id' => $templateId
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create template']);
    }
}

/**
 * Update an existing template
 * @param int $userId User ID
 */
function updateTemplate($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id']) || !is_numeric($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'Valid template ID is required']);
        return;
    }
    
    if (!isset($data['name']) || empty(trim($data['name']))) {
        echo json_encode(['success' => false, 'message' => 'Template name is required']);
        return;
    }
    
    $templateId = (int)$data['id'];
    
    $db = new Database();
    
    // Verify ownership
    $db->query("SELECT id FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Update template
    $db->query("UPDATE workout_templates SET name = :name, description = :description, is_favorite = :is_favorite 
               WHERE id = :id");
    
    $db->bind(':id', $templateId);
    $db->bind(':name', trim($data['name']));
    $db->bind(':description', isset($data['description']) ? trim($data['description']) : null);
    $db->bind(':is_favorite', isset($data['is_favorite']) && $data['is_favorite'] ? 1 : 0);
    
    if ($db->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Template updated successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update template']);
    }
}

/**
 * Delete a template
 * @param int $userId User ID
 */
function deleteTemplate($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id']) || !is_numeric($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'Valid template ID is required']);
        return;
    }
    
    $templateId = (int)$data['id'];
    
    $db = new Database();
    
    // Verify ownership
    $db->query("SELECT id FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Delete template (exercises will be deleted automatically due to foreign key constraint)
    $db->query("DELETE FROM workout_templates WHERE id = :id");
    $db->bind(':id', $templateId);
    
    if ($db->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Template deleted successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete template']);
    }
}

/**
 * Toggle template favorite status
 * @param int $userId User ID
 * @param int $templateId Template ID
 */
function toggleFavorite($userId, $templateId) {
    $db = new Database();
    
    // Verify ownership
    $db->query("SELECT id, is_favorite FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Toggle favorite status
    $newStatus = $template['is_favorite'] ? 0 : 1;
    
    $db->query("UPDATE workout_templates SET is_favorite = :is_favorite WHERE id = :id");
    $db->bind(':id', $templateId);
    $db->bind(':is_favorite', $newStatus);
    
    if ($db->execute()) {
        echo json_encode([
            'success' => true,
            'is_favorite' => (bool)$newStatus,
            'message' => 'Favorite status updated'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update favorite status']);
    }
}

/**
 * Create a new exercise in a template
 * @param int $userId User ID
 * @param int $templateId Template ID
 */
function createExercise($userId, $templateId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['muscle_group']) || empty(trim($data['muscle_group'])) ||
        !isset($data['equipment']) || empty(trim($data['equipment'])) ||
        !isset($data['exercise_name']) || empty(trim($data['exercise_name']))) {
        echo json_encode(['success' => false, 'message' => 'Muscle group, equipment, and exercise name are required']);
        return;
    }
    
    $db = new Database();
    
    // Verify template ownership
    $db->query("SELECT id FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Get the highest current order
    $db->query("SELECT MAX(exercise_order) AS max_order FROM workout_template_exercises WHERE template_id = :template_id");
    $db->bind(':template_id', $templateId);
    $result = $db->single();
    
    $order = ($result && isset($result['max_order'])) ? $result['max_order'] + 1 : 1;
    
    // Insert the new exercise
    $db->query("INSERT INTO workout_template_exercises 
               (template_id, muscle_group, equipment, exercise_name, default_sets, default_reps, default_weight, default_rir, exercise_order) 
               VALUES 
               (:template_id, :muscle_group, :equipment, :exercise_name, :default_sets, :default_reps, :default_weight, :default_rir, :exercise_order)");
    
    $db->bind(':template_id', $templateId);
    $db->bind(':muscle_group', trim($data['muscle_group']));
    $db->bind(':equipment', trim($data['equipment']));
    $db->bind(':exercise_name', trim($data['exercise_name']));
    $db->bind(':default_sets', isset($data['default_sets']) && !empty($data['default_sets']) ? (int)$data['default_sets'] : null);
    $db->bind(':default_reps', isset($data['default_reps']) && !empty($data['default_reps']) ? (int)$data['default_reps'] : null);
    $db->bind(':default_weight', isset($data['default_weight']) && !empty($data['default_weight']) ? (float)$data['default_weight'] : null);
    $db->bind(':default_rir', isset($data['default_rir']) && !empty($data['default_rir']) ? (int)$data['default_rir'] : null);
    $db->bind(':exercise_order', $order);
    
    if ($db->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Exercise added successfully',
            'exercise_id' => $db->lastInsertId()
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add exercise']);
    }
}

/**
 * Update an existing exercise in a template
 * @param int $userId User ID
 * @param int $exerciseId Exercise ID
 */
function updateExercise($userId, $exerciseId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['muscle_group']) || empty(trim($data['muscle_group'])) ||
        !isset($data['equipment']) || empty(trim($data['equipment'])) ||
        !isset($data['exercise_name']) || empty(trim($data['exercise_name']))) {
        echo json_encode(['success' => false, 'message' => 'Muscle group, equipment, and exercise name are required']);
        return;
    }
    
    $db = new Database();
    
    // Verify exercise belongs to a template owned by the user
    $db->query("SELECT e.id FROM workout_template_exercises e
               JOIN workout_templates t ON e.template_id = t.id
               WHERE e.id = :id AND t.user_id = :user_id");
    $db->bind(':id', $exerciseId);
    $db->bind(':user_id', $userId);
    
    $exercise = $db->single();
    
    if (!$exercise) {
        echo json_encode(['success' => false, 'message' => 'Exercise not found or access denied']);
        return;
    }
    
    // Update the exercise
    $db->query("UPDATE workout_template_exercises SET
               muscle_group = :muscle_group,
               equipment = :equipment,
               exercise_name = :exercise_name,
               default_sets = :default_sets,
               default_reps = :default_reps,
               default_weight = :default_weight,
               default_rir = :default_rir
               WHERE id = :id");
    
    $db->bind(':id', $exerciseId);
    $db->bind(':muscle_group', trim($data['muscle_group']));
    $db->bind(':equipment', trim($data['equipment']));
    $db->bind(':exercise_name', trim($data['exercise_name']));
    $db->bind(':default_sets', isset($data['default_sets']) && !empty($data['default_sets']) ? (int)$data['default_sets'] : null);
    $db->bind(':default_reps', isset($data['default_reps']) && !empty($data['default_reps']) ? (int)$data['default_reps'] : null);
    $db->bind(':default_weight', isset($data['default_weight']) && !empty($data['default_weight']) ? (float)$data['default_weight'] : null);
    $db->bind(':default_rir', isset($data['default_rir']) && !empty($data['default_rir']) ? (int)$data['default_rir'] : null);
    
    if ($db->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Exercise updated successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update exercise']);
    }
}

/**
 * Delete an exercise from a template
 * @param int $userId User ID
 * @param int $exerciseId Exercise ID
 */
function deleteExercise($userId, $exerciseId) {
    $db = new Database();
    
    // Verify exercise belongs to a template owned by the user
    $db->query("SELECT e.id, e.template_id FROM workout_template_exercises e
               JOIN workout_templates t ON e.template_id = t.id
               WHERE e.id = :id AND t.user_id = :user_id");
    $db->bind(':id', $exerciseId);
    $db->bind(':user_id', $userId);
    
    $exercise = $db->single();
    
    if (!$exercise) {
        echo json_encode(['success' => false, 'message' => 'Exercise not found or access denied']);
        return;
    }
    
    // Delete the exercise
    $db->query("DELETE FROM workout_template_exercises WHERE id = :id");
    $db->bind(':id', $exerciseId);
    
    if ($db->execute()) {
        // Reorder remaining exercises
        $db->query("SET @rank = 0");
        $db->execute();
        
        $db->query("UPDATE workout_template_exercises
                   SET exercise_order = (@rank := @rank + 1)
                   WHERE template_id = :template_id
                   ORDER BY exercise_order");
        $db->bind(':template_id', $exercise['template_id']);
        $db->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Exercise deleted successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete exercise']);
    }
}

/**
 * Reorder exercises in a template
 * @param int $userId User ID
 * @param int $templateId Template ID
 */
function reorderExercises($userId, $templateId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['exercises']) || !is_array($data['exercises']) || empty($data['exercises'])) {
        echo json_encode(['success' => false, 'message' => 'Exercise order data is required']);
        return;
    }
    
    $db = new Database();
    
    // Verify template ownership
    $db->query("SELECT id FROM workout_templates WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $templateId);
    $db->bind(':user_id', $userId);
    
    $template = $db->single();
    
    if (!$template) {
        echo json_encode(['success' => false, 'message' => 'Template not found or access denied']);
        return;
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Update the order of each exercise
        foreach ($data['exercises'] as $index => $exerciseId) {
            $db->query("UPDATE workout_template_exercises SET exercise_order = :order WHERE id = :id AND template_id = :template_id");
            $db->bind(':order', $index + 1);
            $db->bind(':id', $exerciseId);
            $db->bind(':template_id', $templateId);
            $db->execute();
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Exercise order updated successfully'
        ]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to update exercise order: ' . $e->getMessage()]);
    }
}
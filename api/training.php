<?php
require_once '../includes/functions.php';
require_once '../includes/db.php';
require_once '../includes/classes/PersonalRecord.php';

function checkForPersonalRecords($userId, $workoutDetails, $sessionDate) {
    $prHandler = new PersonalRecord();
    $prs = [];
    
    foreach ($workoutDetails as $exercise) {
        if (empty($exercise['load_weight']) || empty($exercise['reps'])) {
            continue;
        }

        // Add required fields for PR check
        $exercise['user_id'] = $userId;
        $newPRs = $prHandler->checkForPRs($exercise, $sessionDate, $exercise['id']);
        
        if (!empty($newPRs)) {
            $prs = array_merge($prs, $newPRs);
        }
    }
    
    return [
        'success' => true,
        'has_prs' => !empty($prs),
        'prs' => $prs
    ];
}

function createPR($userId, $exerciseId, $value, $type, $date, $workoutDetailId) {
    $db = new Database();
    
    $db->query("INSERT INTO personal_records 
                (user_id, exercise_id, record_value, record_type, date, workout_detail_id, is_acknowledged) 
                VALUES 
                (:user_id, :exercise_id, :value, :type, :date, :workout_id, 0)");
    
    $db->bind(':user_id', $userId);
    $db->bind(':exercise_id', $exerciseId);
    $db->bind(':value', $value);
    $db->bind(':type', $type);
    $db->bind(':date', $date);
    $db->bind(':workout_id', $workoutDetailId);
    
    return $db->execute();
}

function save_training() {
    // ...existing save logic...

    if ($success) {
        // Format workout details for PR check
        $workoutDetails = [];
        foreach ($_POST['exercises'] as $exercise) {
            $workoutDetails[] = [
                'exercise_name' => $exercise['name'],
                'sets' => $exercise['sets'],
                'reps' => $exercise['reps'],
                'load_weight' => $exercise['weight'],
                'id' => $lastWorkoutDetailId // Get this from your insert
            ];
        }

        // Check for PRs
        checkForPersonalRecords($_SESSION['user_id'], $workoutDetails, $_POST['date']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Training session saved successfully'
        ]);
    }
}
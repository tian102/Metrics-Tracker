<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/user_functions.php';

// Ensure user is logged in
requireLogin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['theme'])) {
    $theme = trim($_POST['theme']);
    
    // Validate theme
    $validThemes = ['default', 'dark', 'tech', 'modern'];
    if (!in_array($theme, $validThemes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid theme selection']);
        exit;
    }

    $userData = [
        'id' => $_SESSION['user_id'],
        'theme' => $theme
    ];
    
    $result = updateUserProfile($userData);
    
    if ($result['success']) {
        $_SESSION['user_theme'] = $theme; // Store theme in session
    }
    
    echo json_encode($result);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);

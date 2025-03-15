<?php
require_once 'db.php';

/**
 * User registration function
 * @param array $data User data
 * @return array Result with success status and message
 */
function registerUser($data) {
    $db = new Database();
    
    // Check if username exists
    $db->query("SELECT id FROM users WHERE username = :username");
    $db->bind(':username', $data['username']);
    $existingUser = $db->single();
    
    if ($existingUser) {
        return ['success' => false, 'message' => 'Username already exists'];
    }
    
    // Check if email exists
    $db->query("SELECT id FROM users WHERE email = :email");
    $db->bind(':email', $data['email']);
    $existingEmail = $db->single();
    
    if ($existingEmail) {
        return ['success' => false, 'message' => 'Email already exists'];
    }
    
    // Password validation
    if (strlen($data['password']) < 8) {
        return ['success' => false, 'message' => 'Password must be at least 8 characters long'];
    }
    
    if ($data['password'] !== $data['confirm_password']) {
        return ['success' => false, 'message' => 'Passwords do not match'];
    }
    
    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Insert user
    $db->query("INSERT INTO users (username, email, password, first_name, last_name, date_of_birth, gender, weight_unit, height, height_unit) 
                VALUES (:username, :email, :password, :first_name, :last_name, :date_of_birth, :gender, :weight_unit, :height, :height_unit)");
    
    $db->bind(':username', $data['username']);
    $db->bind(':email', $data['email']);
    $db->bind(':password', $hashedPassword);
    $db->bind(':first_name', $data['first_name'] ?? null);
    $db->bind(':last_name', $data['last_name'] ?? null);
    $db->bind(':date_of_birth', $data['date_of_birth'] ?? null);
    $db->bind(':gender', $data['gender'] ?? null);
    $db->bind(':weight_unit', $data['weight_unit'] ?? 'kg');
    $db->bind(':height', $data['height'] ?? null);
    $db->bind(':height_unit', $data['height_unit'] ?? 'cm');
    
    try {
        $db->execute();
        return ['success' => true, 'message' => 'Registration successful! You can now log in.', 'user_id' => $db->lastInsertId()];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()];
    }
}

/**
 * User login function
 * @param string $username Username or email
 * @param string $password Password
 * @return array Result with success status, message, and user data if successful
 */
function loginUser($username, $password) {
    $db = new Database();
    
    // Check if input is email or username
    $isEmail = filter_var($username, FILTER_VALIDATE_EMAIL);
    
    if ($isEmail) {
        $db->query("SELECT * FROM users WHERE email = :credential");
    } else {
        $db->query("SELECT * FROM users WHERE username = :credential");
    }
    
    $db->bind(':credential', $username);
    $user = $db->single();
    
    if (!$user) {
        return ['success' => false, 'message' => 'Invalid username/email or password'];
    }
    
    // Verify password
    if (password_verify($password, $user['password'])) {
        // Update last login time
        $db->query("UPDATE users SET last_login = NOW() WHERE id = :id");
        $db->bind(':id', $user['id']);
        $db->execute();
        
        // Remove password from user data before returning
        unset($user['password']);
        
        return ['success' => true, 'message' => 'Login successful', 'user' => $user];
    } else {
        return ['success' => false, 'message' => 'Invalid username/email or password'];
    }
}

/**
 * Get user by ID
 * @param int $userId User ID
 * @return array|bool User data or false if not found
 */
function getUserById($userId) {
    $db = new Database();
    $db->query("SELECT * FROM users WHERE id = :id");
    $db->bind(':id', $userId);
    $user = $db->single();
    
    if ($user) {
        unset($user['password']);
    }
    
    return $user;
}

/**
 * Update user profile
 * @param array $data User data to update
 * @return array Result with success status and message
 */
function updateUserProfile($data) {
    $db = new Database();
    
    // Check if email is being changed and if new email exists
    if (isset($data['email']) && !empty($data['email'])) {
        $db->query("SELECT id FROM users WHERE email = :email AND id != :id");
        $db->bind(':email', $data['email']);
        $db->bind(':id', $data['id']);
        $existingEmail = $db->single();
        
        if ($existingEmail) {
            return ['success' => false, 'message' => 'Email already exists'];
        }
    }
    
    // Build update query based on provided fields
    $updates = [];
    $params = [':id' => $data['id']];
    
    $updateableFields = [
        'email', 'first_name', 'last_name', 'date_of_birth', 
        'gender', 'weight_unit', 'height', 'height_unit', 'theme'
    ];
    
    foreach ($updateableFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }
    
    // Handle password update separately (requires verification)
    if (isset($data['current_password']) && isset($data['new_password']) && isset($data['confirm_password'])) {
        // Verify current password
        $db->query("SELECT password FROM users WHERE id = :id");
        $db->bind(':id', $data['id']);
        $userData = $db->single();
        
        if (!password_verify($data['current_password'], $userData['password'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }
        
        // Validate new password
        if (strlen($data['new_password']) < 8) {
            return ['success' => false, 'message' => 'New password must be at least 8 characters long'];
        }
        
        if ($data['new_password'] !== $data['confirm_password']) {
            return ['success' => false, 'message' => 'New passwords do not match'];
        }
        
        // Add password update
        $updates[] = "password = :password";
        $params[':password'] = password_hash($data['new_password'], PASSWORD_DEFAULT);
    }
    
    // Execute update if there are fields to update
    if (!empty($updates)) {
        $updateQuery = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
        $db->query($updateQuery);
        
        foreach ($params as $param => $value) {
            $db->bind($param, $value);
        }
        
        try {
            $db->execute();
            return ['success' => true, 'message' => 'Profile updated successfully'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Profile update failed: ' . $e->getMessage()];
        }
    }
    
    return ['success' => false, 'message' => 'No changes to update'];
}

/**
 * Generate a password reset token
 * @param string $email User email
 * @return array Result with success status, message, and token if successful
 */
function generatePasswordResetToken($email) {
    $db = new Database();
    
    // Find user by email
    $db->query("SELECT id FROM users WHERE email = :email");
    $db->bind(':email', $email);
    $user = $db->single();
    
    if (!$user) {
        return ['success' => false, 'message' => 'No account found with that email address'];
    }
    
    // Generate token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Delete any existing tokens for this user
    $db->query("DELETE FROM password_reset_tokens WHERE user_id = :user_id");
    $db->bind(':user_id', $user['id']);
    $db->execute();
    
    // Insert new token
    $db->query("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)");
    $db->bind(':user_id', $user['id']);
    $db->bind(':token', $token);
    $db->bind(':expires_at', $expires);
    
    try {
        $db->execute();
        return [
            'success' => true, 
            'message' => 'Password reset token generated', 
            'token' => $token,
            'email' => $email,
            'expires' => $expires
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Failed to generate reset token'];
    }
}

/**
 * Reset password using token
 * @param string $token Reset token
 * @param string $password New password
 * @param string $confirmPassword Confirm new password
 * @return array Result with success status and message
 */
function resetPassword($token, $password, $confirmPassword) {
    $db = new Database();
    
    // Validate token
    $db->query("SELECT * FROM password_reset_tokens WHERE token = :token AND expires_at > NOW()");
    $db->bind(':token', $token);
    $tokenData = $db->single();
    
    if (!$tokenData) {
        return ['success' => false, 'message' => 'Invalid or expired token'];
    }
    
    // Validate password
    if (strlen($password) < 8) {
        return ['success' => false, 'message' => 'Password must be at least 8 characters long'];
    }
    
    if ($password !== $confirmPassword) {
        return ['success' => false, 'message' => 'Passwords do not match'];
    }
    
    // Update password
    $db->query("UPDATE users SET password = :password WHERE id = :user_id");
    $db->bind(':password', password_hash($password, PASSWORD_DEFAULT));
    $db->bind(':user_id', $tokenData['user_id']);
    
    try {
        $db->execute();
        
        // Delete used token
        $db->query("DELETE FROM password_reset_tokens WHERE id = :id");
        $db->bind(':id', $tokenData['id']);
        $db->execute();
        
        return ['success' => true, 'message' => 'Password has been reset successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Failed to reset password: ' . $e->getMessage()];
    }
}

/**
 * Check if user is logged in
 * @return bool True if user is logged in, false otherwise
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Get current user data
 * @return array|null User data or null if not logged in
 */
function getCurrentUser() {
    if (isLoggedIn()) {
        return getUserById($_SESSION['user_id']);
    }
    return null;
}

/**
 * Redirect if not logged in
 * @param string $redirectUrl URL to redirect to if not logged in
 */
function requireLogin($redirectUrl = 'login.php') {
    if (!isLoggedIn()) {
        $_SESSION['message'] = 'Please log in to access this page';
        $_SESSION['message_type'] = 'warning';
        header("Location: $redirectUrl");
        exit;
    }
}

/**
 * Export user data as CSV files
 * @param int $userId User ID
 * @return array Result with success status and file paths
 */
function exportUserDataToCSV($userId) {
    $db = new Database();
    $results = [];
    
    // Export daily metrics
    $db->query("SELECT * FROM daily_metrics WHERE user_id = :user_id ORDER BY date DESC");
    $db->bind(':user_id', $userId);
    $dailyMetrics = $db->resultSet();
    
    if (count($dailyMetrics) > 0) {
        $tempFile = tempnam(sys_get_temp_dir(), 'daily_metrics_');
        $fp = fopen($tempFile, 'w');
        
        // Write headers
        $headers = array_keys($dailyMetrics[0]);
        fputcsv($fp, $headers);
        
        // Write data
        foreach ($dailyMetrics as $row) {
            fputcsv($fp, $row);
        }
        
        fclose($fp);
        $results['daily_metrics'] = $tempFile;
    }
    
    // Export training sessions
    $db->query("SELECT * FROM training_sessions WHERE user_id = :user_id ORDER BY date DESC");
    $db->bind(':user_id', $userId);
    $trainingSessions = $db->resultSet();
    
    if (count($trainingSessions) > 0) {
        $tempFile = tempnam(sys_get_temp_dir(), 'training_sessions_');
        $fp = fopen($tempFile, 'w');
        
        // Write headers
        $headers = array_keys($trainingSessions[0]);
        fputcsv($fp, $headers);
        
        // Write data
        foreach ($trainingSessions as $row) {
            fputcsv($fp, $row);
        }
        
        fclose($fp);
        $results['training_sessions'] = $tempFile;
        
        // Also export workout details for these sessions
        $sessionIds = array_column($trainingSessions, 'id');
        
        if (!empty($sessionIds)) {
            $db->query("SELECT * FROM workout_details WHERE session_id IN (" . implode(',', $sessionIds) . ") ORDER BY session_id, id");
            $workoutDetails = $db->resultSet();
            
            if (count($workoutDetails) > 0) {
                $tempFile = tempnam(sys_get_temp_dir(), 'workout_details_');
                $fp = fopen($tempFile, 'w');
                
                // Write headers
                $headers = array_keys($workoutDetails[0]);
                fputcsv($fp, $headers);
                
                // Write data
                foreach ($workoutDetails as $row) {
                    fputcsv($fp, $row);
                }
                
                fclose($fp);
                $results['workout_details'] = $tempFile;
            }
        }
    }
    
    return ['success' => true, 'files' => $results];
}

/**
 * Remove all user data except account information
 * @param int $userId User ID
 * @return array Result with success status and message
 */
function removeAllUserData($userId) {
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
            $db->query("DELETE FROM workout_details WHERE session_id IN (" . implode(',', $sessionIds) . ")");
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
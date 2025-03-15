<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/user_functions.php';

// Redirect if not logged in
requireLogin();

// Get current user data
$user = getCurrentUser();
$errors = [];
$successMessage = '';

// Handle profile update submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_profile'])) {
    $userData = [
        'id' => $_SESSION['user_id'],
        'email' => isset($_POST['email']) ? trim($_POST['email']) : $user['email'],
        'first_name' => isset($_POST['first_name']) ? trim($_POST['first_name']) : $user['first_name'],
        'last_name' => isset($_POST['last_name']) ? trim($_POST['last_name']) : $user['last_name'],
        'gender' => isset($_POST['gender']) ? trim($_POST['gender']) : $user['gender'],
        'date_of_birth' => isset($_POST['date_of_birth']) ? trim($_POST['date_of_birth']) : $user['date_of_birth'],
        'weight_unit' => isset($_POST['weight_unit']) ? trim($_POST['weight_unit']) : $user['weight_unit'],
        'height' => isset($_POST['height']) ? trim($_POST['height']) : $user['height'],
        'height_unit' => isset($_POST['height_unit']) ? trim($_POST['height_unit']) : $user['height_unit'],
        'theme' => isset($_POST['theme']) ? trim($_POST['theme']) : $user['theme']
    ];
    
    // Basic validation
    if (empty($userData['email'])) {
        $errors[] = 'Email is required';
    } elseif (!filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address';
    }
    
    // Attempt to update profile if no validation errors
    if (empty($errors)) {
        $result = updateUserProfile($userData);
        
        if ($result['success']) {
            $successMessage = $result['message'];
            $user = getUserById($_SESSION['user_id']); // Refresh user data
            
            // Redirect to apply theme change immediately
            if (isset($_POST['theme'])) {
                header('Location: profile.php?success=1');
                exit;
            }
        } else {
            $errors[] = $result['message'];
        }
    }
}

// Handle password change submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['change_password'])) {
    $passwordData = [
        'id' => $_SESSION['user_id'],
        'current_password' => isset($_POST['current_password']) ? $_POST['current_password'] : '',
        'new_password' => isset($_POST['new_password']) ? $_POST['new_password'] : '',
        'confirm_password' => isset($_POST['confirm_password']) ? $_POST['confirm_password'] : ''
    ];
    
    // Basic validation
    if (empty($passwordData['current_password'])) {
        $errors[] = 'Current password is required';
    }
    
    if (empty($passwordData['new_password'])) {
        $errors[] = 'New password is required';
    } elseif (strlen($passwordData['new_password']) < 8) {
        $errors[] = 'New password must be at least 8 characters long';
    }
    
    if ($passwordData['new_password'] !== $passwordData['confirm_password']) {
        $errors[] = 'New passwords do not match';
    }
    
    // Attempt to change password if no validation errors
    if (empty($errors)) {
        $result = updateUserProfile($passwordData);
        
        if ($result['success']) {
            $successMessage = $result['message'];
        } else {
            $errors[] = $result['message'];
        }
    }
}

// Check for success message from redirect
if (isset($_GET['success']) && $_GET['success'] == '1') {
    $successMessage = 'Profile updated successfully';
}

// Page title
$pageTitle = 'My Profile';

// Include header
require_once 'includes/header.php';
?>

<div class="row">
    <div class="col-md-12 mb-4">
        <div class="card shadow-sm">
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center bg-primary text-white">
                <h2 class="mb-2 mb-md-0">My Profile</h2>
            </div>
            <div class="card-body">
                <?php if (!empty($successMessage)): ?>
                    <div class="alert alert-success alert-dismissible fade show">
                        <?php echo $successMessage; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger">
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                                <li><?php echo $error; ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <!-- Nav tabs -->
                <ul class="nav nav-tabs mb-4" id="profileTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="true">Profile Information</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="theme-tab" data-bs-toggle="tab" data-bs-target="#theme" type="button" role="tab" aria-controls="theme" aria-selected="false">Appearance</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="password-tab" data-bs-toggle="tab" data-bs-target="#password" type="button" role="tab" aria-controls="password" aria-selected="false">Change Password</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="data-tab" data-bs-toggle="tab" data-bs-target="#data" type="button" role="tab" aria-controls="data" aria-selected="false">Data</button>
                    </li>
                </ul>
                
                <!-- Tab panes -->
                <div class="tab-content">
                    <!-- Profile Information Tab -->
                    <div class="tab-pane fade show active" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                        <form action="profile.php" method="POST">
                            <input type="hidden" name="update_profile" value="1">
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="username" class="form-label">Username</label>
                                    <input type="text" class="form-control" id="username" value="<?php echo htmlspecialchars($user['username']); ?>" disabled>
                                    <div class="form-text">Username cannot be changed</div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($user['email']); ?>" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="first_name" class="form-label">First Name</label>
                                    <input type="text" class="form-control" id="first_name" name="first_name" value="<?php echo htmlspecialchars($user['first_name'] ?? ''); ?>">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="last_name" class="form-label">Last Name</label>
                                    <input type="text" class="form-control" id="last_name" name="last_name" value="<?php echo htmlspecialchars($user['last_name'] ?? ''); ?>">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="gender" class="form-label">Gender</label>
                                    <select class="form-select" id="gender" name="gender">
                                        <option value="" <?php echo empty($user['gender']) ? 'selected' : ''; ?>>Prefer not to say</option>
                                        <option value="male" <?php echo ($user['gender'] ?? '') === 'male' ? 'selected' : ''; ?>>Male</option>
                                        <option value="female" <?php echo ($user['gender'] ?? '') === 'female' ? 'selected' : ''; ?>>Female</option>
                                        <option value="other" <?php echo ($user['gender'] ?? '') === 'other' ? 'selected' : ''; ?>>Other</option>
                                    </select>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="date_of_birth" class="form-label">Date of Birth</label>
                                    <input type="date" class="form-control" id="date_of_birth" name="date_of_birth" value="<?php echo htmlspecialchars($user['date_of_birth'] ?? ''); ?>">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="height" class="form-label">Height</label>
                                    <div class="input-group">
                                        <input type="number" step="0.01" class="form-control" id="height" name="height" value="<?php echo htmlspecialchars($user['height'] ?? ''); ?>">
                                        <select class="form-select" id="height_unit" name="height_unit">
                                            <option value="cm" <?php echo ($user['height_unit'] ?? 'cm') === 'cm' ? 'selected' : ''; ?>>cm</option>
                                            <option value="in" <?php echo ($user['height_unit'] ?? 'cm') === 'in' ? 'selected' : ''; ?>>in</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Preferred Weight Unit</label>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="weight_unit" id="weight_unit_kg" value="kg" <?php echo ($user['weight_unit'] ?? 'kg') === 'kg' ? 'checked' : ''; ?>>
                                        <label class="form-check-label" for="weight_unit_kg">Kilograms (kg)</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="weight_unit" id="weight_unit_lb" value="lb" <?php echo ($user['weight_unit'] ?? 'kg') === 'lb' ? 'checked' : ''; ?>>
                                        <label class="form-check-label" for="weight_unit_lb">Pounds (lb)</label>
                                    </div>
                                </div>
                                
                                <div class="col-12 mt-3">
                                    <button type="submit" class="btn btn-primary">Update Profile</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Theme Selection Tab -->
                    <div class="tab-pane fade" id="theme" role="tabpanel" aria-labelledby="theme-tab">
                        <form action="profile.php" method="POST">
                            <input type="hidden" name="update_profile" value="1">
                            <input type="hidden" name="id" value="<?php echo $_SESSION['user_id']; ?>">
                            
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h4>Theme Selection</h4>
                                    <p>Customize the appearance of the application by choosing a theme.</p>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-3 col-sm-6 mb-4">
                                    <div class="card theme-card <?php echo ($user['theme'] == 'default' || empty($user['theme'])) ? 'border-primary' : ''; ?>" onclick="document.getElementById('theme_default').checked = true;">
                                        <div class="card-body text-center p-4" style="height: 120px; background-color: #f8f9fa;">
                                            <h5>Default</h5>
                                            <p class="mb-0"><small>Light theme</small></p>
                                        </div>
                                        <div class="card-footer">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="theme" id="theme_default" value="default" <?php echo ($user['theme'] == 'default' || empty($user['theme'])) ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="theme_default">
                                                    Default
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-3 col-sm-6 mb-4">
                                    <div class="card theme-card <?php echo ($user['theme'] == 'dark') ? 'border-primary' : ''; ?>" onclick="document.getElementById('theme_dark').checked = true;">
                                        <div class="card-body text-center p-4" style="height: 120px; background-color: #121212; color: #e0e0e0;">
                                            <h5>Dark</h5>
                                            <p class="mb-0"><small>Dark mode</small></p>
                                        </div>
                                        <div class="card-footer">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="theme" id="theme_dark" value="dark" <?php echo ($user['theme'] == 'dark') ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="theme_dark">
                                                    Dark
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-3 col-sm-6 mb-4">
                                    <div class="card theme-card <?php echo ($user['theme'] == 'blue') ? 'border-primary' : ''; ?>" onclick="document.getElementById('theme_blue').checked = true;">
                                        <div class="card-body text-center p-4" style="height: 120px; background-color: #e8f0fe; color: #1a73e8;">
                                            <h5>Blue</h5>
                                            <p class="mb-0"><small>Material design</small></p>
                                        </div>
                                        <div class="card-footer">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="theme" id="theme_blue" value="blue" <?php echo ($user['theme'] == 'blue') ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="theme_blue">
                                                    Blue
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-3 col-sm-6 mb-4">
                                    <div class="card theme-card <?php echo ($user['theme'] == 'green') ? 'border-primary' : ''; ?>" onclick="document.getElementById('theme_green').checked = true;">
                                        <div class="card-body text-center p-4" style="height: 120px; background-color: #f0f7ee; color: #51a351;">
                                            <h5>Green</h5>
                                            <p class="mb-0"><small>Nature inspired</small></p>
                                        </div>
                                        <div class="card-footer">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="theme" id="theme_green" value="green" <?php echo ($user['theme'] == 'green') ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="theme_green">
                                                    Green
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-3 col-sm-6 mb-4">
                                    <div class="card theme-card <?php echo ($user['theme'] == 'purple') ? 'border-primary' : ''; ?>" onclick="document.getElementById('theme_purple').checked = true;">
                                        <div class="card-body text-center p-4" style="height: 120px; background-color: #f8f5fe; color: #673ab7;">
                                            <h5>Purple</h5>
                                            <p class="mb-0"><small>Vibrant & creative</small></p>
                                        </div>
                                        <div class="card-footer">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="theme" id="theme_purple" value="purple" <?php echo ($user['theme'] == 'purple') ? 'checked' : ''; ?>>
                                                <label class="form-check-label" for="theme_purple">
                                                    Purple
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary">Save Theme</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Change Password Tab -->
                    <div class="tab-pane fade" id="password" role="tabpanel" aria-labelledby="password-tab">
                        <form action="profile.php" method="POST">
                            <input type="hidden" name="change_password" value="1">
                            
                            <div class="row">
                                <div class="col-md-12 mb-3">
                                    <label for="current_password" class="form-label">Current Password</label>
                                    <input type="password" class="form-control" id="current_password" name="current_password" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="new_password" class="form-label">New Password</label>
                                    <input type="password" class="form-control" id="new_password" name="new_password" required>
                                    <div class="form-text">Min. 8 characters</div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="confirm_password" class="form-label">Confirm New Password</label>
                                    <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                </div>
                                
                                <div class="col-12 mt-3">
                                    <button type="submit" class="btn btn-primary">Change Password</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Data Management Tab -->
                    <div class="tab-pane fade" id="data" role="tabpanel" aria-labelledby="data-tab">
                        <div class="row mb-4">
                            <div class="col-12">
                                <h4>Data Management</h4>
                                <p>Export your data or remove all your data from the system.</p>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-4">
                                <div class="card">
                                    <div class="card-body text-center p-4">
                                        <div class="mb-3">
                                            <i class="fas fa-file-export fa-3x text-primary"></i>
                                        </div>
                                        <h5>Export Data</h5>
                                        <p>Download all your data as CSV files for backup or personal use.</p>
                                        <button id="exportDataBtn" class="btn btn-primary">
                                            <i class="fas fa-download"></i> Export to CSV
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6 mb-4">
                                <div class="card">
                                    <div class="card-body text-center p-4">
                                        <div class="mb-3">
                                            <i class="fas fa-trash-alt fa-3x text-danger"></i>
                                        </div>
                                        <h5>Remove All Data</h5>
                                        <p>Permanently delete all your metrics data from the system.</p>
                                        <button id="removeDataBtn" class="btn btn-danger">
                                            <i class="fas fa-trash"></i> Remove All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Alert Message for Data Operations -->
                        <div id="dataAlertMessage" class="alert mt-3" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>

<!-- Theme Selector JavaScript -->
<script src="assets/js/theme-selector.js"></script>

<!-- Data Management JavaScript -->
<script src="assets/js/data-management.js"></script>
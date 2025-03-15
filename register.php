<?php
require_once 'includes/config.php';
require_once 'includes/user_functions.php';

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$errors = [];
$formData = [
    'username' => '',
    'email' => '',
    'first_name' => '',
    'last_name' => '',
    'gender' => '',
    'date_of_birth' => '',
    'weight_unit' => 'kg',
    'height' => '',
    'height_unit' => 'cm'
];

// Handle registration form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Get form data
    $formData = [
        'username' => isset($_POST['username']) ? trim($_POST['username']) : '',
        'email' => isset($_POST['email']) ? trim($_POST['email']) : '',
        'password' => isset($_POST['password']) ? $_POST['password'] : '',
        'confirm_password' => isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '',
        'first_name' => isset($_POST['first_name']) ? trim($_POST['first_name']) : '',
        'last_name' => isset($_POST['last_name']) ? trim($_POST['last_name']) : '',
        'gender' => isset($_POST['gender']) ? trim($_POST['gender']) : '',
        'date_of_birth' => isset($_POST['date_of_birth']) ? trim($_POST['date_of_birth']) : '',
        'weight_unit' => isset($_POST['weight_unit']) ? trim($_POST['weight_unit']) : 'kg',
        'height' => isset($_POST['height']) ? trim($_POST['height']) : '',
        'height_unit' => isset($_POST['height_unit']) ? trim($_POST['height_unit']) : 'cm'
    ];
    
    // Basic validation
    if (empty($formData['username'])) {
        $errors[] = 'Username is required';
    } elseif (strlen($formData['username']) < 3) {
        $errors[] = 'Username must be at least 3 characters long';
    }
    
    if (empty($formData['email'])) {
        $errors[] = 'Email is required';
    } elseif (!filter_var($formData['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address';
    }
    
    if (empty($formData['password'])) {
        $errors[] = 'Password is required';
    } elseif (strlen($formData['password']) < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }
    
    if ($formData['password'] !== $formData['confirm_password']) {
        $errors[] = 'Passwords do not match';
    }
    
    // Attempt registration if no validation errors
    if (empty($errors)) {
        $result = registerUser($formData);
        
        if ($result['success']) {
            $_SESSION['message'] = $result['message'];
            $_SESSION['message_type'] = 'success';
            
            // Redirect to login page
            header('Location: login.php');
            exit;
        } else {
            $errors[] = $result['message'];
        }
    }
}

// Page title
$pageTitle = 'Register';

// Custom header for registration page
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - <?php echo $pageTitle; ?></title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/styles.css">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body class="bg-light">
    <div class="container">
        <div class="row justify-content-center my-5">
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-header bg-primary text-white text-center">
                        <h3 class="mb-0"><?php echo APP_NAME; ?></h3>
                        <p class="mb-0">Create Your Account</p>
                    </div>
                    <div class="card-body">
                        <?php if (!empty($errors)): ?>
                            <div class="alert alert-danger">
                                <ul class="mb-0">
                                    <?php foreach ($errors as $error): ?>
                                        <li><?php echo $error; ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endif; ?>
                        
                        <form action="register.php" method="POST">
                            <div class="row">
                                <!-- Account Information -->
                                <div class="col-md-12 mb-3">
                                    <h5>Account Information</h5>
                                    <hr>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="username" class="form-label">Username*</label>
                                    <input type="text" class="form-control" id="username" name="username" value="<?php echo htmlspecialchars($formData['username']); ?>" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="email" class="form-label">Email*</label>
                                    <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($formData['email']); ?>" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="password" class="form-label">Password*</label>
                                    <input type="password" class="form-control" id="password" name="password" required>
                                    <div class="form-text">Min. 8 characters</div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="confirm_password" class="form-label">Confirm Password*</label>
                                    <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                </div>
                                
                                <!-- Personal Information -->
                                <div class="col-md-12 mb-3 mt-2">
                                    <h5>Personal Information (Optional)</h5>
                                    <hr>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="first_name" class="form-label">First Name</label>
                                    <input type="text" class="form-control" id="first_name" name="first_name" value="<?php echo htmlspecialchars($formData['first_name']); ?>">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="last_name" class="form-label">Last Name</label>
                                    <input type="text" class="form-control" id="last_name" name="last_name" value="<?php echo htmlspecialchars($formData['last_name']); ?>">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="gender" class="form-label">Gender</label>
                                    <select class="form-select" id="gender" name="gender">
                                        <option value="" <?php echo $formData['gender'] === '' ? 'selected' : ''; ?>>Prefer not to say</option>
                                        <option value="male" <?php echo $formData['gender'] === 'male' ? 'selected' : ''; ?>>Male</option>
                                        <option value="female" <?php echo $formData['gender'] === 'female' ? 'selected' : ''; ?>>Female</option>
                                        <option value="other" <?php echo $formData['gender'] === 'other' ? 'selected' : ''; ?>>Other</option>
                                    </select>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="date_of_birth" class="form-label">Date of Birth</label>
                                    <input type="date" class="form-control" id="date_of_birth" name="date_of_birth" value="<?php echo htmlspecialchars($formData['date_of_birth']); ?>">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="height" class="form-label">Height</label>
                                    <div class="input-group">
                                        <input type="number" step="0.01" class="form-control" id="height" name="height" value="<?php echo htmlspecialchars($formData['height']); ?>">
                                        <select class="form-select" id="height_unit" name="height_unit">
                                            <option value="cm" <?php echo $formData['height_unit'] === 'cm' ? 'selected' : ''; ?>>cm</option>
                                            <option value="in" <?php echo $formData['height_unit'] === 'in' ? 'selected' : ''; ?>>in</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Preferred Weight Unit</label>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="weight_unit" id="weight_unit_kg" value="kg" <?php echo $formData['weight_unit'] === 'kg' ? 'checked' : ''; ?>>
                                        <label class="form-check-label" for="weight_unit_kg">Kilograms (kg)</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="weight_unit" id="weight_unit_lb" value="lb" <?php echo $formData['weight_unit'] === 'lb' ? 'checked' : ''; ?>>
                                        <label class="form-check-label" for="weight_unit_lb">Pounds (lb)</label>
                                    </div>
                                </div>
                                
                                <div class="col-12 mt-3">
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary">Register</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer text-center">
                        <p class="mb-0">Already have an account? <a href="login.php">Login</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
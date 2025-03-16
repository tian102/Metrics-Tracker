<?php 
require_once 'includes/config.php';
require_once 'includes/user_functions.php';
$currentUser = isLoggedIn() ? getCurrentUser() : null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#ffffff">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <title><?php echo APP_NAME; ?><?php echo isset($pageTitle) ? ' - ' . $pageTitle : ''; ?></title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/styles.css">
    <!-- Theme CSS -->
    <?php
    $theme = 'default';
    if (isLoggedIn() && !empty($currentUser['theme'])) {
        $theme = $currentUser['theme'];
    }
    echo '<link rel="stylesheet" href="assets/css/themes/' . htmlspecialchars($theme) . '.css">';
    ?>
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <!-- Chart.js for visualizations -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <header class="bg-dark text-white mb-4">
        <div class="container">
            <nav class="navbar navbar-expand-lg navbar-dark">
                <div class="container-fluid">
                    <a class="navbar-brand" href="index.php"><?php echo APP_NAME; ?></a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                        <?php if (isLoggedIn()): ?>
                            <ul class="navbar-nav">
                                <li class="nav-item">
                                    <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'index.php') ? 'active' : ''; ?>" href="index.php">
                                        <i class="fas fa-home"></i> Dashboard
                                    </a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="#" id="dailyTrackingDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fas fa-calendar-day"></i> Daily Tracking
                                    </a>
                                    <ul class="dropdown-menu" aria-labelledby="dailyTrackingDropdown">
                                        <li><a class="dropdown-item" href="daily.php"><i class="fas fa-heartbeat"></i> Health</a></li>
                                        <li><a class="dropdown-item" href="training.php"><i class="fas fa-dumbbell"></i> Training</a></li>
                                    </ul>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'visualize.php') ? 'active' : ''; ?>" href="visualize.php">
                                        <i class="fas fa-chart-bar"></i> Analytics
                                    </a>
                                </li>
                                <!-- Replace the text separator with a border -->
                                <li class="nav-item d-none d-lg-block">
                                    <div class="vr bg-light opacity-50 mx-2 my-2"></div>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fas fa-user"></i> 
                                        <?php echo htmlspecialchars($currentUser['username']); ?>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                        <li><a class="dropdown-item" href="profile.php"><i class="fas fa-user-cog"></i> My Profile</a></li>
                                        <li><a class="dropdown-item" href="dashboard_settings.php"><i class="fas fa-columns"></i> Customize Dashboard</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item" href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                                    </ul>
                                </li>
                            </ul>
                        <?php else: ?>
                            <ul class="navbar-nav">
                                <li class="nav-item">
                                    <a class="nav-link" href="login.php"><i class="fas fa-sign-in-alt"></i> Login</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="register.php"><i class="fas fa-user-plus"></i> Register</a>
                                </li>
                            </ul>
                        <?php endif; ?>
                    </div>
                </div>
            </nav>
        </div>
    </header>
    <main class="container mb-4">
        <?php if (isset($_SESSION['message'])): ?>
            <div class="alert alert-<?php echo $_SESSION['message_type']; ?> alert-dismissible fade show">
                <?php 
                    echo $_SESSION['message'];
                    unset($_SESSION['message']);
                    unset($_SESSION['message_type']);
                ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>
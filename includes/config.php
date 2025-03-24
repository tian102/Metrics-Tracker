<?php
/**
 * Configuration settings for Metrics Tracker
 */

// Database configuration
define('DB_HOST', 'localhost');      // Database host
define('DB_NAME', 'metrics_tracker'); // Database name
define('DB_USER', 'root');           // Database username
define('DB_PASS', '');               // Database password

// Application settings
define('APP_NAME', 'Metrics Tracker');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);  // Set to false in production
define('TIMEZONE', 'UTC');   // Default timezone

// Session configuration
define('SESSION_LIFETIME', 86400); // 24 hours in seconds

// Set default timezone
date_default_timezone_set(TIMEZONE);

// Error reporting
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT & ~E_WARNING);
}

// Set session cookie parameters BEFORE starting the session
if (session_status() === PHP_SESSION_NONE) {
    // Set session cookie parameters first
    session_set_cookie_params(SESSION_LIFETIME);
    
    // Then start the session
    session_start();
}

// Site URLs
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
define('BASE_URL', $protocol . '://' . $host . '/web-apps/metrics-tracker/');
define('ASSETS_URL', BASE_URL . 'assets/');

/**
 * Custom error handler function
 */
function customErrorHandler($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        // This error code is not included in error_reporting
        return false;
    }

    // Log error if needed
    if (DEBUG_MODE) {
        echo "<div class='error-message' style='color: red; border: 1px solid red; padding: 10px; margin: 10px;'>";
        echo "<strong>Error [$errno]:</strong> $errstr<br>";
        echo "File: $errfile on line $errline<br>";
        echo "</div>";
    }

    // Don't execute PHP internal error handler
    return true;
}

// Set custom error handler
if (DEBUG_MODE) {
    set_error_handler("customErrorHandler");
}
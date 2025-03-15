<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Replace with your database username
define('DB_PASS', ''); // Replace with your database password
define('DB_NAME', 'metrics_tracker');

// Application Settings
define('APP_NAME', 'Metrics Tracker');
define('APP_URL', 'http://localhost/metrics-tracker'); // Replace with your actual URL

// Error Reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Session Start
session_start();
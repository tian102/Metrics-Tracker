<?php
require_once 'includes/config.php';

// Destroy session
session_unset();
session_destroy();

// Redirect to login page
header('Location: login.php');
exit;
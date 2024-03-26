<?php
error_reporting(E_ALL); // Enable error reporting

session_start();

// Database connection
$DATABASE_HOST = 'localhost';
$DATABASE_USER = 'root';
$DATABASE_PASS = '';
$DATABASE_NAME = 'phplogin';

// Create connection
$con = mysqli_connect($DATABASE_HOST, $DATABASE_USER, $DATABASE_PASS, $DATABASE_NAME);

// Check connection
if (mysqli_connect_errno()) {
    exit('Failed to connect to MySQL: ' . mysqli_connect_error());
}

// Check if form is submitted
if (!empty($_POST)) {
    // Validate and sanitize user inputs
    $username = '';
    $organization = '';
    $password = '';
    $confirm_password = '';
    $keycode = '';

    // Check if variables are set to avoid undefined variable warnings
    if (isset($_POST['username'])) {
        $username = mysqli_real_escape_string($con, $_POST['username']);
    }
    if (isset($_POST['organization'])) {
        $organization = mysqli_real_escape_string($con, $_POST['organization']);
    }
    if (isset($_POST['password'])) {
        $password = mysqli_real_escape_string($con, $_POST['password']);
    }
    if (isset($_POST['confirm_password'])) {
        $confirm_password = mysqli_real_escape_string($con, $_POST['confirm_password']);
    }
    if (isset($_POST['keycode'])) {
        $keycode = mysqli_real_escape_string($con, $_POST['keycode']);
    }

    // Ensure passwords match
    if ($password !== $confirm_password) {
        echo 'Passwords do not match!';
        exit;
    }

    // Check if provided keycode matches the organization's keycode
    $check_keycode_query = "SELECT keycode FROM organization_keycodes WHERE organization_name = '$organization'";
    $result = mysqli_query($con, $check_keycode_query);
    if (!$result || mysqli_num_rows($result) == 0) {
        echo 'Invalid organization!';
        exit;
    }
    $row = mysqli_fetch_assoc($result);
    $correct_keycode = $row['keycode'];
    if ($keycode !== $correct_keycode) {
        echo 'Invalid keycode for this organization!';
        exit;
    }

    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Prepare an insert statement
    $stmt = $con->prepare('INSERT INTO accounts (username, password, role, organization) VALUES (?, ?, ?, ?)');
    
    // Set the role to 'user' for now
    $role = 'user';
    
    $stmt->bind_param('ssss', $username, $password_hash, $role, $organization);

    // Execute query
    if ($stmt->execute()) {
        // Redirect to login page or wherever appropriate
        header('Location: index.html');
        exit;
    } else {
        // Handle errors
        echo 'Error: ' . $stmt->error;
    }
}

// Close database connection
$con->close();
?>

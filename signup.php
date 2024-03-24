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
    $username = mysqli_real_escape_string($con, $_POST['username']);
    $organization = mysqli_real_escape_string($con, $_POST['organization']);
    $password = mysqli_real_escape_string($con, $_POST['password']);
    $confirm_password = mysqli_real_escape_string($con, $_POST['confirm_password']);

    // Ensure passwords match
    if ($password !== $confirm_password) {
        echo 'Passwords do not match!';
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

<!--<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="Sign-Up.css">
  <title>RSU ACCREDITATION SIGN UP</title>
</head>
<body>-->
  <!--Logo with web title-->
  <!--<div class="container">
    <div class="logo-container">
     <div class="logo-wrap">
      <img src="images/rsu-logo.png" alt="">
     </div>
     <div class="logo-wrap">
       <h3>Student Organizations Accreditation and Reaccreditation </h3>
     </div>
    </div>-->
    <!--sign In  Container-->
  <!--<div class="login-container">
      <img src="images/rsu-background.png" alt="">
      <div class="SignUp-wrap">
        <div class="SignUp-text">
        <h4>Create Account</h4>
        </div>-->
        <!--Form-->
       <!-- <form action="signup.php" method="post">
          <div class="signIn">
          <label for="username"> Username</label>
          <input type="text" name="username" id="username" placeholder="Enter your username" required>
          </div>-->
          <!--Select Org-->
          <!--<div class="signIn">
            <label for="organization">Select Organizations</label>
            <select id="organization" name="organization" required>
                <option value="org1">Organization 1</option>
                <option value="org2">Organization 2</option>
                <option value="org3">Organization 3</option>
                <option value="org4">Organization 4</option>
            </select>
          </div>
          <div class="signIn">
          <label for="password"> Password</label>
          <input type="password" name="password" id="password" placeholder="Enter your password" required>
          </div>
          <div class="signIn">
            <label for="confirm_password"> Confirm password</label>
            <input type="password" name="confirm_password" id="confirm_password" placeholder="Enter your password" required>
            </div>
          <div class="signIn">
            <input type="submit" value="Sign Up">
          </div>
        </form>-->
        <!--End of Form-->
   <!--   </div>
    </div>
  </div>
</body>
</html>-->

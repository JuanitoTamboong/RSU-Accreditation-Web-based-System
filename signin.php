<?php

// Start the session
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
    $username = strtolower(trim($_POST['username']));
    $password = $_POST['password'];

    // Prepare a select statement
    $stmt = $con->prepare('SELECT * FROM accounts WHERE username = ?');
    $stmt->bind_param('s', $username);
    $stmt->execute();

    // Get result
    $result = $stmt->get_result();

    // Check if user exists
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Verify password
        if (password_verify($password, $user['password'])) {
            // Set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];

            // Redirect to dashboard based on user's organization
            switch ($user['organization']) {
                case 'org1':
                    header('Location: dashboard_org1.php');
                    break;
                case 'org2':
                    header('Location: dashboard_org2.php');
                    break;
                // Add cases for other organizations as needed
                default:
                    // Default redirection if organization is not specified
                    header('Location: default-dashboard.php');
                    break;
            }

            exit;
        } else {
            echo 'Invalid password!';
            exit;
        }
    } else {
        echo 'Invalid username or password!';
        exit;
    }

    $stmt->close();
}

?>
<!--
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <link rel="website icon" href="images/rsu-logo.png">
  <link rel="fonts " href="https://fonts.googleapis.com/css2">
  <title> RSU ACCREDITATION LOGIN</title>
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
      <div class="login-wrap">
        <div class="login-text">
        <h4>Login</h4>
        </div>-->
        <!--Form-->
         <!--<form action="signin.php" method="post">
          <div class="signIn">
          <label for="username"> Username</label>
          <input type="text" name="username" id="" placeholder="Enter your username" required>
          </div>
          <div class="signIn">
          <label for="password"> password</label>
          <input type="password" name="password" id="" placeholder="Enter your password" required>
          </div>
          <div class="signIn">
           <a href="#">Forgot  Password?</a>
          </div>
          <div class="signIn">
            <input type="submit" value="sign in">
          </div>
          <div class="SignIn">
           <p>Dont have Account?<a href="signup.php"> Sign Up</a></p>
          </div>
        </form>
        End of Form-->
      <!--</div>
    </div>
  </div>
</body>
</html>-->
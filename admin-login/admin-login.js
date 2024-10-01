import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCZbPRkZ7acdO0mx9_sfotDjueh4YioYwM",
    authDomain: "admin-9ee84.firebaseapp.com",
    projectId: "admin-9ee84",
    storageBucket: "admin-9ee84.appspot.com",
    messagingSenderId: "65720582473",
    appId: "1:65720582473:web:48f63f7d4d100d65039a98"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to handle login
document.getElementById('submit').addEventListener('click', (e) => {
  e.preventDefault(); // Prevent form submission

  // Get user input
  const email = document.getElementById('admin').value;
  const password = document.getElementById('admin-pass').value;

  // Validate input
  if (!email || !password) {
    Swal.fire({
      icon: 'warning',
      title: 'Error',
      text: 'Please fill in both email and password.',
    });
    return;
  }

  // Sign in using Firebase authentication
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Successfully signed in
      const user = userCredential.user;

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: `Welcome ${user.email}!`,
      }).then(() => {
        // Redirect to admin dashboard or another page
        window.location.href = '../admin-dashboard/admin-dashboard.html';
      });
    })
    .catch((error) => {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: `Error: ${error.message}`,
      });
    });
});

// Function to handle password reset
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
  e.preventDefault();

  const email = document.getElementById('admin').value;

  // Check if email is provided
  if (!email) {
    Swal.fire({
      icon: 'warning',
      title: 'Error',
      text: 'Please enter your email address to reset your password.',
    });
    return;
  }

  // Send password reset email
  sendPasswordResetEmail(auth, email)
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Reset Email Sent',
        text: 'Check your inbox for a link to reset your password.',
      });
    })
    .catch((error) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send Reset Email',
        text: `Error: ${error.message}`,
      });
    });
});

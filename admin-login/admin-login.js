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

  // Get hCAPTCHA response
  const recaptchaResponse = grecaptcha.getResponse();

  // Validate input
  if (!email || !password) {
    Swal.fire({
      icon: 'warning',
      title: 'Error',
      text: 'Please fill in both email and password.',
      customClass: {
        popup: 'swal-modal' // Applies the custom background and font class
      }
    });
    return;
  }

  // Check if hCAPTCHA is verified
  if (!recaptchaResponse) {
    Swal.fire({
      icon: 'warning',
      title: 'hCAPTCHA verification failed',
      text: 'Please verify that you are not a robot.',
      customClass: {
        popup: 'swal-modal' 
      }
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
        customClass: {
          popup: 'swal-modal' // Applies the custom background and font class
        }
      }).then(() => {
        // Redirect to admin dashboard or another page
        window.location.href = '../admin-dashboard/admin-dashboard.html';
      });
    })
    .catch((error) => {
      // Handle Firebase login errors
      let errorMessage = 'Login failed. Please try again.';
      
      // Check for specific Firebase error codes
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Admin email not found. Please check your email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please enter a valid email.';
      }

      // Display the specific error message
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errorMessage,
        customClass: {
          popup: 'swal-modal' // Applies the custom background and font class
        }
      });
    });
});

// Toggle password visibility
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('admin-pass');

togglePassword.addEventListener('click', () => {
    // Toggle the type attribute
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle the icon
    if (type === 'password') {
        togglePassword.classList.remove('fa-unlock'); // Change back to lock icon
        togglePassword.classList.add('fa-lock');
    } else {
        togglePassword.classList.remove('fa-lock'); // Change to unlock icon
        togglePassword.classList.add('fa-unlock');
    }
});

// Function to handle password reset with Swal input for email this is for forgot password
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
  e.preventDefault();

  // Show Swal input prompt for email
  swal.fire({
    title: 'Reset Password',
    input: 'email',
    inputLabel: 'Enter your email address',
    inputPlaceholder: 'Email',
    showCancelButton: true,
    confirmButtonText: 'Send Reset Link',
    customClass: {
      popup: 'swal-modal'
    },
    inputValidator: (value) => {
      if (!value) {
        return 'You need to enter your email address!';
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const email = result.value;

      // Send password reset email
      sendPasswordResetEmail(auth, email)
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Reset Email Sent',
            text: 'Check your gmail for a link to reset your password.',
            customClass: {
              popup: 'swal-modal' // Applies the custom background and font class
            }
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed to Send Reset Email',
            text: `Error: ${error.message}`,
            customClass: {
              popup: 'swal-modal' // Applies the custom background and font class
            }
          });
        });
    }
  });
});

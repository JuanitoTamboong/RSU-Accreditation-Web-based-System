import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8jNuRrOWVRl028FSShTp81BoWLeGRPW8",
  authDomain: "login-7d79e.firebaseapp.com",
  projectId: "login-7d79e",
  storageBucket: "login-7d79e.appspot.com",
  messagingSenderId: "471939001993",
  appId: "1:471939001993:web:f5488c18d56f36753010be",
  measurementId: "G-LT5RF0P68C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Function to show loading spinner
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

// Function to hide loading spinner
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

// Function to validate form fields
function validateSignUpForm(email, password, confirmPassword) {
  let isValid = true;
  const errors = [];

  // Check if fields are filled
  if (!email || !password || !confirmPassword) {
    errors.push('All fields are required.');
    isValid = false;
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
    isValid = false;
  }

  return { isValid, errors };
}

// Sign Up Functionality
const signUpForm = document.getElementById('signup-form');
if (signUpForm) {
  signUpForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = signUpForm.elements['email'].value;
    const password = signUpForm.elements['password'].value;
    const confirmPassword = signUpForm.elements['confirm-password'].value;

    // Validate form fields
    const { isValid, errors } = validateSignUpForm(email, password, confirmPassword);
    if (!isValid) {
      alert(errors.join('\n'));
      return; 
    }

    // Show the loading spinner
    showLoading();

    // Create new user
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Send email verification
        sendEmailVerification(user).then(() => {
          hideLoading();
          alert('Sign up successful! Please check your email for verification.');
          window.location.href = "index.html";
        }).catch((error) => {
          hideLoading();
          console.error('Error sending email verification:', error);
          alert('Failed to send verification email. Please try again.');
        });
      })
      .catch((error) => {
        hideLoading();
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error ${errorCode}: ${errorMessage}`);
        alert('Sign up failed. Please try again.');
      });
  });
}

// Forgot Password
const forgotPasswordLink = document.getElementById('forgot-password-link');

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', function(event) {
    event.preventDefault();

    Swal.fire({
      title: 'Enter your email address',
      input: 'email',
      inputLabel: 'We will send you a reset link',
      inputPlaceholder: 'Enter your email address',
      showCancelButton: true,
      confirmButtonText: 'Send',
      customClass: 'swal-wide'
    }).then((result) => {
      if (result.isConfirmed) {
        const email = result.value;

        if (email) {
          // Show loading spinner
          showLoading();

          // Send password reset email
          sendPasswordResetEmail(auth, email)
            .then(() => {
              hideLoading();
              Swal.fire({
                icon: 'success',
                title: 'Password reset link sent!',
                text: 'Check your email for the reset link.',
                customClass: 'swal-wide',
                timer: 2000
              });
            })
            .catch((error) => {
              hideLoading();
              console.error('Error sending reset email:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to send reset email. Please try again.',
                customClass: 'swal-wide',
                timer: 2000
              });
            });
        }
      }
    });
  });
}


// Login Functionality
const signInForm = document.getElementById('login-form');
if (signInForm) {
  signInForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = signInForm.elements['email'].value;
    const password = signInForm.elements['password'].value;

    // Show the loading spinner
    showLoading();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Check if the user's email is verified
        if (user.emailVerified) {
          console.log('User signed in:', user);
          hideLoading();
          window.location.href = "homepage.html";
        } else {
          hideLoading();
          //alert('Please verify your email before logging in. A verification email has been sent to your email address.');
          Swal.fire({
            icon: "info",
            title: "Please verify your email before logging in. A verification email has been sent to your email address",
            showConfirmButton: false,
            customClass: 'swal-wide',
            timer: 2600
          });
        }

      })
      .catch((error) => {
        hideLoading();
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error ${errorCode}: ${errorMessage}`);
       // alert('Invalid email or password. Please try again.');
       Swal.fire({
         icon: "warning",
         title: "Invalid email or password. Please try again",
         showConfirmButton: false,
         customClass: 'swal-wide',
         timer: 1500
       });
      });
  });
}

// Google Sign-In
const googleLogin = document.getElementById("google-login-btn");
if (googleLogin) {
  googleLogin.addEventListener('click', function() {
    // Show the loading spinner
    showLoading();

    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        console.log(user);

        // Check if the user is verified
        if (user.emailVerified) {
          hideLoading();
          window.location.href = "homepage.html";
        } else {
          hideLoading();
          //alert('Please verify your email before logging in.');
          Swal.fire({
            icon: "info",
            title: "Please verify your email before logging in",
            showConfirmButton: false,
            customClass: 'swal-wide',
            timer: 1500
          });
        }
      })
      .catch((error) => {
        hideLoading();
        console.error('Error during Google sign-in:', error);
       // alert('Failed to sign in with Google. Please try again.');
       Swal.fire({
        icon: "error",
        title: "Please verify your email before logging in",
        showConfirmButton: false,
        customClass: 'swal-wide',
        timer: 1500
      });
      });
  });
}

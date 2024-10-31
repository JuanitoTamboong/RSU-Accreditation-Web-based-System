import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
  authDomain: "student-org-5d42a.firebaseapp.com",
  databaseURL: "https://student-org-5d42a-default-rtdb.firebaseio.com",
  projectId: "student-org-5d42a",
  storageBucket: "student-org-5d42a.appspot.com",
  messagingSenderId: "1073695504078",
  appId: "1:1073695504078:web:d2cd33e1b0fc6c82e0829f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Function to toggle password visibility
function togglePasswordVisibility(inputElement, toggleElement) {
  if (inputElement && toggleElement) {
    const type = inputElement.getAttribute("type") === "password" ? "text" : "password";
    inputElement.setAttribute("type", type);
    toggleElement.classList.toggle('bx-show', type === "text");
    toggleElement.classList.toggle('bx-hide', type === "password");
  } else {
    console.error("Input or toggle element not found.");
  }
}

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Login password toggle
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      togglePasswordVisibility(passwordInput, togglePassword);
    });
  }

  // Sign-up password fields and their toggle buttons
  const signupPasswordInput = document.getElementById("signup-password");
  const toggleSignupPassword = document.getElementById("toggleSignupPassword");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

  if (toggleSignupPassword) {
    toggleSignupPassword.addEventListener("click", function () {
      togglePasswordVisibility(signupPasswordInput, toggleSignupPassword);
    });
  }

  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", function () {
      togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
    });
  }
});

// Function to show loading spinner
function showLoading() {
  document.getElementById("loading").style.display = "flex";
}

// Function to hide loading spinner
function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

// Function to validate form fields for sign-up
function validateSignUpForm(email, password, confirmPassword) {
  let isValid = true;
  const errors = [];

  if (!email || !password || !confirmPassword) {
    errors.push("All fields are required.");
    isValid = false;
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match.");
    isValid = false;
  }

  // Password complexity validation
  const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
  if (!passwordRequirements.test(password)) {
    errors.push("Password must be at least 6 characters long, contain uppercase and lowercase letters, a number, and a special character.");
    isValid = false;
  }

  return { isValid, errors };
}

// Event listener for the "Register" link
const registerLink = document.getElementById("register-link");
if (registerLink) {
  registerLink.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default link behavior

    // Show a confirmation dialog
    Swal.fire({
      title: "Are you a representative of a student organization?",
      text: "You must be a representative to proceed with registration.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, I am",
      cancelButtonText: "No, cancel",
      customClass: "swal-wide",
    }).then((result) => {
      if (result.isConfirmed) {
        // If confirmed, redirect to Sign-Up.html
        window.location.href = "Sign-Up.html";
      } else {
        // If not confirmed, show an alert and stay on the login page
        Swal.fire({
          icon: "info",
          title: "Registration is only for student organization representatives.",
          timer: 2000,
          showConfirmButton: false,
          customClass: "swal-wide",
        });
      }
    });
  });
}

// Sign-Up Functionality
const signUpForm = document.getElementById("signup-form");
if (signUpForm) {
  signUpForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = signUpForm.elements["email"].value;
    const password = signUpForm.elements["password"].value;
    const confirmPassword = signUpForm.elements["confirm-password"].value;

    // Validate form fields
    const { isValid, errors } = validateSignUpForm(email, password, confirmPassword);
    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Invalid password",
        text: errors.join("\n"),
        customClass: "swal-wide",
      });
      return;
    }

    // Show the loading spinner
    showLoading();

    // Create new user
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Send email verification
        sendEmailVerification(user)
          .then(() => {
            hideLoading();
            Swal.fire({
              icon: "success",
              title: "Sign up successful!",
              text: "Please check your email for verification. You won't be able to log in until your email is verified.",
              customClass: "swal-wide",
              confirmButtonText: "Okay",
            });
            // Optionally, clear the form fields after successful sign-up
            signUpForm.reset();
          })
          .catch((error) => {
            hideLoading();
            console.error("Error sending email verification:", error);
            Swal.fire({
              icon: "error",
              title: "Verification Error",
              text: "Failed to send verification email. Please try again.",
              customClass: "swal-wide",
            });
          });
      })
      .catch((error) => {
        hideLoading();
        const errorCode = error.code;
        console.error(`Error ${errorCode}: ${error.message}`);

        if (errorCode === "auth/email-already-in-use") {
          Swal.fire({
            icon: "error",
            title: "Email Already Registered",
            text: "The email address is already registered. Please use a different email.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Sign Up Failed",
            text: "Failed to sign up. Please try again.",
          });
        }
      });
  });
}

// Forgot Password Functionality
const forgotPasswordLink = document.getElementById("forgot-password-link");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", function (event) {
    event.preventDefault();

    Swal.fire({
      title: "Enter your email address",
      input: "email",
      inputLabel: "We will send you a reset link",
      inputPlaceholder: "Enter your email address",
      showCancelButton: true,
      confirmButtonText: "Send",
      customClass: "swal-wide",
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
                icon: "success",
                title: "Password reset link sent!",
                text: "Check your email for the reset link.",
                customClass: "swal-wide",
                timer: 2000,
              });
            })
            .catch((error) => {
              hideLoading();
              console.error("Error sending reset email:", error);
              Swal.fire({
                icon: "error",
                title: "Error!",
                text: "Failed to send reset email. Please try again.",
                customClass: "swal-wide",
                timer: 2000,
              });
            });
        }
      }
    });
  });
}

// Login Functionality
const signInForm = document.getElementById("login-form");
if (signInForm) {
  signInForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = signInForm.elements["email"].value;
    const password = signInForm.elements["password"].value;

    // Show loading spinner
    showLoading();

    // Sign in user
signInWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
  const user = userCredential.user;
  hideLoading();

  Swal.fire({
    title: "Privacy Agreement",
    html: 'Do you agree to the <a href="https://rsu.edu.ph/wp-content/uploads/2024/03/Privacy-Notice-For-website.pdf" target="_blank">Privacy Policy</a> before proceeding?',
    imageUrl: "../assets/privacy_agreement.png",
    imageWidth: 130,
    imageHeight: 100,
    imageAlt: "Privacy Agreement Image",
    showCancelButton: true,
    confirmButtonText: "Yes, I agree",
    cancelButtonText: "No, I disagree",
    customClass: {
      popup: "swal-wide",
      image: "swal-image",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // User agreed to the privacy policy
      window.location.href = "../welcome-page/welcome.html";
    } else {
      // User disagreed with the privacy policy
      Swal.fire({
        icon: "warning",
        title: "Agreement Needed",
        text: "You need to agree to the Privacy Policy to proceed.",
        confirmButtonText: "Ok",
        customClass: {
          popup: "swal-wide",
        },
      });
    }
  });
})
      .catch((error) => {
        hideLoading();
        const errorCode = error.code;
        console.error(`Error ${errorCode}: ${error.message}`);

        if (errorCode === "auth/wrong-password") {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: "Incorrect password. Please try again.",
            customClass: "swal-wide",
          });
        } else if (errorCode === "auth/user-not-found") {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: "No user found with this email. Please register.",
            customClass: "swal-wide",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: "An error occurred. Please try again.",
            customClass: "swal-wide",
          });
        }
      });
  });
}


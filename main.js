// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
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
  appId: "1:1073695504078:web:d2cd33e1b0fc6c82e0829f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

// Utility Functions
const togglePasswordVisibility = (inputElement, toggleElement) => {
  if (!inputElement || !toggleElement) {
    console.error("Input or toggle element not found.");
    return;
  }

  // Toggle password type
  const isPassword = inputElement.type === "password";
  inputElement.type = isPassword ? "text" : "password";

  // Toggle icon classes
  if (isPassword) {
    toggleElement.classList.add("bx-show");
    toggleElement.classList.remove("bx-hide");
  } else {
    toggleElement.classList.add("bx-hide");
    toggleElement.classList.remove("bx-show");
  }
};

const showLoading = () => {
  document.getElementById("loading").style.display = "flex";
};

const hideLoading = () => {
  document.getElementById("loading").style.display = "none";
};

const validateSignUpForm = (email, password, confirmPassword) => {
  const errors = [];
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const passwordRequirements =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]).{6,}$/;

  if (!email || !password || !confirmPassword) errors.push("All fields are required.");
  if (!emailPattern.test(email)) errors.push("Please enter a valid email address.");
  if (password !== confirmPassword) errors.push("Passwords do not match.");
  if (!passwordRequirements.test(password))
    errors.push("Password must meet complexity requirements.");

  return { isValid: errors.length === 0, errors };
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const passwordInputs = [
    { input: "password", toggle: "togglePassword" },
    { input: "signup-password", toggle: "toggleSignupPassword" },
    { input: "confirm-password", toggle: "toggleConfirmPassword" },
  ];

  // Add toggle functionality for all password fields
  passwordInputs.forEach(({ input, toggle }) => {
    const inputElement = document.getElementById(input);
    const toggleElement = document.getElementById(toggle);
    if (inputElement && toggleElement) {
      toggleElement.addEventListener("click", () => togglePasswordVisibility(inputElement, toggleElement));
    }
  });

  // Password criteria validation
  const passwordInput = document.getElementById("signup-password");
  const criteriaList = document.getElementById("password-criteria");

  if (passwordInput) {
    passwordInput.addEventListener("focus", () => {
      // Show password criteria with animation
      criteriaList?.classList.remove("hidden");
      criteriaList?.classList.add("visible");
    });

    passwordInput.addEventListener("blur", () => {
      if (!passwordInput.value) {
        // Hide password criteria with animation
        criteriaList?.classList.remove("visible");
        criteriaList?.classList.add("hidden");
      }
    });

    passwordInput.addEventListener("input", () => {
      const validations = {
        length: passwordInput.value.length >= 6,
        uppercase: /[A-Z]/.test(passwordInput.value),
        lowercase: /[a-z]/.test(passwordInput.value),
        number: /[0-9]/.test(passwordInput.value),
        special: /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(passwordInput.value),
      };

      Object.entries(validations).forEach(([key, isValid]) => {
        const criteriaItem = document.getElementById(`criteria-${key}`);
        if (criteriaItem) {
          criteriaItem.classList.toggle("valid", isValid);
          criteriaItem.classList.toggle("invalid", !isValid);
        }
      });
    });
  }
});
  // Register link confirmation
  const registerLink = document.getElementById("register-link");
  if (registerLink) {
    registerLink.addEventListener("click", (event) => {
      event.preventDefault();
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
          window.location.href = "Sign-Up.html";
        } else {
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
    const recaptchaResponse = grecaptcha.getResponse();  

    // Check if hCAPTCHA is verified
    if (recaptchaResponse.length === 0) {
      Swal.fire({
        icon: "error",
        title: "hCAPTCHA verification failed",
        text: "Please verify that you are not a robot.",
        customClass: "swal-wide",
      });
      return; 
    }

    // Show loading spinner
    showLoading();

    // Sign in user with Firebase Authentication
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
          hideLoading();
          Swal.fire({
            icon: "warning",
            title: "Email not verified",
            text: "Please verify your email before logging in.",
            confirmButtonText: "Resend Verification Email",
            customClass: "swal-wide",
          }).then((result) => {
            if (result.isConfirmed) {
              // Optionally, resend the verification email
              sendEmailVerification(user).then(() => {
                // Success message after resending
                Swal.fire({
                  icon: "success",
                  title: "Verification email sent",
                  text: "Please check your inbox for the verification link.",
                  customClass: "swal-wide",
                });
              }).catch((error) => {
                // Handle error in case the resend fails
                Swal.fire({
                  icon: "error",
                  title: "Error Resending Verification",
                  text: "Failed to send verification email. Please try again.",
                  customClass: "swal-wide",
                });
              });
            }
          });
        } else {
          hideLoading();
          // Proceed with the rest of the login flow
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
              window.location.href = "../welcome-page/welcome.html";
            } else {
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
        }
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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8jNuRrOWVRl028FSShTp81BoWLeGRPW8",
  authDomain: "login-7d79e.firebaseapp.com",
  projectId: "login-7d79e",
  storageBucket: "login-7d79e.appspot.com",
  messagingSenderId: "471939001993",
  appId: "1:471939001993:web:656fd9df2b8ef74fa82058",
  measurementId: "G-62WLH21ZYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Sign-Up Functionality
const signUpForm = document.getElementById('signup-form');
if (signUpForm) {
  signUpForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = signUpForm.elements['email'].value;
    const password = signUpForm.elements['password'].value;
    const confirmPassword = signUpForm.elements['confirm-password'].value;

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Send verification email
        return sendEmailVerification(user)
          .then(() => {
            console.log('Verification email sent.');
            alert('A verification email has been sent to your email address. Please verify your email before logging in.');
            window.location.href = "index.html"; // Redirect to login page
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        if (errorCode === 'auth/email-already-in-use') {
          alert('This email is already in use. Please try another email.');
        } else {
          console.error(`Error ${errorCode}: ${errorMessage}`);
          alert('Sign-up failed. Please try again.');
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

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Check if the user's email is verified
        if (user.emailVerified) {
          console.log('User signed in:', user);
          window.location.href = "homepage.html";
        } else {
          alert('Please verify your email before logging in. A verification email has been sent to your email address.');
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error ${errorCode}: ${errorMessage}`);
        alert('Invalid email or password. Please try again.');
      });
  });
}

// Google Sign-In
const googleLogin = document.getElementById("google-login-btn");
if (googleLogin) {
  googleLogin.addEventListener('click', function() {
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        console.log(user);

        // Check if the user is verified
        if (user.emailVerified) {
          window.location.href = "homepage.html";
        } else {
          alert('Please verify your email before logging in.');
        }
      })
      .catch((error) => {
        console.error('Error during Google sign-in:', error);
        alert('Failed to sign in with Google. Please try again.');
      });
  });
}

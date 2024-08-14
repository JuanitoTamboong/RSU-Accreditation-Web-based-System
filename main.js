import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();

// Email and Password Sign In
const signInForm = document.querySelector('form');
signInForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const email = signInForm.elements['email'].value;
  const password = signInForm.elements['password'].value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log('User signed in:', user);
      window.location.href = "homepage.html"; // Redirect to homepage on success
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Error ${errorCode}: ${errorMessage}`);
      alert('Invalid email or password. Please try again.');
    });
});

// Google Sign In
const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener('click', function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      console.log(user);
      window.location.href = "homepage.html"; // Redirect to homepage on success
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Error ${errorCode}: ${errorMessage}`);
      alert('Google sign-in failed. Please try again.');
    });
});

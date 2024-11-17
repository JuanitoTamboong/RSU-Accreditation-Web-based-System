const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { signInWithEmailAndPassword, getAuth } = require('firebase/auth');
const { initializeApp } = require('firebase/app');
const app = express();

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

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Secret key from Google reCAPTCHA
const SECRET_KEY = '6Ldp5oAqAAAAALUyy0et2FuuQgbXvTmxcZ5TRQre';

app.use(bodyParser.json());

app.post('/validate-recaptcha', async (req, res) => {
  const { recaptchaResponse, email, password } = req.body;

  // Verify the reCAPTCHA response
  const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${recaptchaResponse}`;

  try {
    const response = await axios.post(googleVerifyUrl);

    if (response.data.success) {
      // reCAPTCHA verified, proceed with Firebase sign-in
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          if (!user.emailVerified) {
            res.json({ success: false, message: 'Please verify your email before logging in.' });
          } else {
            res.json({ success: true, message: 'Login successful!' });
          }
        })
        .catch((error) => {
          console.error('Firebase Auth Error:', error.message);
          res.status(500).json({ success: false, message: 'Login failed. Invalid credentials or other error.' });
        });
    } else {
      res.json({ success: false, message: 'reCAPTCHA verification failed' });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    res.status(500).json({ success: false, message: 'Server error while verifying reCAPTCHA' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

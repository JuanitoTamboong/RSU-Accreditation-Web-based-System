require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let otpStorage = {};  // Temporary storage for OTPs

// Function to generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to send OTP to user's email
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  otpStorage[email] = { otp, expires: Date.now() + 600000 };  // OTP expires in 10 minutes

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending OTP');
    } else {
      console.log('Email sent:', info.response);
      res.status(200).send('OTP sent successfully');
    }
  });
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (otpStorage[email] && otpStorage[email].otp === otp && otpStorage[email].expires > Date.now()) {
    delete otpStorage[email];  // OTP verified, so delete it
    res.status(200).send('OTP verified successfully');
  } else {
    res.status(400).send('Invalid or expired OTP');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

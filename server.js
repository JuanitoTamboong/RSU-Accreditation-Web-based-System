const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Configure Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'animeforeverrr04@gmail.com',  // Replace with your email
    pass: 'animeislife'    // Replace with your email password or app password
  }
});

// Endpoint to generate and send OTP
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP

  const mailOptions = {
    from: 'animeforeverrr04@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
      return res.status(500).send('Error sending OTP.');
    }
    console.log('Email sent:', info.response);
    // Store OTP for later verification (e.g., in memory, database)
    res.status(200).send({ otp });  // In a real app, you should not send OTP back to the client
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
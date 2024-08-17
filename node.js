// Send OTP
document.getElementById('send-otp-btn').addEventListener('click', function() {
    const email = document.getElementById('email').value;
    fetch('http://localhost:3000/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    .then(response => response.text())
    .then(result => {
      alert(result);  // Show result (e.g., OTP sent)
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });
  
  // Verify OTP
  document.getElementById('verify-otp-btn').addEventListener('click', function() {
    const email = document.getElementById('email').value;
    const otp = document.getElementById('otp').value;
    fetch('http://localhost:3000/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
    .then(response => response.text())
    .then(result => {
      alert(result);  // Show result (e.g., OTP verified or invalid)
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });
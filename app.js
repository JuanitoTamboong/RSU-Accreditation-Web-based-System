const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'node_login_signup',
  password: 'your_password',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Sign-up route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const password_hash = bcrypt.hashSync(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, password_hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (bcrypt.compareSync(password, user.password_hash)) {
      // Handle successful login (e.g., create session)
      res.status(200).json({ message: 'Logged in', user });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});


document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
  
    try {
      const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const user = await response.json();
        console.log('Signed up:', user);
        // Clear form or show success message
      } else {
        const error = await response.json();
        console.error('Sign-up error:', error.error);
        // Show error message
      }
    } catch (err) {
      console.error('Network error:', err);
      // Show network error message
    }
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
  
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const user = await response.json();
        console.log('Logged in:', user);
        // Handle successful login (e.g., redirect to another page)
      } else {
        const error = await response.json();
        console.error('Login error:', error.error);
        // Show error message
      }
    } catch (err) {
      console.error('Network error:', err);
      // Show network error message
    }
  });
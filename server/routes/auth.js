const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// 1. POST /signup - Register a new user
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation checks
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save new user in the database
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), sanitizedEmail, passwordHash]
    );

    // Create a JWT session token
    const token = jwt.sign(
      { id: result.id, name: name.trim(), email: sanitizedEmail },
      JWT_SECRET,
      { expiresIn: '7d' } // Session valid for 7 days
    );

    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: result.id,
        name: name.trim(),
        email: sanitizedEmail
      }
    });
  } catch (error) {
    console.error('Signup Route Error:', error);
    res.status(500).json({ error: 'Server error during signup registration.' });
  }
});

// 2. POST /login - Log in an existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const sanitizedEmail = email.toLowerCase().trim();

    // Look up the user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [sanitizedEmail]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Create a JWT session token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Route Error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// 3. GET /me - Retrieve current logged in user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get Me Route Error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile details.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../server');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check auth status
router.get('/check', async (req, res) => {
  res.json({ authenticated: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get setting
router.get('/:key', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [req.params.key]);
    
    if (rows.length === 0) {
      return res.json({ value: null });
    }
    
    res.json({ value: rows[0].setting_value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save setting
router.post('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    
    const query = `
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE setting_value = ?
    `;
    
    await pool.query(query, [req.params.key, value, value]);
    res.json({ message: 'Setting saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

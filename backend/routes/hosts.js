const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get all host URLs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM host_urls ORDER BY created_at DESC');
    res.json(rows.map(row => ({
      id: row.id,
      url: row.url,
      name: row.name,
      isActive: row.is_active
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create host URL
router.post('/', async (req, res) => {
  try {
    const { id, url, name, isActive } = req.body;
    
    const query = 'INSERT INTO host_urls (id, url, name, is_active) VALUES (?, ?, ?, ?)';
    await pool.query(query, [id, url, name, isActive]);
    
    res.status(201).json({ message: 'Host URL created successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update host URL
router.put('/:id', async (req, res) => {
  try {
    const { url, name, isActive } = req.body;
    
    const query = 'UPDATE host_urls SET url = ?, name = ?, is_active = ? WHERE id = ?';
    const [result] = await pool.query(query, [url, name, isActive, req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Host URL not found' });
    }
    
    res.json({ message: 'Host URL updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete host URL
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM host_urls WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Host URL not found' });
    }
    
    res.json({ message: 'Host URL deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

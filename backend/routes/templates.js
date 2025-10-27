const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM whatsapp_templates');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { message } = req.body;
    
    const query = 'UPDATE whatsapp_templates SET message = ? WHERE id = ?';
    const [result] = await pool.query(query, [message, req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

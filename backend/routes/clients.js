const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get all clients
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client
router.post('/', async (req, res) => {
  try {
    const { id, fullName, username, password, hostUrl, packageDuration, createdAt, expiryDate, status, whatsappNumber } = req.body;
    
    const query = `
      INSERT INTO clients (id, full_name, username, password, host_url, package_duration, created_at, expiry_date, status, whatsapp_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.query(query, [id, fullName, username, password, hostUrl, packageDuration, createdAt, expiryDate, status, whatsappNumber]);
    res.status(201).json({ message: 'Client created successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { fullName, username, password, hostUrl, packageDuration, expiryDate, status, whatsappNumber } = req.body;
    
    const query = `
      UPDATE clients 
      SET full_name = ?, username = ?, password = ?, host_url = ?, package_duration = ?, 
          expiry_date = ?, status = ?, whatsapp_number = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.query(query, [fullName, username, password, hostUrl, packageDuration, expiryDate, status, whatsappNumber, req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

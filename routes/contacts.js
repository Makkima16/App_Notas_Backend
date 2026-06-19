const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY name ASC', [req.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'El nombre es requerido' });
  try {
    const [result] = await db.query(
      'INSERT INTO contacts (name, email, phone, user_id) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, req.userId]
    );
    res.status(201).json({ id: result.insertId, name, email, phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE contacts SET name=?, email=?, phone=? WHERE id=? AND user_id=?',
      [name, email || null, phone || null, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contacto no encontrado' });
    res.json({ message: 'Contacto actualizado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contacto no encontrado' });
    res.json({ message: 'Contacto eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
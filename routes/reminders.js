const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY reminder_date ASC', [req.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Recordatorio no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { title, description, reminder_date, is_active, category_id, contact_id } = req.body;
  if (!title || !reminder_date)
    return res.status(400).json({ message: 'Título y fecha son requeridos' });
  try {
    const [result] = await db.query(
      'INSERT INTO reminders (title, description, reminder_date, is_active, category_id, contact_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', reminder_date, is_active !== undefined ? is_active : 1, category_id || null, contact_id || null, req.userId]
    );
    res.status(201).json({ id: result.insertId, title, description, reminder_date, is_active, category_id, contact_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { title, description, reminder_date, is_active, category_id, contact_id } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE reminders SET title=?, description=?, reminder_date=?, is_active=?, category_id=?, contact_id=? WHERE id=? AND user_id=?',
      [title, description, reminder_date, is_active, category_id || null, contact_id || null, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Recordatorio no encontrado' });
    res.json({ message: 'Recordatorio actualizado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Recordatorio no encontrado' });
    res.json({ message: 'Recordatorio eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
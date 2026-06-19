const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Nota no encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { title, content, category_id } = req.body;
  if (!title) return res.status(400).json({ message: 'El título es requerido' });
  try {
    const [result] = await db.query(
      'INSERT INTO notes (title, content, category_id, user_id) VALUES (?, ?, ?, ?)',
      [title, content || '', category_id || null, req.userId]
    );
    res.status(201).json({ id: result.insertId, title, content, category_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { title, content, category_id } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE notes SET title=?, content=?, category_id=? WHERE id=? AND user_id=?',
      [title, content, category_id || null, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Nota no encontrada' });
    res.json({ message: 'Nota actualizada correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Nota no encontrada' });
    res.json({ message: 'Nota eliminada correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC', [req.userId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ message: 'El nombre es requerido' });
  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)',
      [name, color || '#4f46e5', req.userId]
    );
    res.status(201).json({ id: result.insertId, name, color: color || '#4f46e5' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const { name, color } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?',
      [name, color, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
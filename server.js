// server.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const db = require('./db'); // pool de MySQL (mysql2/promise)

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
const verifyToken = require('./middleware/auth');

// Rutas

app.use('/api/auth', require('./routes/auth')); // pública, sin middleware
app.use('/api/tasks',      verifyToken, require('./routes/tasks'));
app.use('/api/notes',      verifyToken, require('./routes/notes'));
app.use('/api/reminders',  verifyToken, require('./routes/reminders'));
app.use('/api/categories', verifyToken, require('./routes/categories'));
app.use('/api/contacts', verifyToken, require('./routes/contacts'));

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor en http://localhost:${PORT}`);

  // Prueba de conexión a MySQL
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS resultado');
    console.log('✅ Conexión a MySQL exitosa. Resultado prueba:', rows[0].resultado);
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  }
});

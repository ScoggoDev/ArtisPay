const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const emprendimientoRoutes = require('./routes/emprendimientos');
const productoRoutes = require('./routes/productos');
const categoriaRoutes = require('./routes/categorias');
const favoritoRoutes = require('./routes/favoritos');
const reporteRoutes = require('./routes/reportes');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/emprendimientos', emprendimientoRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ARTISPAY API running on port ${PORT}`);
});

module.exports = app;

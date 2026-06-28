const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { usuarios } = require('../data/store');

router.get('/me', authenticateToken, (req, res) => {
  const usuario = usuarios.find(u => u.id_usuario === req.usuario.id_usuario);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { contraseña_hash, ...safe } = usuario;
  res.json(safe);
});

router.put('/me', authenticateToken, (req, res) => {
  const usuario = usuarios.find(u => u.id_usuario === req.usuario.id_usuario);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { nombre_usuario } = req.body;
  if (nombre_usuario) usuario.nombre_usuario = nombre_usuario;

  const { contraseña_hash, ...safe } = usuario;
  res.json(safe);
});

router.put('/me/desactivar', authenticateToken, (req, res) => {
  const usuario = usuarios.find(u => u.id_usuario === req.usuario.id_usuario);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  usuario.activo = false;
  res.json({ message: 'Cuenta desactivada exitosamente' });
});

module.exports = router;

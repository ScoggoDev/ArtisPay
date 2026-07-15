const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/me', authenticateToken, async (req, res) => {
  const { recordset } = await query(
    'SELECT id_usuario, nombre_usuario, email, tipo, activo, fecha_registro FROM dbo.usuarios WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  if (!recordset[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(recordset[0]);
});

router.put('/me', authenticateToken, async (req, res) => {
  const { nombre_usuario } = req.body;
  if (nombre_usuario) {
    await query(
      'UPDATE dbo.usuarios SET nombre_usuario = @nombre_usuario WHERE id_usuario = @id_usuario',
      { nombre_usuario, id_usuario: req.usuario.id_usuario }
    );
  }

  const { recordset } = await query(
    'SELECT id_usuario, nombre_usuario, email, tipo, activo, fecha_registro FROM dbo.usuarios WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  if (!recordset[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(recordset[0]);
});

router.put('/me/desactivar', authenticateToken, async (req, res) => {
  const { rowsAffected } = await query(
    'UPDATE dbo.usuarios SET activo = 0 WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Cuenta desactivada exitosamente' });
});

module.exports = router;

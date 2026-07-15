const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/stats', authenticateToken, requireRole('admin', 'moderador'), async (req, res) => {
  const { recordset } = await query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.usuarios WHERE activo = 1) AS total_usuarios,
      (SELECT COUNT(*) FROM dbo.emprendimientos WHERE activo = 1) AS total_emprendimientos,
      (SELECT COUNT(*) FROM dbo.productos WHERE activo = 1) AS total_productos,
      (SELECT COUNT(*) FROM dbo.reportes WHERE estado = 'pendiente') AS reportes_pendientes
  `);
  res.json(recordset[0]);
});

router.get('/usuarios', authenticateToken, requireRole('admin'), async (req, res) => {
  const { recordset } = await query(
    'SELECT id_usuario, nombre_usuario, email, tipo, activo, fecha_registro FROM dbo.usuarios'
  );
  res.json(recordset);
});

router.put('/usuarios/:id/bloquear', authenticateToken, requireRole('admin'), async (req, res) => {
  const id_usuario = parseInt(req.params.id);
  const { recordset } = await query('SELECT * FROM dbo.usuarios WHERE id_usuario = @id_usuario', { id_usuario });
  const usuario = recordset[0];
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (usuario.tipo === 'admin') return res.status(403).json({ error: 'No se puede bloquear a un administrador' });

  await query('UPDATE dbo.usuarios SET activo = 0 WHERE id_usuario = @id_usuario', { id_usuario });
  res.json({ message: 'Usuario bloqueado exitosamente' });
});

router.put('/usuarios/:id/desbloquear', authenticateToken, requireRole('admin'), async (req, res) => {
  const id_usuario = parseInt(req.params.id);
  const { rowsAffected } = await query('UPDATE dbo.usuarios SET activo = 1 WHERE id_usuario = @id_usuario', { id_usuario });
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Usuario desbloqueado exitosamente' });
});

router.get('/reportes', authenticateToken, requireRole('admin', 'moderador'), async (req, res) => {
  const { recordset } = await query(`
    SELECT r.*, p.nombre AS producto_nombre, u.nombre_usuario AS reportado_por
    FROM dbo.reportes r
    LEFT JOIN dbo.productos p ON p.id_producto = r.id_producto
    LEFT JOIN dbo.usuarios u ON u.id_usuario = r.id_usuario
  `);
  res.json(recordset);
});

router.put('/reportes/:id', authenticateToken, requireRole('admin', 'moderador'), async (req, res) => {
  const { estado } = req.body;
  if (!['resuelto', 'descartado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado debe ser "resuelto" o "descartado"' });
  }

  const { recordset } = await query(
    'UPDATE dbo.reportes SET estado = @estado OUTPUT INSERTED.* WHERE id_reporte = @id_reporte',
    { estado, id_reporte: parseInt(req.params.id) }
  );
  if (!recordset[0]) return res.status(404).json({ error: 'Reporte no encontrado' });
  res.json(recordset[0]);
});

router.put('/productos/:id/ocultar', authenticateToken, requireRole('admin', 'moderador'), async (req, res) => {
  const { rowsAffected } = await query(
    'UPDATE dbo.productos SET activo = 0 WHERE id_producto = @id_producto',
    { id_producto: parseInt(req.params.id) }
  );
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ message: 'Producto ocultado exitosamente' });
});

module.exports = router;

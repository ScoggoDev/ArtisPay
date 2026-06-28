const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { usuarios, emprendimientos, productos, reportes } = require('../data/store');

router.get('/stats', authenticateToken, requireRole('admin', 'moderador'), (req, res) => {
  res.json({
    total_usuarios: usuarios.filter(u => u.activo).length,
    total_emprendimientos: emprendimientos.filter(e => e.activo).length,
    total_productos: productos.filter(p => p.activo).length,
    reportes_pendientes: reportes.filter(r => r.estado === 'pendiente').length,
  });
});

router.get('/usuarios', authenticateToken, requireRole('admin'), (req, res) => {
  const result = usuarios.map(({ contraseña_hash, ...u }) => u);
  res.json(result);
});

router.put('/usuarios/:id/bloquear', authenticateToken, requireRole('admin'), (req, res) => {
  const usuario = usuarios.find(u => u.id_usuario === parseInt(req.params.id));
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (usuario.tipo === 'admin') return res.status(403).json({ error: 'No se puede bloquear a un administrador' });

  usuario.activo = false;
  res.json({ message: 'Usuario bloqueado exitosamente' });
});

router.put('/usuarios/:id/desbloquear', authenticateToken, requireRole('admin'), (req, res) => {
  const usuario = usuarios.find(u => u.id_usuario === parseInt(req.params.id));
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  usuario.activo = true;
  res.json({ message: 'Usuario desbloqueado exitosamente' });
});

router.get('/reportes', authenticateToken, requireRole('admin', 'moderador'), (req, res) => {
  const enriched = reportes.map(r => {
    const producto = productos.find(p => p.id_producto === r.id_producto);
    const reporter = usuarios.find(u => u.id_usuario === r.id_usuario);
    return {
      ...r,
      producto_nombre: producto?.nombre || '',
      reportado_por: reporter?.nombre_usuario || '',
    };
  });
  res.json(enriched);
});

router.put('/reportes/:id', authenticateToken, requireRole('admin', 'moderador'), (req, res) => {
  const reporte = reportes.find(r => r.id_reporte === parseInt(req.params.id));
  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

  const { estado } = req.body;
  if (!['resuelto', 'descartado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado debe ser "resuelto" o "descartado"' });
  }

  reporte.estado = estado;
  res.json(reporte);
});

router.put('/productos/:id/ocultar', authenticateToken, requireRole('admin', 'moderador'), (req, res) => {
  const producto = productos.find(p => p.id_producto === parseInt(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  producto.activo = false;
  res.json({ message: 'Producto ocultado exitosamente' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { reportes, productos, getNextId } = require('../data/store');

router.post('/', authenticateToken, (req, res) => {
  const { id_producto, motivo } = req.body;

  if (!id_producto || !motivo) {
    return res.status(400).json({ error: 'id_producto y motivo son obligatorios' });
  }

  const producto = productos.find(p => p.id_producto === parseInt(id_producto));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const reporte = {
    id_reporte: getNextId('reporte'),
    id_usuario: req.usuario.id_usuario,
    id_producto: parseInt(id_producto),
    motivo,
    estado: 'pendiente',
    fecha: new Date().toISOString(),
  };
  reportes.push(reporte);
  res.status(201).json(reporte);
});

module.exports = router;

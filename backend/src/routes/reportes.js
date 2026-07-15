const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/pool');

router.post('/', authenticateToken, async (req, res) => {
  const { id_producto, motivo } = req.body;

  if (!id_producto || !motivo) {
    return res.status(400).json({ error: 'id_producto y motivo son obligatorios' });
  }

  const { recordset: prodRecord } = await query(
    'SELECT * FROM dbo.productos WHERE id_producto = @id_producto',
    { id_producto: parseInt(id_producto) }
  );
  if (!prodRecord[0]) return res.status(404).json({ error: 'Producto no encontrado' });

  const { recordset } = await query(`
    INSERT INTO dbo.reportes (id_usuario, id_producto, motivo, estado)
    OUTPUT INSERTED.*
    VALUES (@id_usuario, @id_producto, @motivo, 'pendiente')
  `, {
    id_usuario: req.usuario.id_usuario,
    id_producto: parseInt(id_producto),
    motivo,
  });

  res.status(201).json(recordset[0]);
});

module.exports = router;

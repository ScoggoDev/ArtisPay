const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/pool');

router.post('/', authenticateToken, async (req, res) => {
  const { id_reportante, id_reportado, id_producto , motivo, comentarios } = req.body;

  if (!id_reportado || !motivo) {
    return res.status(400).json({ error: 'id_reportado y motivo son obligatorios' });
  }

  const { recordset: userRecord } = await query(
    'SELECT * FROM dbo.usuarios WHERE id_usuario = @id_reportado',
    { id_reportado: parseInt(id_reportado) }
  );
  if (!userRecord[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { recordset } = await query(`
    INSERT INTO dbo.reportes (id_reportante, id_reportado, id_producto, motivo, comentarios, estado)
    OUTPUT INSERTED.*
    VALUES (@id_reportante, @id_reportado, @id_producto, @motivo, @comentarios, 'pendiente')
  `, {
    id_reportante: parseInt(id_reportante),
    id_reportado: parseInt(id_reportado),
    id_producto: parseInt(id_producto) || null,
    motivo,
    comentarios: comentarios || null,
  });

  res.status(201).json(recordset[0]);
});

router.get('/', authenticateToken, async (req, res) => {
  console.log('SQL Ejecutado:', sqlText);
  const { recordset } = await query(`
    SELECT 
      r.id_reporte,
      r.motivo,
      r.fecha,
      r.estado,
      r.id_reportante,
      r.id_reportado,
      u1.email AS reportante, 
      u2.nombre_usuario AS reportado 
    FROM dbo.usuarios u1 
    LEFT JOIN dbo.reportes r ON u1.id_usuario = r.id_reportante
    LEFT JOIN dbo.usuarios u2 ON u2.id_usuario = r.id_reportado
    WHERE r.id_reporte > 0;
  `);
  res.json(recordset);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', async (req, res) => {
  const { id_emprendimiento } = req.query;

  const conditions = ['s.activo = 1'];
  const params = {};
  if (id_emprendimiento) {
    conditions.push('s.id_emprendimiento = @id_emprendimiento');
    params.id_emprendimiento = parseInt(id_emprendimiento);
  }

  const { recordset } = await query(`
    SELECT s.*, e.nombre AS emprendimiento_nombre
    FROM dbo.servicios s
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = s.id_emprendimiento
    WHERE ${conditions.join(' AND ')}
  `, params);

  res.json(recordset);
});

router.post('/', authenticateToken, requireRole('emprendedor'), async (req, res) => {
  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const { nombre, descripcion, precio } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const { recordset } = await query(`
    INSERT INTO dbo.servicios (id_emprendimiento, nombre, descripcion, precio, activo)
    OUTPUT INSERTED.*
    VALUES (@id_emprendimiento, @nombre, @descripcion, @precio, 1)
  `, {
    id_emprendimiento: emp.id_emprendimiento,
    nombre,
    descripcion: descripcion || '',
    precio: precio ? parseFloat(precio) : null,
  });

  res.status(201).json(recordset[0]);
});

router.delete('/:id', authenticateToken, requireRole('emprendedor'), async (req, res) => {
  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const { rowsAffected } = await query(
    'UPDATE dbo.servicios SET activo = 0 WHERE id_servicio = @id_servicio AND id_emprendimiento = @id_emprendimiento',
    { id_servicio: parseInt(req.params.id), id_emprendimiento: emp.id_emprendimiento }
  );
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Servicio no encontrado' });

  res.json({ message: 'Servicio eliminado' });
});

module.exports = router;

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
    params.id_emprendimiento = parseInt(id_emprendimiento, 10);
  }

  const sql = `
    SELECT s.*, e.nombre AS emprendimiento_nombre
    FROM dbo.servicios s
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = s.id_emprendimiento
    WHERE ${conditions.join(' AND ')}
  `;
  const { recordset: servicios } = await query(sql, params);

  if (!servicios.length) {
    return res.json([]);
  }

  const servicioIds = servicios.map(s => s.id_servicio);

  const { recordset: imagenes } = await query(`
    SELECT * FROM dbo.imagenes_servicio 
    WHERE id_servicio IN (${servicioIds.join(',')})
  `);

  const enriched = servicios.map(s => ({
    ...s,
    imagenes: imagenes.filter(i => i.id_servicio === s.id_servicio),
  }));

  res.json(enriched);
});

router.get('/:id', async (req, res) => {
  const id_servicio = parseInt(req.params.id);

  const { recordset } = await query(`
    SELECT s.*, e.nombre AS emprendimiento_nombre
    FROM dbo.servicios s
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = s.id_emprendimiento
    WHERE s.id_servicio = @id_servicio AND s.activo = 1
  `, { id_servicio });

  const servicio = recordset[0];
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_emprendimiento = @id_emprendimiento',
    { id_emprendimiento: servicio.id_emprendimiento }
  );

  const { recordset: imagenes } = await query(
    'SELECT * FROM dbo.imagenes_servicio WHERE id_servicio = @id_servicio',
    { id_servicio }
  );
  servicio.imagenes = imagenes;
  res.json({
    ...servicio,
    emprendimiento: empRecord[0] || null,
    imagenes,
  });
});

router.post('/', authenticateToken, requireRole('emprendedor'), async (req, res) => {
  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const { nombre, descripcion, categoria, precio, imagenes } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const { recordset } = await query(`
    INSERT INTO dbo.servicios (id_emprendimiento, nombre, descripcion, categoria, precio, activo)
    OUTPUT INSERTED.*
    VALUES (@id_emprendimiento, @nombre, @descripcion, @categoria, @precio, 1)
  `, {
    id_emprendimiento: emp.id_emprendimiento,
    nombre,
    descripcion: descripcion || '',
    categoria: categoria || null,
    precio: precio ? parseFloat(precio) : null,
  });

  const servicio = recordset[0];

  if (imagenes && Array.isArray(imagenes)) {
    for (let index = 0; index < imagenes.length; index++) {
      await query(
        'INSERT INTO dbo.imagenes_servicio (id_servicio, url, orden) VALUES (@id_servicio, @url, @orden)',
        { id_servicio: servicio.id_servicio, url: imagenes[index], orden: index }
      );
    }
  }

  const { recordset: imgs } = await query(
    'SELECT * FROM dbo.imagenes_servicio WHERE id_servicio = @id_servicio',
    { id_servicio: servicio.id_servicio }
  );
  res.status(201).json({ ...servicio, imagenes: imgs });
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

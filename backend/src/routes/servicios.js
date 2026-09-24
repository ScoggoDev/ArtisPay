const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', async (req, res) => {
  const { categoria, precio_min, precio_max, busqueda, destacado } = req.query;

  const conditions = ['s.activo = 1'];
  const params = {};

  if (categoria) {
    conditions.push('s.id_categoria = @categoria');
    params.categoria = parseInt(categoria);
  }
  if (precio_min) {
    conditions.push('s.precio >= @precio_min');
    params.precio_min = parseFloat(precio_min);
  }
  if (precio_max) {
    conditions.push('s.precio <= @precio_max');
    params.precio_max = parseFloat(precio_max);
  }
  if (busqueda) {
    conditions.push('(LOWER(s.nombre) LIKE @busqueda OR LOWER(s.descripcion) LIKE @busqueda)');
    params.busqueda = `%${busqueda.toLowerCase()}%`;
  }
  if (destacado === 'true') {
    conditions.push('p.destacado = 1');
  }

  const { recordset: servicios } = await query(`
    SELECT s.*, e.nombre AS emprendimiento_nombre, c.nombre AS categoria_nombre
    FROM dbo.servicios s
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = s.id_emprendimiento
    LEFT JOIN dbo.categorias c ON c.id_categoria = s.id_categoria
    WHERE ${conditions.join(' AND ')}
  `, params);

  const { recordset: imagenes } = await query('SELECT * FROM dbo.imagenes_servicio');
  const enriched = servicios.map(s => ({
    ...s,
    imagenes: imagenes.filter(i => i.id_servicio === s.id_servicio),
  }));

  res.json(enriched);
});

router.get('/:id', async (req, res) => {
  const id_servicio = parseInt(req.params.id);

  const { recordset } = await query(`
    SELECT s.*, e.nombre AS emprendimiento_nombre, c.nombre AS categoria_nombre
    FROM dbo.servicios s
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = s.id_emprendimiento
    LEFT JOIN dbo.categorias c ON c.id_categoria = s.id_categoria
    WHERE s.id_servicio = @id_servicio AND s.activo = 1
  `, { id_servicio });

  const servicio = recordset[0];
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_emprendimiento = @id_emprendimiento',
    { id_emprendimiento: servicio.id_emprendimiento }
  );

  const { recordset: catRecord } = await query(
    'SELECT * FROM dbo.categorias WHERE id_categoria = @id_categoria',
    { id_categoria: servicio.id_categoria }
  );

  const { recordset: imagenes } = await query(
    'SELECT * FROM dbo.imagenes_servicio WHERE id_servicio = @id_servicio',
    { id_servicio }
  );
  servicio.imagenes = imagenes;
  res.json({
    ...servicio,
    emprendimiento: empRecord[0] || null,
    categoria: catRecord[0] || null,
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

  const { nombre, descripcion, id_categoria, precio, imagenes } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const { recordset } = await query(`
    INSERT INTO dbo.servicios (id_emprendimiento, nombre, descripcion, precio, activo, id_categoria)
    OUTPUT INSERTED.*
    VALUES (@id_emprendimiento, @nombre, @descripcion, @precio, 1, @id_categoria)
  `, {
    id_emprendimiento: emp.id_emprendimiento,
    nombre,
    descripcion: descripcion || '',
    precio: precio ? parseFloat(precio) : null,
    id_categoria: id_categoria || null,
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

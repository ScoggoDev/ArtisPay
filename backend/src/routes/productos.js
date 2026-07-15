const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', async (req, res) => {
  const { categoria, precio_min, precio_max, busqueda, destacado } = req.query;

  const conditions = ['p.activo = 1'];
  const params = {};

  if (categoria) {
    conditions.push('p.id_categoria = @categoria');
    params.categoria = parseInt(categoria);
  }
  if (precio_min) {
    conditions.push('p.precio >= @precio_min');
    params.precio_min = parseFloat(precio_min);
  }
  if (precio_max) {
    conditions.push('p.precio <= @precio_max');
    params.precio_max = parseFloat(precio_max);
  }
  if (busqueda) {
    conditions.push('(LOWER(p.nombre) LIKE @busqueda OR LOWER(p.descripcion) LIKE @busqueda)');
    params.busqueda = `%${busqueda.toLowerCase()}%`;
  }
  if (destacado === 'true') {
    conditions.push('p.destacado = 1');
  }

  const { recordset: productos } = await query(`
    SELECT p.*, e.nombre AS emprendimiento_nombre, c.nombre AS categoria_nombre
    FROM dbo.productos p
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = p.id_emprendimiento
    LEFT JOIN dbo.categorias c ON c.id_categoria = p.id_categoria
    WHERE ${conditions.join(' AND ')}
  `, params);

  const { recordset: imagenes } = await query('SELECT * FROM dbo.imagenes_producto');
  const enriched = productos.map(p => ({
    ...p,
    imagenes: imagenes.filter(i => i.id_producto === p.id_producto),
  }));

  res.json(enriched);
});

router.get('/:id', async (req, res) => {
  const id_producto = parseInt(req.params.id);

  const { recordset } = await query(`
    SELECT p.*, e.nombre AS emprendimiento_nombre, c.nombre AS categoria_nombre
    FROM dbo.productos p
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = p.id_emprendimiento
    LEFT JOIN dbo.categorias c ON c.id_categoria = p.id_categoria
    WHERE p.id_producto = @id_producto AND p.activo = 1
  `, { id_producto });
  const producto = recordset[0];
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_emprendimiento = @id_emprendimiento',
    { id_emprendimiento: producto.id_emprendimiento }
  );
  const { recordset: imagenes } = await query(
    'SELECT * FROM dbo.imagenes_producto WHERE id_producto = @id_producto',
    { id_producto }
  );

  res.json({
    ...producto,
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

  const { nombre, descripcion, precio, id_categoria, imagenes } = req.body;

  if (!nombre || precio === undefined || !id_categoria) {
    return res.status(400).json({ error: 'Campos obligatorios: nombre, precio, id_categoria' });
  }

  const { recordset } = await query(`
    INSERT INTO dbo.productos (id_emprendimiento, id_categoria, nombre, descripcion, precio, destacado, activo)
    OUTPUT INSERTED.*
    VALUES (@id_emprendimiento, @id_categoria, @nombre, @descripcion, @precio, 0, 1)
  `, {
    id_emprendimiento: emp.id_emprendimiento,
    id_categoria: parseInt(id_categoria),
    nombre,
    descripcion: descripcion || '',
    precio: parseFloat(precio),
  });
  const producto = recordset[0];

  if (imagenes && Array.isArray(imagenes)) {
    for (let index = 0; index < imagenes.length; index++) {
      await query(
        'INSERT INTO dbo.imagenes_producto (id_producto, url, orden) VALUES (@id_producto, @url, @orden)',
        { id_producto: producto.id_producto, url: imagenes[index], orden: index }
      );
    }
  }

  const { recordset: imgs } = await query(
    'SELECT * FROM dbo.imagenes_producto WHERE id_producto = @id_producto',
    { id_producto: producto.id_producto }
  );
  res.status(201).json({ ...producto, imagenes: imgs });
});

router.put('/:id', authenticateToken, requireRole('emprendedor'), async (req, res) => {
  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const id_producto = parseInt(req.params.id);
  const { recordset: prodRecord } = await query(
    'SELECT * FROM dbo.productos WHERE id_producto = @id_producto AND id_emprendimiento = @id_emprendimiento',
    { id_producto, id_emprendimiento: emp.id_emprendimiento }
  );
  if (!prodRecord[0]) return res.status(404).json({ error: 'Producto no encontrado' });

  const { nombre, descripcion, precio, id_categoria, destacado } = req.body;

  const { recordset } = await query(`
    UPDATE dbo.productos SET
      nombre = COALESCE(@nombre, nombre),
      descripcion = COALESCE(@descripcion, descripcion),
      precio = COALESCE(@precio, precio),
      id_categoria = COALESCE(@id_categoria, id_categoria),
      destacado = COALESCE(@destacado, destacado)
    OUTPUT INSERTED.*
    WHERE id_producto = @id_producto
  `, {
    nombre: nombre ?? null,
    descripcion: descripcion ?? null,
    precio: precio !== undefined ? parseFloat(precio) : null,
    id_categoria: id_categoria !== undefined ? parseInt(id_categoria) : null,
    destacado: destacado ?? null,
    id_producto,
  });
  const producto = recordset[0];

  const { recordset: imgs } = await query(
    'SELECT * FROM dbo.imagenes_producto WHERE id_producto = @id_producto',
    { id_producto }
  );
  res.json({ ...producto, imagenes: imgs });
});

router.delete('/:id', authenticateToken, requireRole('emprendedor'), async (req, res) => {
  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const id_producto = parseInt(req.params.id);
  const { rowsAffected } = await query(
    'UPDATE dbo.productos SET activo = 0 WHERE id_producto = @id_producto AND id_emprendimiento = @id_emprendimiento',
    { id_producto, id_emprendimiento: emp.id_emprendimiento }
  );
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Producto no encontrado' });

  res.json({ message: 'Producto eliminado exitosamente' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', authenticateToken, async (req, res) => {
  const { recordset: favoritos } = await query(`
    SELECT
      f.id_favorito, f.id_usuario, f.id_producto, f.fecha,
      p.id_emprendimiento, p.id_categoria, p.nombre, p.descripcion,
      p.precio, p.destacado, p.activo, p.fecha_publicacion,
      e.nombre AS emprendimiento_nombre
    FROM dbo.favoritos f
    LEFT JOIN dbo.productos p ON p.id_producto = f.id_producto
    LEFT JOIN dbo.emprendimientos e ON e.id_emprendimiento = p.id_emprendimiento
    WHERE f.id_usuario = @id_usuario
  `, { id_usuario: req.usuario.id_usuario });

  const { recordset: imagenes } = await query('SELECT * FROM dbo.imagenes_producto');

  const result = favoritos.map(row => ({
    id_favorito: row.id_favorito,
    id_usuario: row.id_usuario,
    id_producto: row.id_producto,
    fecha: row.fecha,
    producto: row.nombre ? {
      id_producto: row.id_producto,
      id_emprendimiento: row.id_emprendimiento,
      id_categoria: row.id_categoria,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: row.precio,
      destacado: row.destacado,
      activo: row.activo,
      fecha_publicacion: row.fecha_publicacion,
      emprendimiento_nombre: row.emprendimiento_nombre || '',
      imagenes: imagenes.filter(i => i.id_producto === row.id_producto),
    } : null,
  }));

  res.json(result);
});

router.post('/:id_producto', authenticateToken, async (req, res) => {
  const id_producto = parseInt(req.params.id_producto);

  const { recordset: prodRecord } = await query(
    'SELECT * FROM dbo.productos WHERE id_producto = @id_producto AND activo = 1',
    { id_producto }
  );
  if (!prodRecord[0]) return res.status(404).json({ error: 'Producto no encontrado' });

  const { recordset: existing } = await query(
    'SELECT * FROM dbo.favoritos WHERE id_usuario = @id_usuario AND id_producto = @id_producto',
    { id_usuario: req.usuario.id_usuario, id_producto }
  );
  if (existing[0]) return res.status(409).json({ error: 'Producto ya está en favoritos' });

  const { recordset } = await query(`
    INSERT INTO dbo.favoritos (id_usuario, id_producto)
    OUTPUT INSERTED.*
    VALUES (@id_usuario, @id_producto)
  `, { id_usuario: req.usuario.id_usuario, id_producto });

  res.status(201).json(recordset[0]);
});

router.delete('/:id_producto', authenticateToken, async (req, res) => {
  const id_producto = parseInt(req.params.id_producto);
  const { rowsAffected } = await query(
    'DELETE FROM dbo.favoritos WHERE id_usuario = @id_usuario AND id_producto = @id_producto',
    { id_usuario: req.usuario.id_usuario, id_producto }
  );
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Favorito no encontrado' });

  res.json({ message: 'Eliminado de favoritos' });
});

module.exports = router;

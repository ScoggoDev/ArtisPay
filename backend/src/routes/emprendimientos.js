const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', async (req, res) => {
  const { recordset } = await query(`
    SELECT e.*, u.nombre_usuario AS nombre_responsable
    FROM dbo.emprendimientos e
    LEFT JOIN dbo.usuarios u ON u.id_usuario = e.id_usuario
    WHERE e.activo = 1
  `);
  res.json(recordset);
});

router.get('/:id', async (req, res) => {
  const id_emprendimiento = parseInt(req.params.id);

  const { recordset: empRecord } = await query(`
    SELECT e.*, u.nombre_usuario AS nombre_responsable
    FROM dbo.emprendimientos e
    LEFT JOIN dbo.usuarios u ON u.id_usuario = e.id_usuario
    WHERE e.id_emprendimiento = @id_emprendimiento AND e.activo = 1
  `, { id_emprendimiento });
  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

  const { recordset: productos } = await query(
    'SELECT * FROM dbo.productos WHERE id_emprendimiento = @id_emprendimiento AND activo = 1',
    { id_emprendimiento }
  );
  const { recordset: imagenes } = await query(`
    SELECT i.* FROM dbo.imagenes_producto i
    INNER JOIN dbo.productos p ON p.id_producto = i.id_producto
    WHERE p.id_emprendimiento = @id_emprendimiento
  `, { id_emprendimiento });
  const prodsWithImages = productos.map(p => ({
    ...p,
    imagenes: imagenes.filter(i => i.id_producto === p.id_producto),
  }));

  const { recordset: servicios } = await query(
    'SELECT * FROM dbo.servicios WHERE id_emprendimiento = @id_emprendimiento AND activo = 1',
    { id_emprendimiento }
  );

  res.json({
    ...emp,
    productos: prodsWithImages,
    servicios,
  });
});

router.put('/me', authenticateToken, requireRole('emprendedor'), async (req, res) => {
  const { recordset: existing } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: req.usuario.id_usuario }
  );
  const emp = existing[0];
  if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

  const { nombre, descripcion, telefono, ubicacion, imagen_perfil, redes_sociales, id_categoria, latitud, longitud } = req.body;

  const { recordset } = await query(`
    UPDATE dbo.emprendimientos SET
      nombre = COALESCE(@nombre, nombre),
      descripcion = COALESCE(@descripcion, descripcion),
      telefono = COALESCE(@telefono, telefono),
      ubicacion = COALESCE(@ubicacion, ubicacion),
      imagen_perfil = COALESCE(@imagen_perfil, imagen_perfil),
      redes_sociales = COALESCE(@redes_sociales, redes_sociales),
      id_categoria = COALESCE(@id_categoria, id_categoria),
      latitud = COALESCE(@latitud, latitud),
      longitud = COALESCE(@longitud, longitud)
    OUTPUT INSERTED.*
    WHERE id_emprendimiento = @id_emprendimiento
  `, {
    nombre: nombre ?? null,
    descripcion: descripcion ?? null,
    telefono: telefono ?? null,
    ubicacion: ubicacion ?? null,
    imagen_perfil: imagen_perfil ?? null,
    redes_sociales: redes_sociales ?? null,
    id_categoria: id_categoria ?? null,
    latitud: latitud ?? null,
    longitud: longitud ?? null,
    id_emprendimiento: emp.id_emprendimiento,
  });

  res.json(recordset[0]);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../db/pool');

// obtener todos los emprendimientos //
router.get('/', async (req, res) => {
  const { recordset } = await query(`
    SELECT e.*, u.nombre_usuario AS nombre_responsable
    FROM dbo.emprendimientos e
    LEFT JOIN dbo.usuarios u ON u.id_usuario = e.id_usuario
    WHERE u.activo = 1
  `);
  res.json(recordset);
});

// get emprendedor destacado //
router.get('/emprendedor-destacado', async (req, res) => {
  try {
    const { recordset: perfilRecord } = await query(`
      SELECT e.id_emprendimiento, e.nombre, c.nombre as categoria, e.descripcion, e.imagen_perfil
      FROM dbo.emprendedor_destacado ed
      JOIN dbo.emprendimientos e ON ed.id_emprendimiento = e.id_emprendimiento
      JOIN dbo.categorias c ON c.id_categoria = e.id_categoria
      WHERE ed.id = 1
    `);

    const perfil = perfilRecord[0];

    if (!perfil) {
      return res.json(null);
    }

    // buscar sus 5 productos más recientes //
    const { recordset: productos } = await query(`
      SELECT TOP 5 p.id_producto, p.nombre, p.descripcion, p.precio, p.activo, p.fecha_publicacion, i.url as imagenes
      FROM dbo.productos p
      JOIN dbo.imagenes_producto i 
      ON p.id_producto = i.id_producto
      WHERE p.id_emprendimiento = @id_emprendimiento
      ORDER BY p.fecha_publicacion DESC
    `, { id_emprendimiento: perfil.id_emprendimiento });

    res.json({
      perfil,
      productos
    });
  } catch (error) {
    console.error("Error en emprendedor-destacado:", error);
    res.status(500).json({ error: 'Error al obtener el emprendedor destacado' });
  }
});

// modificar emprendedor destacado (solo admin) //
router.put('/emprendedor-destacado', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id_emprendimiento } = req.body;

  // 1. Validar que se envíe el ID
  if (!id_emprendimiento) {
    return res.status(400).json({ error: 'Debe proporcionar un id_emprendimiento' });
  }

  try {
    // 2. Verificar que el emprendimiento exista
    const { recordset: empExists } = await query(
      'SELECT id_emprendimiento FROM dbo.emprendimientos WHERE id_emprendimiento = @id_emprendimiento',
      { id_emprendimiento }
    );

    if (empExists.length === 0) {
      return res.status(404).json({ error: 'El emprendimiento especificado no existe' });
    }

    // 3. Intentar hacer el UPDATE en la fila con id = 1
    const { rowsAffected } = await query(`
      UPDATE dbo.emprendedor_destacado 
      SET id_emprendimiento = @id_emprendimiento, 
          fecha_actualizacion = GETDATE()
      WHERE id = 1;
    `, { id_emprendimiento });

    // 4. Si la tabla estaba vacía (ninguna fila actualizada), insertar la fila con id = 1
    if (rowsAffected[0] === 0) {
      await query(`
        INSERT INTO dbo.emprendedor_destacado (id, id_emprendimiento, fecha_actualizacion)
        VALUES (1, @id_emprendimiento, GETDATE());
      `, { id_emprendimiento });
    }

    res.json({ message: 'Emprendedor destacado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar emprendedor destacado:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar' });
  }
});

// modificar mis datos (emprendedor) //
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

// obtener un emprendimiento por id // 
router.get('/:id', async (req, res) => {
  const id_emprendimiento = parseInt(req.params.id);

  if (isNaN(id_emprendimiento)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const { recordset: empRecord } = await query(`
    SELECT e.*, u.nombre_usuario AS nombre_responsable
    FROM dbo.emprendimientos e
    LEFT JOIN dbo.usuarios u ON u.id_usuario = e.id_usuario
    WHERE e.id_emprendimiento = @id_emprendimiento AND u.activo = 1
  `, { id_emprendimiento });

  const emp = empRecord[0];
  if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

  const { recordset: productos } = await query(
    `SELECT * FROM dbo.productos WHERE id_emprendimiento = @id_emprendimiento and activo = 1`,
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
    `SELECT * FROM dbo.servicios WHERE id_emprendimiento = @id_emprendimiento and activo = 1`,
    { id_emprendimiento }
  );

   const { recordset: imagenes_servicio } = await query(`
    SELECT i.* FROM dbo.imagenes_servicio i
    INNER JOIN dbo.servicios s ON s.id_servicio = i.id_servicio
    WHERE s.id_emprendimiento = @id_emprendimiento
  `, { id_emprendimiento });

  const servWithImages = servicios.map(s => ({
    ...s,
    imagenes: imagenes_servicio.filter(i => i.id_servicio === s.id_servicio),
  }));

  res.json({
    ...emp,
    productos: prodsWithImages,
    servicios: servWithImages,
  });
});

module.exports = router;
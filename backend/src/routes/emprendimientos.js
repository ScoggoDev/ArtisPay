const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { emprendimientos, usuarios, productos, imagenes_producto } = require('../data/store');

router.get('/', (req, res) => {
  const activos = emprendimientos.filter(e => e.activo);
  const result = activos.map(e => {
    const usuario = usuarios.find(u => u.id_usuario === e.id_usuario);
    return { ...e, nombre_responsable: usuario?.nombre_usuario || '' };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const emp = emprendimientos.find(e => e.id_emprendimiento === parseInt(req.params.id) && e.activo);
  if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

  const usuario = usuarios.find(u => u.id_usuario === emp.id_usuario);
  const prods = productos.filter(p => p.id_emprendimiento === emp.id_emprendimiento && p.activo);
  const prodsWithImages = prods.map(p => ({
    ...p,
    imagenes: imagenes_producto.filter(i => i.id_producto === p.id_producto),
  }));

  res.json({
    ...emp,
    nombre_responsable: usuario?.nombre_usuario || '',
    productos: prodsWithImages,
  });
});

router.put('/me', authenticateToken, requireRole('emprendedor'), (req, res) => {
  const emp = emprendimientos.find(e => e.id_usuario === req.usuario.id_usuario);
  if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

  const { nombre, descripcion, telefono, ubicacion, imagen_perfil, redes_sociales, id_categoria } = req.body;
  if (nombre !== undefined) emp.nombre = nombre;
  if (descripcion !== undefined) emp.descripcion = descripcion;
  if (telefono !== undefined) emp.telefono = telefono;
  if (ubicacion !== undefined) emp.ubicacion = ubicacion;
  if (imagen_perfil !== undefined) emp.imagen_perfil = imagen_perfil;
  if (redes_sociales !== undefined) emp.redes_sociales = redes_sociales;
  if (id_categoria !== undefined) emp.id_categoria = id_categoria;

  res.json(emp);
});

module.exports = router;

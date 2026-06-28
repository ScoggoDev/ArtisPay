const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { productos, emprendimientos, imagenes_producto, categorias, getNextId } = require('../data/store');

router.get('/', (req, res) => {
  const { categoria, precio_min, precio_max, busqueda, destacado } = req.query;

  let result = productos.filter(p => p.activo);

  if (categoria) {
    result = result.filter(p => p.id_categoria === parseInt(categoria));
  }
  if (precio_min) {
    result = result.filter(p => p.precio >= parseFloat(precio_min));
  }
  if (precio_max) {
    result = result.filter(p => p.precio <= parseFloat(precio_max));
  }
  if (busqueda) {
    const term = busqueda.toLowerCase();
    result = result.filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      p.descripcion.toLowerCase().includes(term)
    );
  }
  if (destacado === 'true') {
    result = result.filter(p => p.destacado);
  }

  const enriched = result.map(p => {
    const emp = emprendimientos.find(e => e.id_emprendimiento === p.id_emprendimiento);
    const cat = categorias.find(c => c.id_categoria === p.id_categoria);
    const imgs = imagenes_producto.filter(i => i.id_producto === p.id_producto);
    return {
      ...p,
      emprendimiento_nombre: emp?.nombre || '',
      categoria_nombre: cat?.nombre || '',
      imagenes: imgs,
    };
  });

  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const producto = productos.find(p => p.id_producto === parseInt(req.params.id) && p.activo);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const emp = emprendimientos.find(e => e.id_emprendimiento === producto.id_emprendimiento);
  const cat = categorias.find(c => c.id_categoria === producto.id_categoria);
  const imgs = imagenes_producto.filter(i => i.id_producto === producto.id_producto);

  res.json({
    ...producto,
    emprendimiento_nombre: emp?.nombre || '',
    emprendimiento: emp || null,
    categoria_nombre: cat?.nombre || '',
    imagenes: imgs,
  });
});

router.post('/', authenticateToken, requireRole('emprendedor'), (req, res) => {
  const emp = emprendimientos.find(e => e.id_usuario === req.usuario.id_usuario);
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const { nombre, descripcion, precio, id_categoria, imagenes } = req.body;

  if (!nombre || precio === undefined || !id_categoria) {
    return res.status(400).json({ error: 'Campos obligatorios: nombre, precio, id_categoria' });
  }

  const producto = {
    id_producto: getNextId('producto'),
    id_emprendimiento: emp.id_emprendimiento,
    id_categoria: parseInt(id_categoria),
    nombre,
    descripcion: descripcion || '',
    precio: parseFloat(precio),
    destacado: false,
    activo: true,
    fecha_publicacion: new Date().toISOString(),
  };
  productos.push(producto);

  if (imagenes && Array.isArray(imagenes)) {
    imagenes.forEach((url, index) => {
      imagenes_producto.push({
        id_imagen: getNextId('imagen'),
        id_producto: producto.id_producto,
        url,
        orden: index,
      });
    });
  }

  const imgs = imagenes_producto.filter(i => i.id_producto === producto.id_producto);
  res.status(201).json({ ...producto, imagenes: imgs });
});

router.put('/:id', authenticateToken, requireRole('emprendedor'), (req, res) => {
  const emp = emprendimientos.find(e => e.id_usuario === req.usuario.id_usuario);
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const producto = productos.find(
    p => p.id_producto === parseInt(req.params.id) && p.id_emprendimiento === emp.id_emprendimiento
  );
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const { nombre, descripcion, precio, id_categoria, destacado } = req.body;
  if (nombre !== undefined) producto.nombre = nombre;
  if (descripcion !== undefined) producto.descripcion = descripcion;
  if (precio !== undefined) producto.precio = parseFloat(precio);
  if (id_categoria !== undefined) producto.id_categoria = parseInt(id_categoria);
  if (destacado !== undefined) producto.destacado = destacado;

  const imgs = imagenes_producto.filter(i => i.id_producto === producto.id_producto);
  res.json({ ...producto, imagenes: imgs });
});

router.delete('/:id', authenticateToken, requireRole('emprendedor'), (req, res) => {
  const emp = emprendimientos.find(e => e.id_usuario === req.usuario.id_usuario);
  if (!emp) return res.status(404).json({ error: 'No tiene un emprendimiento asociado' });

  const producto = productos.find(
    p => p.id_producto === parseInt(req.params.id) && p.id_emprendimiento === emp.id_emprendimiento
  );
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  producto.activo = false;
  res.json({ message: 'Producto eliminado exitosamente' });
});

module.exports = router;

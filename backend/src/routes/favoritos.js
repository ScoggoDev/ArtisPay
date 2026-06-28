const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { favoritos, productos, imagenes_producto, emprendimientos, getNextId } = require('../data/store');

router.get('/', authenticateToken, (req, res) => {
  const misFavoritos = favoritos.filter(f => f.id_usuario === req.usuario.id_usuario);
  const result = misFavoritos.map(f => {
    const producto = productos.find(p => p.id_producto === f.id_producto);
    const emp = producto ? emprendimientos.find(e => e.id_emprendimiento === producto.id_emprendimiento) : null;
    const imgs = imagenes_producto.filter(i => i.id_producto === f.id_producto);
    return {
      ...f,
      producto: producto ? { ...producto, imagenes: imgs, emprendimiento_nombre: emp?.nombre || '' } : null,
    };
  });
  res.json(result);
});

router.post('/:id_producto', authenticateToken, (req, res) => {
  const id_producto = parseInt(req.params.id_producto);
  const producto = productos.find(p => p.id_producto === id_producto && p.activo);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const exists = favoritos.find(f => f.id_usuario === req.usuario.id_usuario && f.id_producto === id_producto);
  if (exists) return res.status(409).json({ error: 'Producto ya está en favoritos' });

  const fav = {
    id_favorito: getNextId('favorito'),
    id_usuario: req.usuario.id_usuario,
    id_producto,
    fecha: new Date().toISOString(),
  };
  favoritos.push(fav);
  res.status(201).json(fav);
});

router.delete('/:id_producto', authenticateToken, (req, res) => {
  const id_producto = parseInt(req.params.id_producto);
  const index = favoritos.findIndex(f => f.id_usuario === req.usuario.id_usuario && f.id_producto === id_producto);
  if (index === -1) return res.status(404).json({ error: 'Favorito no encontrado' });

  favoritos.splice(index, 1);
  res.json({ message: 'Eliminado de favoritos' });
});

module.exports = router;

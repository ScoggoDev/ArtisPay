const express = require('express');
const router = express.Router();
const { categorias } = require('../data/store');

router.get('/', (req, res) => {
  res.json(categorias);
});

router.get('/:id', (req, res) => {
  const cat = categorias.find(c => c.id_categoria === parseInt(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(cat);
});

module.exports = router;

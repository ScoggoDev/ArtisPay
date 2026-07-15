const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');

router.get('/', async (req, res) => {
  const { recordset } = await query('SELECT * FROM dbo.categorias ORDER BY id_categoria');
  res.json(recordset);
});

router.get('/:id', async (req, res) => {
  const { recordset } = await query(
    'SELECT * FROM dbo.categorias WHERE id_categoria = @id_categoria',
    { id_categoria: parseInt(req.params.id) }
  );
  if (!recordset[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(recordset[0]);
});

module.exports = router;

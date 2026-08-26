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

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Campos obligatorios: nombre, descripcion' });
  }

  const { recordset } = await query(`
    UPDATE dbo.categorias
    SET nombre = @nombre, descripcion = @descripcion
    OUTPUT INSERTED.*
    WHERE id_categoria = @id_categoria
  `, { nombre, descripcion, id_categoria: parseInt(req.params.id) });

  if (!recordset[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(recordset[0]);
});

router.delete('/:id', async (req, res) => {

  const { recordset: usoCategoria } = await query(`
    SELECT 
      (SELECT COUNT(1) FROM dbo.emprendimientos WHERE id_categoria = @id_categoria) AS en_emprendimientos,
      (SELECT COUNT(1) FROM dbo.productos WHERE id_categoria = @id_categoria) AS en_productos
  `, { id_categoria: parseInt(req.params.id) });

  const { en_emprendimientos, en_productos } = usoCategoria[0];

  if (en_emprendimientos > 0 || en_productos > 0) {
    return res.status(400).json({
      error: 'No es posible eliminar la categoría porque está asociada a emprendimientos o productos existentes.'
    });
  }

  const { rowsAffected } = await query(
    'DELETE FROM dbo.categorias WHERE id_categoria = @id_categoria',
    { id_categoria: parseInt(req.params.id) }
  );
  if (!rowsAffected[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ message: 'Categoría eliminada exitosamente' });
});

module.exports = router;

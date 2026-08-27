const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

router.post('/registro/cliente', async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  if (!nombre_usuario || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const { recordset: existentes } = await query('SELECT id_usuario FROM dbo.usuarios WHERE email = @email', { email });
  if (existentes.length > 0) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const { recordset } = await query(
    `INSERT INTO dbo.usuarios (nombre_usuario, email, password_hash, tipo, activo)
     OUTPUT INSERTED.id_usuario, INSERTED.fecha_registro
     VALUES (@nombre_usuario, @email, @password_hash, 'cliente', 1)`,
    { nombre_usuario, email, password_hash: hash }
  );
  const id_usuario = recordset[0].id_usuario;

  const token = jwt.sign(
    { id_usuario, tipo: 'cliente' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    token,
    usuario: { id_usuario, nombre_usuario, email, tipo: 'cliente' },
  });
});

router.post('/registro/emprendedor', async (req, res) => {
  const { nombre_usuario, email, password, nombre_emprendimiento, telefono, descripcion, id_categoria } = req.body;

  if (!nombre_usuario || !email || !password || !nombre_emprendimiento) {
    return res.status(400).json({ error: 'Campos obligatorios: nombre_usuario, email, password, nombre_emprendimiento' });
  }

  const { recordset: existentes } = await query('SELECT id_usuario FROM dbo.usuarios WHERE email = @email', { email });
  if (existentes.length > 0) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const { recordset: userRecord } = await query(
    `INSERT INTO dbo.usuarios (nombre_usuario, email, password_hash, tipo, activo)
     OUTPUT INSERTED.id_usuario
     VALUES (@nombre_usuario, @email, @password_hash, 'emprendedor', 1)`,
    { nombre_usuario, email, password_hash: hash }
  );
  const id_usuario = userRecord[0].id_usuario;

  const { recordset: empRecord } = await query(
    `INSERT INTO dbo.emprendimientos
        (id_usuario, nombre, descripcion, telefono, ubicacion, redes_sociales, id_categoria)
     OUTPUT INSERTED.*
     VALUES (@id_usuario, @nombre, @descripcion, @telefono, '', '', @id_categoria)`,
    {
      id_usuario,
      nombre: nombre_emprendimiento,
      descripcion: descripcion || '',
      telefono: telefono || '',
      id_categoria: id_categoria || null,
    }
  );
  const emprendimiento = empRecord[0];

  const token = jwt.sign(
    { id_usuario, tipo: 'emprendedor' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    token,
    usuario: { id_usuario, nombre_usuario, email, tipo: 'emprendedor' },
    emprendimiento,
  });
});

router.post('/registro/moderador', async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  if (!nombre_usuario || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const { recordset: existentes } = await query('SELECT id_usuario FROM dbo.usuarios WHERE email = @email',
    { email });
  if (existentes.length > 0) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  };

  const hash = await bcrypt.hash(password, 10);

  const { recordset } = await query(
    `INSERT INTO dbo.usuarios (nombre_usuario, email, password_hash, tipo, activo)
     OUTPUT INSERTED.id_usuario, INSERTED.fecha_registro
     VALUES (@nombre_usuario, @email, @password_hash, 'moderador', 1)`,
    { nombre_usuario, email, password_hash: hash }
  );
  const id_usuario = recordset[0].id_usuario;
  const token = jwt.sign(
    { id_usuario, tipo: 'moderador' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    token,
    usuario: { id_usuario, nombre_usuario, email, tipo: 'moderador' },
  });


});

router.post('/registro/categoria', async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const { recordset } = await query(
    `INSERT INTO dbo.categorias (nombre, descripcion)
     OUTPUT INSERTED.id_categoria
     VALUES (@nombre, @descripcion)`,
    { nombre, descripcion }
  );
  const id_categoria = recordset[0].id_categoria;

  res.status(201).json({
    categoria: { id_categoria, nombre, descripcion },
  });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios' });
  }

  const { recordset } = await query(
    'SELECT * FROM dbo.usuarios WHERE email = @email',
    { email }
  );
  const usuario = recordset[0];

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no registrado' });
  }

  if (!usuario.activo) {
    return res.status(403).json({ error: 'Usuario bloqueado' });
  }

  const valid = await bcrypt.compare(password, usuario.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const { recordset: empRecord } = await query(
    'SELECT * FROM dbo.emprendimientos WHERE id_usuario = @id_usuario',
    { id_usuario: usuario.id_usuario }
  );

  res.json({
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      email: usuario.email,
      tipo: usuario.tipo
    },
    emprendimiento: empRecord[0] || null,
  });
});
module.exports = router;

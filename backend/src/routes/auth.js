const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { usuarios, emprendimientos, getNextId } = require('../data/store');

router.post('/registro/cliente', async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  if (!nombre_usuario || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const usuario = {
    id_usuario: getNextId('usuario'),
    nombre_usuario,
    email,
    password_hash: hash,
    tipo: 'cliente',
    activo: true,
    fecha_registro: new Date().toISOString(),
  };
  usuarios.push(usuario);

  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    token,
    usuario: { id_usuario: usuario.id_usuario, nombre_usuario, email, tipo: usuario.tipo },
  });
});

router.post('/registro/emprendedor', async (req, res) => {
  const { nombre_usuario, email, password, nombre_emprendimiento, telefono, descripcion, id_categoria } = req.body;

  if (!nombre_usuario || !email || !password || !nombre_emprendimiento) {
    return res.status(400).json({ error: 'Campos obligatorios: nombre_usuario, email, password, nombre_emprendimiento' });
  }

  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const usuario = {
    id_usuario: getNextId('usuario'),
    nombre_usuario,
    email,
    password_hash: hash,
    tipo: 'emprendedor',
    activo: true,
    fecha_registro: new Date().toISOString(),
  };
  usuarios.push(usuario);

  const emprendimiento = {
    id_emprendimiento: getNextId('emprendimiento'),
    id_usuario: usuario.id_usuario,
    nombre: nombre_emprendimiento,
    descripcion: descripcion || '',
    telefono: telefono || '',
    ubicacion: '',
    imagen_perfil: '',
    redes_sociales: '',
    activo: true,
    fecha_creacion: new Date().toISOString(),
    id_categoria: id_categoria || null,
  };
  emprendimientos.push(emprendimiento);

  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    token,
    usuario: { id_usuario: usuario.id_usuario, nombre_usuario, email, tipo: usuario.tipo },
    emprendimiento,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios' });
  }

  const usuario = usuarios.find(u => u.email === email && u.activo);
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
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

  const emprendimiento = emprendimientos.find(e => e.id_usuario === usuario.id_usuario);

  res.json({
    token,
    usuario: { id_usuario: usuario.id_usuario, nombre_usuario: usuario.nombre_usuario, email: usuario.email, tipo: usuario.tipo },
    emprendimiento: emprendimiento || null,
  });
});

module.exports = router;

const jwt = require('jsonwebtoken');
const { usuarios } = require('../data/store');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = usuarios.find(u => u.id_usuario === decoded.id_usuario && u.activo);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }
    req.usuario = { id_usuario: usuario.id_usuario, tipo: usuario.tipo, email: usuario.email };
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.tipo)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };

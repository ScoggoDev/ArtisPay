const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const categorias = [
  { id_categoria: 1, nombre: 'Cerámica', descripcion: 'Productos de cerámica artesanal' },
  { id_categoria: 2, nombre: 'Carpintería', descripcion: 'Trabajos en madera' },
  { id_categoria: 3, nombre: 'Tejido', descripcion: 'Tejidos y textiles artesanales' },
  { id_categoria: 4, nombre: 'Gastronomía', descripcion: 'Producción gastronómica artesanal' },
  { id_categoria: 5, nombre: 'Marroquinería', descripcion: 'Trabajos en cuero' },
  { id_categoria: 6, nombre: 'Joyería', descripcion: 'Joyería y bisutería artesanal' },
  { id_categoria: 7, nombre: 'Arte textil', descripcion: 'Bordado, costura y arte textil' },
  { id_categoria: 8, nombre: 'Otros', descripcion: 'Otras categorías artesanales' },
];

const usuarios = [];
const emprendimientos = [];
const productos = [];
const imagenes_producto = [];
const favoritos = [];
const solicitudes_presupuesto = [];
const reportes = [];

let nextId = {
  usuario: 1,
  emprendimiento: 1,
  producto: 1,
  imagen: 1,
  categoria: 9,
  favorito: 1,
  solicitud: 1,
  reporte: 1,
};

function getNextId(entity) {
  return nextId[entity]++;
}

async function seedAdmin() {
  if (usuarios.find(u => u.tipo === 'admin')) return;
  const hash = await bcrypt.hash('admin123', 10);
  usuarios.push({
    id_usuario: getNextId('usuario'),
    nombre_usuario: 'admin',
    email: 'admin@artispay.com',
    password_hash: hash,
    tipo: 'admin',
    activo: true,
    fecha_registro: new Date().toISOString(),
  });
}

seedAdmin();

module.exports = {
  categorias,
  usuarios,
  emprendimientos,
  productos,
  imagenes_producto,
  favoritos,
  solicitudes_presupuesto,
  reportes,
  getNextId,
};

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('./pool');

const categorias = [
  { nombre: 'Cerámica', descripcion: 'Productos de cerámica artesanal' },
  { nombre: 'Carpintería', descripcion: 'Trabajos en madera' },
  { nombre: 'Tejido', descripcion: 'Tejidos y textiles artesanales' },
  { nombre: 'Gastronomía', descripcion: 'Producción gastronómica artesanal' },
  { nombre: 'Marroquinería', descripcion: 'Trabajos en cuero' },
  { nombre: 'Joyería', descripcion: 'Joyería y bisutería artesanal' },
  { nombre: 'Arte textil', descripcion: 'Bordado, costura y arte textil' },
  { nombre: 'Otros', descripcion: 'Otras categorías artesanales' },
];

const emprendedores = [
  { nombre_usuario: 'ceramicapaysa', email: 'ceramicapaysa@artispay.com', nombre: 'Cerámica Paysa', descripcion: 'Piezas únicas de cerámica artesanal inspiradas en el campo uruguayo.', telefono: '099 123 456', ubicacion: 'Barrio Centro, Paysandú', id_categoria: 1, latitud: -32.3175, longitud: -58.0757, redes_sociales: '@ceramicapaysa' },
  { nombre_usuario: 'tejidosdelrio', email: 'tejidosdelrio@artispay.com', nombre: 'Tejidos del Río', descripcion: 'Tejidos a mano en lana merino y algodón orgánico.', telefono: '099 234 567', ubicacion: 'Barrio Salto, Paysandú', id_categoria: 3, latitud: -32.3052, longitud: -58.0821, redes_sociales: '@tejidosdelrio' },
  { nombre_usuario: 'maderaviva', email: 'maderaviva@artispay.com', nombre: 'Madera Viva', descripcion: 'Muebles y objetos de madera nativa recuperada.', telefono: '099 345 678', ubicacion: 'Barrio Norte, Paysandú', id_categoria: 2, latitud: -32.3024, longitud: -58.0694, redes_sociales: '' },
  { nombre_usuario: 'dulcesartesanos', email: 'dulcesartesanos@artispay.com', nombre: 'Dulces Artesanos', descripcion: 'Mermeladas, dulces y conservas elaboradas con frutas de temporada.', telefono: '099 456 789', ubicacion: 'Barrio Sur, Paysandú', id_categoria: 4, latitud: -32.3298, longitud: -58.0712, redes_sociales: '@dulcesartesanos' },
  { nombre_usuario: 'joyeriaetnica', email: 'joyeriaetnica@artispay.com', nombre: 'Joyería Étnica', descripcion: 'Joyas de plata y piedras semipreciosas con diseños étnicos.', telefono: '099 567 890', ubicacion: 'Barrio Artigas, Paysandú', id_categoria: 6, latitud: -32.3210, longitud: -58.0880, redes_sociales: '@joyeriaetnica' },
];

const productosPorEmprendedor = [
  [
    { nombre: 'Tazón pintado a mano', descripcion: 'Tazón de greda con esmalte natural y motivos florales.', precio: 850, destacado: true, id_categoria: 1, imagen: 'https://loremflickr.com/400/400/ceramic,bowl?lock=1' },
    { nombre: 'Plato decorativo', descripcion: 'Plato de cerámica con flora nativa uruguaya.', precio: 1200, destacado: false, id_categoria: 1, imagen: 'https://loremflickr.com/400/400/pottery,plate?lock=2' },
  ],
  [
    { nombre: 'Bufanda de lana merino', descripcion: 'Tejida a mano en colores naturales, 180 cm.', precio: 950, destacado: true, id_categoria: 3, imagen: 'https://loremflickr.com/400/400/wool,scarf?lock=3' },
    { nombre: 'Gorro de algodón orgánico', descripcion: 'Tejido a crochet, talla única.', precio: 480, destacado: false, id_categoria: 3, imagen: 'https://loremflickr.com/400/400/knit,hat?lock=4' },
  ],
  [
    { nombre: 'Estante de quebracho', descripcion: 'Madera nativa recuperada, 80 x 25 cm.', precio: 2500, destacado: true, id_categoria: 2, imagen: 'https://loremflickr.com/400/400/wood,shelf?lock=5' },
  ],
  [
    { nombre: 'Mermelada de durazno', descripcion: 'Elaborada con fruta de temporada, 300 g.', precio: 280, destacado: false, id_categoria: 4, imagen: 'https://loremflickr.com/400/400/jam,peach?lock=6' },
    { nombre: 'Dulce de leche artesanal', descripcion: 'Receta tradicional uruguaya, 250 g.', precio: 320, destacado: true, id_categoria: 4, imagen: 'https://loremflickr.com/400/400/caramel,jar?lock=7' },
  ],
  [
    { nombre: 'Anillo de plata con cuarzo', descripcion: 'Plata 925 con piedra de cuarzo rosado.', precio: 1800, destacado: true, id_categoria: 6, imagen: 'https://loremflickr.com/400/400/silver,ring?lock=8' },
    { nombre: 'Pulsera de plata trenzada', descripcion: 'Plata 925, ajustable.', precio: 1100, destacado: false, id_categoria: 6, imagen: 'https://loremflickr.com/400/400/silver,bracelet?lock=9' },
  ],
];

const serviciosPorEmprendedor = [
  [
    { nombre: 'Taller de iniciación en cerámica', descripcion: 'Clases grupales de 3 horas, materiales incluidos.', precio: 500 },
    { nombre: 'Encargo personalizado', descripcion: 'Piezas únicas elaboradas bajo pedido con tus diseños.', precio: null },
  ],
  [
    { nombre: 'Taller de tejido a dos agujas', descripcion: 'Aprende técnicas básicas y avanzadas.', precio: 400 },
    { nombre: 'Prenda a medida', descripcion: 'Diseñamos juntos tu prenda con tus colores y medidas.', precio: null },
  ],
  [
    { nombre: 'Restauración de muebles', descripcion: 'Reparación, lijado y acabado de muebles de madera.', precio: null },
    { nombre: 'Diseño de mueble a medida', descripcion: 'Creamos el mueble que necesitás con madera nativa.', precio: null },
  ],
  [
    { nombre: 'Catering artesanal para eventos', descripcion: 'Conservas, dulces y pastas para eventos y regalos.', precio: null },
  ],
  [
    { nombre: 'Diseño de joya personalizada', descripcion: 'Tu joya única diseñada con vos en plata u oro.', precio: null },
    { nombre: 'Reparación y limpieza de joyas', descripcion: 'Servicio profesional de restauración de joyas.', precio: 300 },
  ],
];

async function seed() {
  const pool = await poolPromise;

  const { recordset: existingCats } = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.categorias');
  if (existingCats[0].total > 0) {
    console.log('La base ya contiene datos, se omite el seed.');
    process.exit(0);
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const catIds = {};
    for (const cat of categorias) {
      const r = await new sql.Request(tx)
        .input('nombre', cat.nombre)
        .input('descripcion', cat.descripcion)
        .query('INSERT INTO dbo.categorias (nombre, descripcion) OUTPUT INSERTED.id_categoria VALUES (@nombre, @descripcion)');
      catIds[cat.nombre] = r.recordset[0].id_categoria;
    }
    const catIdByIndex = categorias.map(c => catIds[c.nombre]);

    const adminHash = await bcrypt.hash('admin123', 10);
    await new sql.Request(tx)
      .input('nombre_usuario', 'admin')
      .input('email', 'admin@artispay.com')
      .input('password_hash', adminHash)
      .input('tipo', 'admin')
      .query(`INSERT INTO dbo.usuarios (nombre_usuario, email, password_hash, tipo, activo)
              VALUES (@nombre_usuario, @email, @password_hash, @tipo, 1)`);

    const demoHash = await bcrypt.hash('demo1234', 10);
    for (let i = 0; i < emprendedores.length; i++) {
      const e = emprendedores[i];
      const userResult = await new sql.Request(tx)
        .input('nombre_usuario', e.nombre_usuario)
        .input('email', e.email)
        .input('password_hash', demoHash)
        .input('tipo', 'emprendedor')
        .query(`INSERT INTO dbo.usuarios (nombre_usuario, email, password_hash, tipo, activo)
                OUTPUT INSERTED.id_usuario VALUES (@nombre_usuario, @email, @password_hash, @tipo, 1)`);
      const idUsuario = userResult.recordset[0].id_usuario;

      const empResult = await new sql.Request(tx)
        .input('id_usuario', idUsuario)
        .input('nombre', e.nombre)
        .input('descripcion', e.descripcion)
        .input('telefono', e.telefono)
        .input('ubicacion', e.ubicacion)
        .input('id_categoria', catIdByIndex[e.id_categoria - 1])
        .input('latitud', e.latitud)
        .input('longitud', e.longitud)
        .input('redes_sociales', e.redes_sociales)
        .query(`INSERT INTO dbo.emprendimientos
                  (id_usuario, nombre, descripcion, telefono, ubicacion, id_categoria, activo, latitud, longitud, redes_sociales)
                OUTPUT INSERTED.id_emprendimiento
                VALUES (@id_usuario, @nombre, @descripcion, @telefono, @ubicacion, @id_categoria, 1, @latitud, @longitud, @redes_sociales)`);
      const idEmprendimiento = empResult.recordset[0].id_emprendimiento;

      for (const p of productosPorEmprendedor[i]) {
        const prodResult = await new sql.Request(tx)
          .input('id_emprendimiento', idEmprendimiento)
          .input('id_categoria', catIdByIndex[p.id_categoria - 1])
          .input('nombre', p.nombre)
          .input('descripcion', p.descripcion)
          .input('precio', p.precio)
          .input('destacado', p.destacado)
          .query(`INSERT INTO dbo.productos (id_emprendimiento, id_categoria, nombre, descripcion, precio, destacado, activo)
                  OUTPUT INSERTED.id_producto
                  VALUES (@id_emprendimiento, @id_categoria, @nombre, @descripcion, @precio, @destacado, 1)`);
        const idProducto = prodResult.recordset[0].id_producto;

        await new sql.Request(tx)
          .input('id_producto', idProducto)
          .input('url', p.imagen)
          .query('INSERT INTO dbo.imagenes_producto (id_producto, url, orden) VALUES (@id_producto, @url, 0)');
      }

      for (const s of serviciosPorEmprendedor[i]) {
        await new sql.Request(tx)
          .input('id_emprendimiento', idEmprendimiento)
          .input('nombre', s.nombre)
          .input('descripcion', s.descripcion)
          .input('precio', s.precio)
          .query(`INSERT INTO dbo.servicios (id_emprendimiento, nombre, descripcion, precio, activo)
                  VALUES (@id_emprendimiento, @nombre, @descripcion, @precio, 1)`);
      }
    }

    await tx.commit();
    console.log('Seed completado correctamente.');
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  process.exit(0);
}

seed().catch(err => {
  console.error('Error en el seed:', err);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { poolPromise } = require('./pool');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const pool = await poolPromise;
  await pool.request().batch(schema);
  console.log('Esquema aplicado correctamente.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Error al aplicar el esquema:', err);
  process.exit(1);
});

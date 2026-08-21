import pg from 'pg';

const { Pool } = pg;

// Las fechas y horas se devuelven como texto plano. Sin esto, node-postgres
// convierte DATE a un objeto Date en la zona horaria del servidor y la fecha
// se corre un día al serializarla a JSON.
pg.types.setTypeParser(1082, (valor) => valor); // date
pg.types.setTypeParser(1083, (valor) => valor); // time
pg.types.setTypeParser(1114, (valor) => valor); // timestamp sin zona

// numeric llega como string por defecto para no perder precisión, pero los
// modelos del frontend lo esperan como número.
pg.types.setTypeParser(1700, (valor) => (valor === null ? null : Number(valor)));

// bigint (los conteos de las vistas de resumen)
pg.types.setTypeParser(20, (valor) => (valor === null ? null : Number(valor)));

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 10,
});

export function consultar(sql, parametros = []) {
  return pool.query(sql, parametros);
}

export async function verificarConexion() {
  const { rows } = await pool.query('SELECT current_database() AS bd, version() AS version');
  return rows[0];
}

const { Pool } = require('pg');

const pool = new Pool ({
    host: '34.210.153.166',
    user: 'postgres',
    database: 'postgres',
    password: 'password',
    port: 5432
})

pool.query('SELECT NOW()')
  .then(res => console.log('Connected to Postgres at', res.rows[0].now))
  .catch(e => console.error(e.stack))

module.exports = pool;

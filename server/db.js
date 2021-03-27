const { Pool } = require('pg');

const pool = new Pool ({
    host: process.env.HOST,
    user: process.env.USER,
    database: 'reviews',
    password: process.env.PASSWORD,
    port: process.env.PORT
})

pool.query('SELECT NOW()')
  .then(res => console.log('Connected to Postgres at', res.rows[0].now))
  .catch(e => console.error(e.stack))

module.exports = pool;

const { Client } = require('pg');

const client = new Client ({
    host: 'localhost',
    database: 'reviews',
    port: 5432
})

client.connect((err) => {
    if(err) {
      console.log(err)
    } else {
      console.log('Connected to PostgreSQL :)')
    }
  });

module.exports = client;

// client.query('select * from review where id = 2', (err, res) =>  {
//     if (err) {
//         console.log(err)
//         return;
//     }
//     console.log(res.rows);
//     client.end();
// })
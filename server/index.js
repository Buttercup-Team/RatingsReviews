let express = require('express');
let path = require('path');
const { from } = require('responselike');
const client = require('./db');
let db = require('./db')

let app = express();
let PORT = 3003 || process.env.PORT;

app.use(express.json())

app.get('/reviews/:product_id/:sort', (req, res) => {
  const { product_id, sort } = req.params;
  let sql;
  if (sort === 'newest') {
    sql = `SELECT * FROM review WHERE product_id = ${product_id} AND reported = false ORDER BY date DESC limit 10`
  } else if (sort === 'helpful') {
    sql = `SELECT * FROM review WHERE product_id = ${product_id} AND reported = false ORDER BY helpfulness DESC limit 10`
  } else if (sort === 'relevant') {
    sql = `SELECT * FROM review WHERE product_id = ${product_id} AND reported = false ORDER BY helpfulness DESC, date DESC limit 10`
  }

  const response = {};

  db.query(sql)
    .then((results) => {
      response.results = results.rows;
      let sql2;
      let review_id;
      let photosArray;
      for (let i = 0; i < response.results.length; i++) {
      review_id = response.results[i].id;
      sql2 = `select array_to_json(array_agg(row_to_json(photos))) as rows
      from(select url from photos where review_id = ${review_id}) photos`;
  
      client.query(sql2)
        .then((photos) => {
          // console.log('photos:', photos.rows[0].rows)
          if (photos.rows[0].rows === null) {
            photosArray = []
          } else {
            photosArray = photos.rows[0].rows;
          }
          // console.log('photosArray', photosArray)
          response.results[i].photos = photosArray;
          console.log(response.results.photos)
        })
        .catch((err) => console.log(err))
        // console.log('RESPONSE: ', response)
        // console.log(response.results[i].photos)
      }
      // console.log(response)
    })
    .then(() => res.send(response))
    .catch((err) => console.log(err));
})

// app.get('/reviews/photos', (req, res) => {
//  let sql = `select array_to_json(array_agg(row_to_json(photos))) as rows
//  from(select url from photos where review_id = 5) photos`;
//  db.query(sql)
//   .then((result) => res.send(result))
// })


app.get('/reviews/meta/:product_id', (req, res) => {
  const { product_id } = req.params;

  const result = {
    product_id: product_id,
    ratings: {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    },
    recommended: {
      true: 0,
      false: 0,
    },
    characteristics: {}
  }

  let sql = `
    SELECT value FROM characteristics_reviews JOIN reviews USING(review_id) WHERE product_id = ${product_id};
    SELECT recommend FROM reviews WHERE product_id = ${product_id}`
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})

let express = require('express');
let path = require('path');
const { RowDescriptionMessage } = require('pg-protocol/dist/messages');
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
      let promiseArray = []
      for (let i = 0; i < response.results.length; i++) {
        review_id = response.results[i].id;
        sql2 = `select array_to_json(array_agg(row_to_json(photos))) as rows
          from(select url from photos where review_id = ${review_id}) photos`;

        let promise = db.query(sql2)
          .then((photos) => {
            if (photos.rows[0].rows === null) {
              photosArray = []
            } else {
              photosArray = photos.rows[0].rows.map((photo) => photo.url);
            }
            response.results[i].photos = photosArray;
          })
          .catch((err) => console.log(err))
          promiseArray.push(promise)
        }
        return Promise.all(promiseArray)
      })
      .then(() => res.send(response))
      .catch((err) => console.log(err));
})



app.get('/api/reviews/meta/:product_id', (req, res) => {
  const { product_id } = req.params;

  const response = {
    product_id: product_id,
    ratings: {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    },
    recommend: {
      true: 0,
      false: 0,
    },
    characteristics: {}
  }

  let sql = `
    SELECT value FROM characteristics_reviews JOIN review USING(id) WHERE product_id = ${product_id};
    SELECT recommend FROM review WHERE product_id = ${product_id};

    SELECT AVG(value) AS valueAvg, characteristics_id, name FROM characteristics 
    JOIN characteristics_reviews USING(characteristics_id) WHERE product_id = ${product_id} 
    GROUP BY name, characteristics_id;`;

  db.query(sql)
    .then((results) => {
      for (let i = 0; i < results[0].rows.length ; i++) {
        response.ratings[results[0].rows[i].value] += 1
      }
      response.ratings['1'] = response.ratings['1'].toString();
      response.ratings['2'] = response.ratings['2'].toString();
      response.ratings['3'] = response.ratings['3'].toString();
      response.ratings['4'] = response.ratings['4'].toString();
      response.ratings['5'] = response.ratings['5'].toString();

      for (let i = 0; i < results[1].rows.length; i++) {
        response.recommend[results[1].rows[i].recommend] += 1;
      }
      response.recommend.true = response.recommend.true.toString();
      response.recommend.false = response.recommend.false.toString();

      for (let i = 0; i < results[2].rows.length; i++) {
        response.characteristics[results[2].rows[i].name] = {
          id: results[2].rows[i].characteristics_id,
          value: results[2].rows[i].valueavg
        }
      }
      res.send(response)
    })
    .catch((err) => console.log(err))
})

app.put('/reviews/report', (req, res) => {
  const { id } = req.body
  let sql =`UPDATE review SET reported = true WHERE id = ${id}`;

  db.query(sql)
    .then(() => res.send(200))
    .catch((err) => console.log(err))
})

app.put('/reviews/help', (req, res) => {
  const { id } = req.body
  let sql = `SELECT helpfulness FROM review WHERE id = ${id}`;

  let helpful;
  db.query(sql)
    .then((result) => {
      helpful = result.rows[0].helpfulness;
      helpful++;
      db.query(`UPDATE review SET helpfulness = ${helpful} WHERE id = ${id}`)
      .then(() => res.send(200))
      .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
})

app.post('/newReview/', (req, res) => {
  const {product_id, rating, summary, body, recommend, name, email, photos, characteristics} = req.body
  let date = new Date().toISOString;
  let sql = `INSERT INTO review (product_id, rating, date, summary, body, recommend, reviewer_name, reviewer_email)
    VALUES($1 $2 ${date} $3 $4 $5 $6 $7)`
  
    db.query(sql, [product_id, rating, summary, body, recommend, name, email])
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})

let express = require('express');
let db = require('./db')

let app = express();
let PORT = 3016 || process.env.PORT;

app.use(express.json())

app.get('/reviews/:product_id/:sort', (req, res) => {
  const { product_id, sort } = req.params;
  let sql;
  if (sort === 'newest') {
    sql = `SELECT r.*, p.url FROM (SELECT * FROM review WHERE product_id = ${product_id} AND reported = false ORDER BY date DESC limit 5) r LEFT OUTER JOIN photos p ON p.review_id = r.id`;
  } else if (sort === 'helpful') {
    sql = `SELECT r.*, p.url FROM (SELECT * FROM review WHERE product_id = ${product_id} AND reported = false ORDER BY helpfulness DESC limit 5) r LEFT OUTER JOIN photos p ON p.review_id = r.id`;
  } else if (sort === 'relevant') {
    sql = `SELECT r.*, p.url FROM (SELECT * FROM review WHERE product_id = ${product_id} AND reported = false ORDER BY helpfulness DESC, date DESC limit 5) r LEFT OUTER JOIN photos p ON p.review_id = r.id`;
  }

  function collapse (input) {
    const map = {}
      for (const row of input) {
        const existingRow = map[row.id]
        if (existingRow) {
          existingRow.urls.push(row.url)
          continue;
        }
        if (row.url === null) {
          row.urls = []
        } else {
          row.urls = [row.url]
        }
        map[row.id] = row
      }
      const arr = []
      for (const key in map) {
        arr.push(map[key])
      }
      return arr;
  }

  const response = {};

  db.query(sql)
    .then((results) => {
      response.results = results.rows;
      let photoArray;
      photoArray = collapse(response.results)
      response.results = photoArray

      for (const obj of response.results) {
        delete obj.url;
      }
      
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
    recommended: {
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
        response.recommended[results[1].rows[i].recommend] += 1;
      }
      response.recommended.true = response.recommended.true.toString();
      response.recommended.false = response.recommended.false.toString();

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
  const id = req.body.body.id
  let sql =`UPDATE review SET reported = true WHERE id = ${id}`;

  db.query(sql)
    .then(() => res.send(204))
    .catch((err) => console.log(err))
})

app.put('/reviews/help', (req, res) => {
  console.log(req.body)
  const id = req.body.body.id
  let sql = `SELECT helpfulness FROM review WHERE id = ${id}`;

  let helpful;
  db.query(sql)
    .then((result) => {
      helpful = result.rows[0].helpfulness;
      helpful++;
      db.query(`UPDATE review SET helpfulness = ${helpful} WHERE id = ${id}`)
      .then(() => res.send(204))
      .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
})

app.post('/newReview/', (req, res) => {
  const {product_id, rating, summary, body, recommend, name, email, characteristics} = req.body
  const newChar = {
    Quality: {
      id: 7,
      value: 4
    }
  };
  let sql = `INSERT INTO review (product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
    VALUES(($1), ($2), ($3), ($4), ($5), ($6), ($7), ($8), ($9), ($10), ($11))`
  
  let id;
  db.query(sql, [product_id, rating, new Date().toISOString(), summary, body, recommend, false, name, email, null, 0])
    .then(() => {
      let sqlRevId = `SELECT id FROM review WHERE product_id = ($1) AND body = ($2)`;
      db.query(sqlRevId, [product_id, body])
        .then((results) => {
          id = results.rows[0].id
          let charArray = Object.entries(newChar);
          charArray.forEach((characteristic) => {
            let sqlChar = `INSERT INTO characteristics (product_id, name) VALUES (($1), ($2))`;
            db.query(sqlChar, [product_id, characteristic[0]])
              .then(() => {
                let sqlCharId = `SELECT characteristics_id FROM characteristics WHERE product_id = ($1) AND name = ($2)`;
                return db.query(sqlCharId, [product_id, characteristic[0]])
              })
              .then((results) => {
                const charId = results.rows[0].characteristics_id
                let sqlCharRev =`INSERT INTO characteristics_reviews (characteristics_id, review_id, value) VALUES (($1), ($2), ($3))`;
                return db.query(sqlCharRev, [charId, id, characteristic[1].value])
              })
              .then(() => res.send(201))
              .catch((err) => console.log(err));
          })
        })
        .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
})

app.get('/loaderio-06119cad2ccc4f83ccf1de8c2c9d4ba2/', (req, res) => {
  res.send('loaderio-06119cad2ccc4f83ccf1de8c2c9d4ba2');
});


app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})

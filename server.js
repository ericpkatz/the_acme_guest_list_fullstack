const express = require('express');
const app = express();
const path = require('path');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_guest_list_db');

app.use(express.json());

app.get('/', (req, res, next)=> {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/styles.css', (req, res, next)=> {
  res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/api/guests', async(req, res, next)=> {
  try{
    const SQL = `
      SELECT id, name
      FROM guests
    `;
    const response = await client.query(SQL);
    res.send({
      data: response.rows
    });
  }
  catch(ex){
    next(ex);
  }
});

app.delete('/api/guests/:id', async(req, res, next)=> {
  try {
    const SQL = `
      DELETE FROM guests
      WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  }
  catch(ex){
    next(ex);
  }
});
app.post('/api/guests', async(req, res, next)=> {
  try {
    const SQL = `
      INSERT INTO guests(name) VALUES ($1) RETURNING *
    `;
    const response = await client.query(SQL, [req.body.name]);
    res.send({
      data: response.rows[0]
    });
  }
  catch(ex){
    next(ex);
  }
});

const init = async()=> {
  await client.connect();
  console.log('connected to database');
  let SQL = `
    DROP TABLE IF EXISTS guests;
    CREATE TABLE guests(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE
    );
  `;
  await client.query(SQL);
  console.log('created tables');
  SQL = `
      INSERT INTO guests(name) VALUES ('prof');
      INSERT INTO guests(name) VALUES ('daniel');
      INSERT INTO guests(name) VALUES ('joseph');
  `;
  await client.query(SQL);
  console.log('data seeded');

  const port = process.env.PORT || 3000;

  app.listen(port, ()=> console.log(`listening on port ${port}`));
}

init();
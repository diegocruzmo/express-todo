const express = require('express')
const app = express()
const Pool = require('pg').Pool
const path = require('path')
const ejs = require('ejs')
const PORT = 3000

require('dotenv').config()

const pool = new Pool({
  user: process.env.USER_NAME,
  host: process.env.HOST_NAME,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.PORT_NUMBER
})

pool.connect((err, client, release) => {
  if (err) {
    return console.log(err.message)
  }

  client.query('SELECT NOW()', (err, result) => {
    release()

    if (err) {
      return console.log(err.message)
    }

    console.log('Success connection!')
  })
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use('/static', express.static('static'))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'))

app.get('/', async (req, res) => {
  res.render('index')
})

app.get('/questions', async (req, res) => {
  const data = await pool.query('SELECT * FROM questions')
  res.render('show', { data: data.rows })
})

app.post('/addQuestion', async (req, res) => {
  const { name, email, question } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO questions (name, email, question) VALUES ($1, $2, $3) RETURNING *',
      [name, email, question]
    )
    console.log(result)
    res.redirect('/questions')
  } catch (error) {
    console.log(error.message)
  }
})

app.get('/edit/:id', async (req, res) => {
  const { id } = req.params
  try {
    const data = await pool.query('SELECT * FROM questions WHERE id = $1', [id])
    res.render('edit', { data: data.rows })
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

app.post('/edit/:id', async (req, res) => {
  const { id } = req.params
  const { name, email, question } = req.body
  try {
    await pool.query(
      'UPDATE questions SET name = $1, email = $2, question = $3 WHERE id = $4',
      [name, email, question, id]
    )
    res.redirect('/questions')
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

app.delete('/delete/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM questions WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

app.listen(PORT, () => {
  console.log('Server started...')
})

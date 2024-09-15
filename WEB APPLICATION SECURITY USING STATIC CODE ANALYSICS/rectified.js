
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet()); // Sets various HTTP headers for security
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Limits repeated requests

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to the database');
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length > 0) {
      res.send('Login successful');
    } else {
      res.send('Login failed');
    }
  });
});


app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  const query = 'SELECT * FROM products WHERE name LIKE ?';
  connection.query(query, [`%${searchTerm}%`], (err, results) => {
    if (err) return res.status(500).send('Database error');
    let response = '<h1>Search Results</h1>';
    results.forEach(product => {
      response += `<div>${escapeHtml(product.name)}</div>`;
    });
    res.send(response);
  });
});


app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let sampleFile = req.files.sampleFile;
  const validExtensions = ['.jpg', '.png', '.gif'];
  const fileExtension = path.extname(sampleFile.name).toLowerCase();

  if (!validExtensions.includes(fileExtension)) {
    return res.status(400).send('Invalid file type.');
  }

  sampleFile.mv(`/somewhere/on/your/server/${sampleFile.name}`, err => {
    if (err) return res.status(500).send(err);
    res.send('File uploaded!');
  });
});


app.post('/submit', (req, res) => {
  const { name, email } = req.body;
  res.send(`<p>Name: ${escapeHtml(name)}</p><p>Email: ${escapeHtml(email)}</p>`);
});


app.use(session({
  secret: generateSessionSecret(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies in production
}));

app.get('/set-session', (req, res) => {
  req.session.user = req.query.user;
  res.send('Session set');
});

app.get('/get-session', (req, res) => {
  res.send(`Session user: ${escapeHtml(req.session.user)}`);
});


function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function generateSessionSecret() {
  try {
    return crypto.randomBytes(64).toString('hex');
  } catch (err) {
    console.error('Error generating session secret:', err);
    process.exit(1);
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

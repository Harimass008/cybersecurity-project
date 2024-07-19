// Simple web server using Express
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'testdb'
});

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to the database');
});

// Vulnerable SQL query - susceptible to SQL Injection
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  connection.query(query, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.send('Login successful');
    } else {
      res.send('Login failed');
    }
  });
});

// Vulnerable to XSS - user input is not sanitized
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;
  connection.query(query, (err, results) => {
    if (err) throw err;
    let response = '<h1>Search Results</h1>';
    results.forEach(product => {
      response += `<div>${product.name}</div>`;
    });
    res.send(response);
  });
});

// Insecure file upload - no validation or sanitization
const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let sampleFile = req.files.sampleFile;
  sampleFile.mv('/somewhere/on/your/server/' + sampleFile.name, err => {
    if (err) return res.status(500).send(err);
    res.send('File uploaded!');
  });
});

// Insecure handling of user data - data is echoed back without proper sanitization
app.post('/submit', (req, res) => {
  const { name, email } = req.body;
  res.send(`<p>Name: ${name}</p><p>Email: ${email}</p>`);
});

// Insecure session management - session ID is predictable
const session = require('express-session');
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.get('/set-session', (req, res) => {
  req.session.user = req.query.user;
  res.send('Session set');
});

app.get('/get-session', (req, res) => {
  res.send(`Session user: ${req.session.user}`);
});

// Command Injection vulnerability
const { exec } = require('child_process');
app.post('/exec', (req, res) => {
  const command = req.body.command;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.send(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      res.send(`Stderr: ${stderr}`);
      return;
    }
    res.send(`Output: ${stdout}`);
  });
});

// Insecure use of eval
app.post('/eval', (req, res) => {
  const code = req.body.code;
  try {
    const result = eval(code);
    res.send(`Result: ${result}`);
  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

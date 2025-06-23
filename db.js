const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login_demo'
});

db.connect(err => {
  if (err) {
    console.error('❌ DB connection failed:', err);
    throw err;
  }
  console.log('✅ Connected to MySQL');
});

module.exports = db;

const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');


const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'trycoding06@gmail.com',       
    pass: 'lfhe ygoc jbab kdxi'       
  }
});


const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.sendFile(path.join(__dirname, '../view/unauthorized.html'));
};


router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../view/register.html'));
});


router.post('/register', (req, res) => {
  const { username, password, email, phone } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) throw err;
    if (result.length > 0) return res.send('User already exists.');

    db.query(
      'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
      [username, password, email, phone],
      (err2) => {
        if (err2) throw err2;

       
        const mailOptions = {
          from: 'trycoding06@gmail.com',
          to: email,
          subject: '🎉 Welcome to Our App!',
          html: `<h3>Hi ${username},</h3><p>Thanks for registering! We're glad to have you.</p>`
        };

        transport.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('❌ Email error:', err);
          } else {
            console.log('✅ Email sent:', info.response);
          }
          res.redirect('/login');
        });
      }
    );
  });
});


router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../view/login.html'));
});


router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.send('Invalid credentials.');
    
    req.session.user = username;
    res.sendFile(path.join(__dirname, '../view/dashboard.html'));
  });
});


router.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../view/dashboard.html'));
});


router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;

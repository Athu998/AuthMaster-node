const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const { format } = require('@fast-csv/format');

// 🔐 Middleware to protect admin routes
const isAdmin = (req, res, next) => {
  if (req.session.admin) return next();
  res.send('❌ Unauthorized <a href="/admin-login">Login</a>');
};

router.get('/admin-users', isAdmin, (req, res) => {
  db.query('SELECT id, username, email, phone FROM users', (err, result) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    res.json(result);
  });
});

// 🛡️ Admin login page
router.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../view/admin-login.html'));
});

// 🧾 Admin login handler
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM admin_users WHERE username = ? AND password = ?', [username, password], (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.send('❌ Invalid admin credentials.');
    req.session.admin = username;
    res.redirect('/admin-dashboard');
  });
});

// 📋 Admin dashboard - list all users
router.get('/admin-dashboard', isAdmin, (req, res) => {
  db.query('SELECT * FROM users', (err, users) => {
    if (err) throw err;

    let html = `
      <h2>👥 Registered Users</h2>
      <table border="1" cellpadding="5">
        <tr><th>ID</th><th>Username</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
    `;
    users.forEach(user => {
      html += `
        <tr>
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.email || ''}</td>
          <td>${user.phone || ''}</td>
          <td>
            <form style="display:inline;" method="POST" action="/admin-delete/${user.id}" onsubmit="return confirm('Are you sure?')">
              <button type="submit">❌ Delete</button>
            </form>
            <form style="display:inline;" method="GET" action="/admin-edit/${user.id}">
              <button type="submit">✏️ Edit</button>
            </form>
          </td>
        </tr>
      `;
    });
    html += `
      </table>
      <br>
      <a href="/download-users" style="background:#198754; color:#fff; padding:10px 20px; border-radius:5px; text-decoration:none;">⬇️ Download CSV</a>
      <br><br>
      <a href="/logout">🚪 Logout</a>
    `;
    res.send(html);
  });
});

// 🗑️ Delete user
router.post('/admin-delete/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  db.query('DELETE FROM users WHERE id = ?', [userId], err => {
    if (err) throw err;
    res.redirect('/admin-dashboard');
  });
});

// ✏️ Edit user form
router.get('/admin-edit/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.send('User not found');

    const user = result[0];
    res.send(`
      <h2>✏️ Edit User</h2>
      <form method="POST" action="/admin-update/${user.id}">
        <input type="text" name="username" value="${user.username}" required /><br>
        <input type="email" name="email" value="${user.email || ''}" required /><br>
        <input type="tel" name="phone" value="${user.phone || ''}" /><br>
        <input type="password" name="password" placeholder="New password (optional)" /><br>
        <button type="submit">✅ Update</button>
      </form>
      <br><a href="/admin-dashboard">⬅️ Back to Dashboard</a>
    `);
  });
});

// 💾 Update user handler
router.post('/admin-update/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  const { username, email, phone, password } = req.body;

  if (password) {
    db.query(
      'UPDATE users SET username = ?, email = ?, phone = ?, password = ? WHERE id = ?',
      [username, email, phone, password, userId],
      err => {
        if (err) throw err;
        res.redirect('/admin-dashboard');
      }
    );
  } else {
    db.query(
      'UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?',
      [username, email, phone, userId],
      err => {
        if (err) throw err;
        res.redirect('/admin-dashboard');
      }
    );
  }
});

// 📥 Download users as CSV
router.get('/download-users', isAdmin, (req, res) => {
  db.query('SELECT id, username, email, phone FROM users', (err, users) => {
    if (err) throw err;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);
    users.forEach(user => csvStream.write(user));
    csvStream.end();
  });
});

module.exports = router;

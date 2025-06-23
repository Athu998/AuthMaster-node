const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// DB Connection
const db = require('./db'); // Ensure this file contains mysql2 connection and exports it

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'auth_secret',
  resave: false,
  saveUninitialized: true
}));

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/', userRoutes);
app.use('/', adminRoutes);

// ✅ Default route to redirect user to login
app.get('/', (req, res) => {
  res.redirect('/login'); // or use /register or custom homepage
});

// Server Start
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

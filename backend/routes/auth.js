const express = require('express');
const jwt = require('jsonwebtoken');
const { getSheetData } = require('../utils/sheets');
const router = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    const users = await getSheetData('DATA_USER', 'A2:C');
    const user = users.find(row => 
      String(row[0] || '').trim() === cleanUsername && 
      String(row[1] || '').trim() === cleanPassword
    );

    if (!user) {
      console.warn(`[Login Failed] Percobaan login gagal untuk username: "${cleanUsername}"`);
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { username: user[0], role: user[2] },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: { username: user[0], role: user[2] },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Gagal login: ' + error.message });
  }
});

// GET /api/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;

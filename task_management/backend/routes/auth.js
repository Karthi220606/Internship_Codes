const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const dbService = require('../services/dbService');

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#2dd4bf', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser = await dbService.addUser({
      name,
      email,
      password: hashedPassword,
      avatar: randomColor
    });

    const payload = {
      user: {
        id: newUser._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretkeyfortaskmanager123!',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: newUser });
      }
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user._id
      }
    };

    const { password: _, ...userWithoutPassword } = user;

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretkeyfortaskmanager123!',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: userWithoutPassword });
      }
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', auth, async (req, res) => {
  try {
    const user = await dbService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

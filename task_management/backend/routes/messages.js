const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

// @route   POST /api/messages
// @desc    Submit a contact form message
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All form fields are required' });
  }

  try {
    const newMessage = await dbService.addMessage({
      name,
      email,
      subject,
      message
    });
    res.status(201).json({ success: true, message: 'Message sent successfully!', data: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/messages
// @desc    Get all messages (for admin dashboard review)
router.get('/', async (req, res) => {
  try {
    const messages = await dbService.getMessages();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const chatbotController = require('../controller/chatbotController');
const authenticateToken = require('../middlewares/authenticateToken');

// POST /api/chatbot/message - Normal (non-streaming)
router.post('/message', authenticateToken, chatbotController.handleMessage);

// POST /api/chatbot/stream - Streaming
router.post('/stream', authenticateToken, chatbotController.handleStreamingMessage);

module.exports = router;



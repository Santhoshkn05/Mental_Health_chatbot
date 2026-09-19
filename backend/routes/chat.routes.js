const express = require('express');

function createChatRoutes(chatController, authenticateToken) {
  const router = express.Router();

  router.post('/chats', authenticateToken, chatController.sendChat);
  router.get('/chats', authenticateToken, chatController.getChatHistory);
  router.delete('/chats/:sessionId', authenticateToken, chatController.deleteSession);

  return router;
}

module.exports = createChatRoutes;

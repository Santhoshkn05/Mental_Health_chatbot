function createChatRepository(pool) {
  return {
    saveUserMessage(userId, sessionId, message) {
      return pool.execute(
        `INSERT INTO chats (user_id, session_id, role, message) VALUES (?, ?, ?, ?)`,
        [userId, sessionId, 'user', message]
      );
    },

    getRecentSessionMessages(userId, sessionId) {
      return pool.execute(
        `SELECT role, message FROM chats WHERE user_id = ? AND session_id = ? ORDER BY timestamp DESC LIMIT 10`,
        [userId, sessionId]
      );
    },

    saveBotMessage(userId, sessionId, botReply, emotion, riskLevel, riskScore, status) {
      return pool.execute(
        `INSERT INTO chats (user_id, session_id, role, message, emotion, risk_level, risk_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, sessionId, 'bot', botReply, emotion, riskLevel, riskScore, status]
      );
    },

    getUserChats(userId) {
      return pool.execute(
        `SELECT * FROM chats WHERE user_id = ? ORDER BY timestamp ASC`,
        [userId]
      );
    },

    countSessionMessages(userId, sessionId) {
      return pool.execute(
        `SELECT COUNT(*) as cnt FROM chats WHERE user_id = ? AND session_id = ?`,
        [userId, sessionId]
      );
    },

    deleteSession(userId, sessionId) {
      return pool.execute(
        `DELETE FROM chats WHERE user_id = ? AND session_id = ?`,
        [userId, sessionId]
      );
    }
  };
}

module.exports = createChatRepository;

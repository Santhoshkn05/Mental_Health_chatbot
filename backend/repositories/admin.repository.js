function createAdminRepository(pool) {
  return {
    findByUsername(username) {
      return pool.execute(
        `SELECT * FROM admin_users WHERE username = ?`,
        [username]
      );
    },

    getLogs() {
      return pool.execute(`
        SELECT 
          bot.id,
          bot.user_id,
          user_msg.message as user_message,
          bot.message as ai_response,
          bot.emotion,
          bot.risk_level,
          bot.risk_score,
          bot.status,
          bot.timestamp,
          u.name as user_name
        FROM chats bot
        LEFT JOIN users u ON bot.user_id = u.id
        LEFT JOIN chats user_msg ON bot.session_id = user_msg.session_id 
          AND user_msg.role = 'user'
          AND user_msg.timestamp = (
            SELECT MAX(timestamp) 
            FROM chats 
            WHERE session_id = bot.session_id 
            AND role = 'user' 
            AND timestamp < bot.timestamp
          )
        WHERE bot.role = 'bot'
        ORDER BY bot.timestamp DESC
      `);
    },

    updateStatus(chatId, status) {
      return pool.execute(
        `UPDATE chats SET status = ? WHERE id = ?`,
        [status, chatId]
      );
    }
  };
}

module.exports = createAdminRepository;

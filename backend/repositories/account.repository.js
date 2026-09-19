function createAccountRepository(pool) {
  return {
    deleteUserChats(userId) {
      return pool.execute(`DELETE FROM chats WHERE user_id = ?`, [userId]);
    },

    deleteUser(userId) {
      return pool.execute(`DELETE FROM users WHERE id = ?`, [userId]);
    }
  };
}

module.exports = createAccountRepository;

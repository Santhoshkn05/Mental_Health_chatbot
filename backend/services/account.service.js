function createAccountService(accountRepository) {
  return {
    async deleteAccount(req, res) {
      const userId = req.user.id;
      
      try {
        // First delete all user's chat history
        await accountRepository.deleteUserChats(userId);
        
        // Then delete the user account
        await accountRepository.deleteUser(userId);
        
        res.json({ message: "Account deleted successfully" });
      } catch (err) {
        console.error('Delete account error:', err);
        res.status(500).json({ error: "Failed to delete account" });
      }
    }
  };
}

module.exports = createAccountService;

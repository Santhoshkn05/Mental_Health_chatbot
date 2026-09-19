function createChatController(chatService) {
  return {
    sendChat(req, res) {
      return chatService.sendChat(req, res);
    },

    getChatHistory(req, res) {
      return chatService.getChatHistory(req, res);
    },

    deleteSession(req, res) {
      return chatService.deleteSession(req, res);
    }
  };
}

module.exports = createChatController;

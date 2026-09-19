function createAccountController(accountService) {
  return {
    deleteAccount(req, res) {
      return accountService.deleteAccount(req, res);
    }
  };
}

module.exports = createAccountController;

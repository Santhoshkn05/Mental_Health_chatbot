const express = require('express');

function createAccountRoutes(accountController, authenticateToken) {
  const router = express.Router();

  router.delete('/delete-account', authenticateToken, accountController.deleteAccount);

  return router;
}

module.exports = createAccountRoutes;

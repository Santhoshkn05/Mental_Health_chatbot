const express = require('express');

function createAdminRoutes(adminController, authenticateAdmin) {
  const router = express.Router();

  router.post('/admin/login', adminController.login);
  router.get('/admin/logs', authenticateAdmin, adminController.getLogs);
  router.post('/admin/update-status', authenticateAdmin, adminController.updateStatus);

  return router;
}

module.exports = createAdminRoutes;

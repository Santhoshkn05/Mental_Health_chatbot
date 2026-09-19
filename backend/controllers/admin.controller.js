function createAdminController(adminService) {
  return {
    login(req, res) {
      return adminService.login(req, res);
    },

    getLogs(req, res) {
      return adminService.getLogs(req, res);
    },

    updateStatus(req, res) {
      return adminService.updateStatus(req, res);
    }
  };
}

module.exports = createAdminController;

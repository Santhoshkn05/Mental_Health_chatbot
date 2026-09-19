function createAuthController(authService) {

  return {

    register(req, res) {
      return authService.register(req, res);
    },

    checkEmailVerification(req, res) {
      return authService.checkEmailVerification(req, res);
    },

    sendVerification(req, res) {
      return authService.sendVerification(req, res);
    },

    login(req, res) {
      return authService.login(req, res);
    },

    forgotPassword(req, res) {
      return authService.forgotPassword(req, res);
    },

    verifyOtp(req, res) {
      return authService.verifyOtp(req, res);
    },

    resetPassword(req, res) {
      return authService.resetPassword(req, res);
    },

    verifyEmail(req, res) {
      return authService.verifyEmail(req, res);
    }

  };
}

module.exports = createAuthController;
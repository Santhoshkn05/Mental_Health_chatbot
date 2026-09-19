const express = require('express');

function createAuthRoutes(authController) {
  const router = express.Router();

  router.post('/register', authController.register);
  router.get('/check-email-verification', authController.checkEmailVerification);
  router.post('/send-verification', authController.sendVerification);
  router.post('/login', authController.login);
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/verify-otp', authController.verifyOtp);
  router.post('/reset-password', authController.resetPassword);
  router.get('/verify-email', authController.verifyEmail);

  return router;
} 

module.exports = createAuthRoutes;

const express = require('express');
const { validateBody } = require('../../middleware/validate');
const {
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../../validators/auth/customerAuth.validator');

function createCustomerAuthRoutes(controller, middleware) {
  const router = express.Router();

  router.post('/send-phone-otp', validateBody(sendPhoneOtpSchema), controller.sendPhoneOtp);
  router.post('/verify-phone-otp', validateBody(verifyPhoneOtpSchema), controller.verifyPhoneOtp);
  router.post('/send-email-otp', validateBody(sendEmailOtpSchema), controller.sendEmailOtp);
  router.post('/verify-email-otp', validateBody(verifyEmailOtpSchema), controller.verifyEmailOtp);
  router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh);
  router.post('/logout', middleware.authenticateCustomer(), validateBody(logoutSchema), controller.logout);

  return router;
}

module.exports = {
  createCustomerAuthRoutes,
};

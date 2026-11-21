const express = require('express');
const { validateBody } = require('../../middleware/validate');
const {
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  registerStartSchema,
  registerVerifySchema,
  registerResendSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../../validators/auth/customerAuth.validator');

function createCustomerAuthRoutes(controller, middleware) {
  const router = express.Router();

  router.post('/send-phone-otp', validateBody(sendPhoneOtpSchema), controller.sendPhoneOtp);
  router.post('/verify-phone-otp', validateBody(verifyPhoneOtpSchema), controller.verifyPhoneOtp);
  router.post('/send-email-otp', validateBody(sendEmailOtpSchema), controller.sendEmailOtp);
  router.post('/verify-email-otp', validateBody(verifyEmailOtpSchema), controller.verifyEmailOtp);
  // AUTH-1/2: one account, two verified identities (mobile OTP, then email OTP).
  router.post('/register/start', validateBody(registerStartSchema), controller.registerStart);
  router.post('/register/verify-phone', validateBody(registerVerifySchema), controller.registerVerifyPhone);
  router.post('/register/verify-email', validateBody(registerVerifySchema), controller.registerVerifyEmail);
  router.post('/register/resend', validateBody(registerResendSchema), controller.registerResend);
  router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh);
  router.post('/logout', middleware.authenticateCustomer(), validateBody(logoutSchema), controller.logout);
  router.post('/logout-all', middleware.authenticateCustomer(), controller.logoutAll);

  return router;
}

module.exports = {
  createCustomerAuthRoutes,
};

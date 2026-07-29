const express = require('express');
const { validateBody } = require('../../middleware/validate');
const {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../../validators/auth/deliveryAuth.validator');

function createDeliveryAuthRoutes(controller, middleware) {
  const router = express.Router();

  router.post('/send-otp', validateBody(sendOtpSchema), controller.sendOtp);
  router.post('/verify-otp', validateBody(verifyOtpSchema), controller.verifyOtp);
  router.post('/signup', validateBody(signupSchema), controller.signup);
  router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh);
  router.post('/logout', middleware.authenticateDelivery(), validateBody(logoutSchema), controller.logout);

  return router;
}

module.exports = {
  createDeliveryAuthRoutes,
};

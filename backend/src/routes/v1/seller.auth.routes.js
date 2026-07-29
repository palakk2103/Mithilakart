const express = require('express');
const { validateBody } = require('../../middleware/validate');
const {
  sellerLoginSchema,
  sellerSendPhoneOtpSchema,
  sellerRegisterSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../../validators/auth/sellerAuth.validator');

function createSellerAuthRoutes(controller, middleware) {
  const router = express.Router();

  router.post('/send-phone-otp', validateBody(sellerSendPhoneOtpSchema), controller.sendPhoneOtp);
  router.post('/register', validateBody(sellerRegisterSchema), controller.register);
  router.post('/login', validateBody(sellerLoginSchema), controller.login);
  router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh);
  router.post('/logout', middleware.authenticateSeller(), validateBody(logoutSchema), controller.logout);

  return router;
}

module.exports = {
  createSellerAuthRoutes,
};

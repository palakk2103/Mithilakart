const express = require('express');
const { validateBody } = require('../../middleware/validate');
const { initiatePaymentSchema, verifyPaymentSchema } = require('../../validators/payments/payments.validator');

function createPaymentsRoutes(paymentController, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer();

  router.post('/payments/initiate', authCustomer, validateBody(initiatePaymentSchema), paymentController.initiatePayment);
  router.post('/payments/verify', authCustomer, validateBody(verifyPaymentSchema), paymentController.verifyPayment);

  router.post('/webhooks/razorpay', paymentController.razorpayWebhook);

  return router;
}

module.exports = {
  createPaymentsRoutes,
};


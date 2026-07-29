const express = require('express');
const Joi = require('joi');
const { validateBody, validateParams } = require('../../middleware/validate');
const { objectIdSchema } = require('../../validators/common.validator');
const { profileUpdateSchema, addressSchema, paymentMethodSchema } = require('../../validators/user/user.validator');

function createUsersRoutes(controllers, middleware) {
  const router = express.Router();
  const authCustomer = middleware.authenticateCustomer();
  const {
    userProfileController,
    addressController,
    paymentMethodController,
    walletController,
    wishlistController,
    reviewController,
    qnaController,
    couponController,
    notificationController,
    returnController,
  } = controllers;

  router.get('/me', authCustomer, userProfileController.getMe);
  router.put('/me', authCustomer, validateBody(profileUpdateSchema), userProfileController.updateMe);

  router.get('/me/addresses', authCustomer, addressController.list);
  router.post('/me/addresses', authCustomer, validateBody(addressSchema), addressController.create);
  router.put('/me/addresses/:id', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), validateBody(addressSchema), addressController.update);
  router.delete('/me/addresses/:id', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), addressController.remove);
  router.patch('/me/addresses/:id/default', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), addressController.setDefault);

  router.get('/me/cards', authCustomer, paymentMethodController.list);
  router.post('/me/cards', authCustomer, validateBody(paymentMethodSchema), paymentMethodController.create);
  router.put('/me/cards/:id', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), validateBody(paymentMethodSchema), paymentMethodController.update);
  router.delete('/me/cards/:id', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), paymentMethodController.remove);
  router.patch('/me/cards/:id/default', authCustomer, validateParams(Joi.object({ id: objectIdSchema })), paymentMethodController.setDefault);

  router.get('/me/wallet', authCustomer, walletController.getWallet);
  router.get('/me/wallet/transactions', authCustomer, walletController.listTransactions);

  router.get('/me/returns', authCustomer, returnController.listReturns);

  router.get('/me/wishlist', authCustomer, wishlistController.list);
  router.post('/me/wishlist', authCustomer, validateBody(Joi.object({ productId: objectIdSchema.required() })), wishlistController.add);
  router.delete('/me/wishlist/:productId', authCustomer, validateParams(Joi.object({ productId: objectIdSchema })), wishlistController.remove);

  router.get('/me/reviews', authCustomer, reviewController.listMine);
  router.get('/me/questions', authCustomer, qnaController.listMine);
  router.get('/me/coupons', authCustomer, couponController.listMine);
  router.put('/me/notification-preferences', authCustomer, validateBody(Joi.object({
    orderUpdates: Joi.boolean().optional(),
    promotions: Joi.boolean().optional(),
    pushEnabled: Joi.boolean().optional(),
    smsEnabled: Joi.boolean().optional(),
    emailEnabled: Joi.boolean().optional(),
  })), notificationController.updatePreferences);

  return router;
}

module.exports = { createUsersRoutes };

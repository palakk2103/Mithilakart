const express = require('express');
const { validateBody } = require('../../middleware/validate');
const {
  adminLoginSchema,
  adminChangePasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../../validators/auth/adminAuth.validator');

function createAdminAuthRoutes(controller, middleware) {
  const router = express.Router();

  router.post('/login', validateBody(adminLoginSchema), controller.login);
  router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh);
  router.get('/profile', middleware.authenticateAdmin(), controller.profile);
  router.put('/password', middleware.authenticateAdmin(), validateBody(adminChangePasswordSchema), controller.changePassword);
  router.post('/logout', middleware.authenticateAdmin(), validateBody(logoutSchema), controller.logout);

  return router;
}

module.exports = {
  createAdminAuthRoutes,
};

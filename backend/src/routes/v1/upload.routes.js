const express = require('express');
const multer = require('multer');
const { validateBody } = require('../../middleware/validate');
const { presignSchema, confirmUploadSchema } = require('../../validators/cms/cms.validator');

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function createUploadRoutes(controller, middleware) {
  const router = express.Router();

  router.post('/presign', middleware.authenticateCustomer({ optional: true }), validateBody(presignSchema), controller.presign);
  router.post('/confirm', middleware.authenticateCustomer({ optional: true }), validateBody(confirmUploadSchema), controller.confirm);
  router.post(
    '/local/:storageKey(*)',
    memoryUpload.single('file'),
    controller.uploadLocal
  );

  return router;
}

module.exports = {
  createUploadRoutes,
};

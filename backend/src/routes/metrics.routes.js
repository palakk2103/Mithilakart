const express = require('express');
const config = require('../config');
const { getMetricsPayload, getMetricsContentType } = require('../middleware/metrics');

const router = express.Router();

router.get('/metrics', async (req, res, next) => {
  if (!config.metrics.enabled) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Metrics disabled' } });
  }

  try {
    res.set('Content-Type', getMetricsContentType());
    res.end(await getMetricsPayload());
  } catch (error) {
    next(error);
  }
});

module.exports = router;

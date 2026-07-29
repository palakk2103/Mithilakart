const express = require('express');
const { HealthService } = require('../services/HealthService');
const { HealthController } = require('../controllers/HealthController');

const healthService = new HealthService();
const healthController = new HealthController(healthService);

const router = express.Router();

router.get('/health', healthController.getHealth);
router.get('/ready', healthController.getReadiness);

module.exports = router;

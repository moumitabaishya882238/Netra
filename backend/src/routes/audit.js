const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/logs', getAuditLogs);

module.exports = router;

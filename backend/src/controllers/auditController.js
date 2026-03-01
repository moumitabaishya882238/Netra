const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// @desc    Get audit logs for a hospital
// @route   GET /api/v1/audit/logs
// @access  Private
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({ hospital: req.hospital.id })
            .sort('-createdAt')
            .limit(50); // Fetch last 50 entries

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
        });
    } catch (err) {
        logger.error(`Get Audit Logs Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

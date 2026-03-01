const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Create an audit log entry
 * @param {string} hospitalId - ID of the hospital
 * @param {string} action - Action performed (from AuditLog enum)
 * @param {string} entityType - Type of entity affected
 * @param {string} entityId - ID of the entity affected
 * @param {object} details - Additional details (optional)
 */
const createAuditLog = async (hospitalId, action, entityType, entityId, details = {}) => {
    try {
        await AuditLog.create({
            hospital: hospitalId,
            action,
            entityType,
            entityId,
            details
        });
    } catch (err) {
        logger.error(`Audit Log Error: ${err.message}`);
        // We don't want to throw here and break the main request flow,
        // but we log it for backend visibility.
    }
};

module.exports = createAuditLog;

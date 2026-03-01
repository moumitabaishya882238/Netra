const Resource = require('../models/Resource');
const logger = require('../utils/logger');
const { getIO } = require('../utils/socket');
const createAuditLog = require('../utils/auditLogger');

// @desc    Get all resources for a hospital
// @route   GET /api/v1/resources
// @access  Private
exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find({ hospital: req.hospital.id }).sort('category');

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources,
        });
    } catch (err) {
        logger.error(`Get Resources Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add a new resource
// @route   POST /api/v1/resources
// @access  Private
exports.addResource = async (req, res) => {
    try {
        req.body.hospital = req.hospital.id;

        const resource = await Resource.create(req.body);

        // Audit Log
        await createAuditLog(req.hospital.id, 'STOCK_ADDED', 'Resource', resource._id, {
            name: resource.name,
            quantity: resource.quantity,
            unit: resource.unit
        });

        // Emit real-time update
        getIO().to(req.hospital.id).emit('resourceUpdate');

        res.status(201).json({
            success: true,
            data: resource,
        });
    } catch (err) {
        logger.error(`Add Resource Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update resource quantity
// @route   PUT /api/v1/resources/:id
// @access  Private
exports.updateResource = async (req, res) => {
    try {
        let resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        if (resource.hospital.toString() !== req.hospital.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const oldQuantity = resource.quantity;
        // We only allow updating quantity and threshold via this simple endpoint for now
        const { quantity, minThreshold } = req.body;

        if (quantity !== undefined) resource.quantity = quantity;
        if (minThreshold !== undefined) resource.minThreshold = minThreshold;

        await resource.save();

        // Audit Log
        if (quantity !== undefined) {
            await createAuditLog(req.hospital.id, 'STOCK_UPDATED', 'Resource', resource._id, {
                name: resource.name,
                oldQuantity,
                newQuantity: resource.quantity,
                unit: resource.unit
            });
        }

        // Emit real-time update
        getIO().to(req.hospital.id).emit('resourceUpdate', {
            resourceId: resource._id,
            lowStock: resource.quantity <= resource.minThreshold
        });

        res.status(200).json({
            success: true,
            data: resource,
        });
    } catch (err) {
        logger.error(`Update Resource Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete a resource
// @route   DELETE /api/v1/resources/:id
// @access  Private
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        if (resource.hospital.toString() !== req.hospital.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await resource.deleteOne();

        // Audit Log
        await createAuditLog(req.hospital.id, 'STOCK_DELETED', 'Resource', resource._id, { name: resource.name });

        // Emit real-time update
        getIO().to(req.hospital.id).emit('resourceUpdate');

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        logger.error(`Delete Resource Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

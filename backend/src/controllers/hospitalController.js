const Hospital = require('../models/Hospital');
const logger = require('../utils/logger');
const { getIO } = require('../utils/socket');

// @desc    Get current hospital profile
// @route   GET /api/v1/hospitals/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    const hospital = await Hospital.findById(req.hospital.id);

    res.status(200).json({
        success: true,
        data: hospital,
    });
};

// @desc    Update hospital profile
// @route   PUT /api/v1/hospitals/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    const {
        name,
        address,
        city,
        state,
        pincode,
        contactNumber,
        adminName,
        latitude,
        longitude,
        infrastructure
    } = req.body;

    const fieldsToUpdate = {
        name,
        address,
        city,
        state,
        pincode,
        contactNumber,
        adminName,
        infrastructure
    };

    // Handle location if coordinates are provided
    if (latitude !== undefined && longitude !== undefined) {
        fieldsToUpdate.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    }

    try {
        const hospital = await Hospital.findByIdAndUpdate(
            req.hospital.id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true,
            }
        );

        // Emit real-time update
        getIO().to(req.hospital.id).emit('infraUpdate', { hospital });

        res.status(200).json({
            success: true,
            data: hospital,
        });
    } catch (err) {
        logger.error(`Profile Update Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};
// @desc    Update hospital infrastructure
// @route   PUT /api/v1/hospitals/infrastructure
// @access  Private
exports.updateInfrastructure = async (req, res, next) => {
    try {
        const hospital = await Hospital.findById(req.hospital.id);

        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        if (!req.body.infrastructure) {
            return res.status(400).json({ success: false, message: 'Please provide infrastructure data' });
        }

        // Deep merge or replace infrastructure
        hospital.infrastructure = {
            ...hospital.infrastructure,
            ...req.body.infrastructure
        };

        // Explicitly mark infrastructure as modified for Mongoose to detect deep changes
        hospital.markModified('infrastructure');
        await hospital.save();

        // Emit real-time update
        getIO().to(req.hospital.id).emit('infraUpdate', { hospital });

        res.status(200).json({
            success: true,
            data: hospital,
        });
    } catch (err) {
        logger.error(`Infrastructure Update Error: ${err.message}`);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to update infrastructure'
        });
    }
};
// @desc    Get all hospitals' location and status
// @route   GET /api/v1/hospitals/map
// @access  Private
exports.getAllHospitals = async (req, res, next) => {
    try {
        const hospitals = await Hospital.find({}, 'name address city location contactNumber infrastructure');

        res.status(200).json({
            success: true,
            data: hospitals,
        });
    } catch (err) {
        logger.error(`Get All Hospitals Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

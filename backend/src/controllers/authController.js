const Hospital = require('../models/Hospital');
const logger = require('../utils/logger');
const { generateRegistrationId } = require('../utils/idGenerator');

// @desc    Initialize registration (Step 1)
// @route   POST /api/v1/auth/register/init
// @access  Public
exports.registerInit = async (req, res, next) => {
    const { name, email } = req.body;

    try {
        // Check if email already exists
        const existingHospital = await Hospital.findOne({ email });
        if (existingHospital) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Generate Registration ID
        const registrationId = generateRegistrationId();

        // Log it (mocking email send)
        logger.info(`[REGISTRATION] New ID generated for ${name}: ${registrationId}`);

        res.status(200).json({
            success: true,
            data: {
                registrationId,
                name,
                email
            },
            message: 'Initial info verified. Please save your Registration ID.'
        });
    } catch (err) {
        logger.error(`Registration Init Error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Register hospital (Final Step)
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    const {
        name,
        email,
        password,
        registrationId,
        adminName,
        contactNumber,
        address,
        city,
        state,
        pincode,
        location,
        infrastructure
    } = req.body;

    try {
        // Create hospital
        const hospital = await Hospital.create({
            name,
            email,
            password,
            registrationId,
            adminName,
            contactNumber,
            address,
            city,
            state,
            pincode,
            location,
            infrastructure
        });

        sendTokenResponse(hospital, 201, res);
    } catch (err) {
        logger.error(`Registration Error: ${err.message}`);
        // Handle duplicate key
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Registration ID or Email already exists' });
        }
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Login hospital
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    const { registrationId, password } = req.body;

    // Validate registrationId & password
    if (!registrationId || !password) {
        return res.status(400).json({ success: false, message: 'Please provide registration ID and password' });
    }

    try {
        // Check for hospital
        const hospital = await Hospital.findOne({ registrationId }).select('+password');

        if (!hospital) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await hospital.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(hospital, 200, res);
    } catch (err) {
        logger.error(`Login Error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get current logged in hospital
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    const hospital = await Hospital.findById(req.hospital.id);

    res.status(200).json({
        success: true,
        data: hospital,
    });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (hospital, statusCode, res) => {
    // Create token
    const token = hospital.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
    });
};

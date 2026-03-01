const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const logger = require('../utils/logger');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.hospital = await Hospital.findById(decoded.id);

        next();
    } catch (err) {
        logger.error(`Auth Error: ${err.message}`);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.hospital.role)) {
            return res.status(403).json({
                success: false,
                message: `Hospital role ${req.hospital.role} is not authorized to access this route`,
            });
        }
        next();
    };
};

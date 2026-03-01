const Doctor = require('../models/Doctor');
const logger = require('../utils/logger');
const { getIO } = require('../utils/socket');
const createAuditLog = require('../utils/auditLogger');

// @desc    Add a new doctor
// @route   POST /api/v1/doctors
// @access  Private (Hospital)
exports.addDoctor = async (req, res) => {
    try {
        req.body.hospital = req.hospital.id;

        const doctor = await Doctor.create(req.body);

        // Audit Log
        await createAuditLog(req.hospital.id, 'DOCTOR_ADDED', 'Doctor', doctor._id, { name: doctor.name });

        // Emit real-time update
        getIO().to(req.hospital.id).emit('doctorUpdate');

        res.status(201).json({
            success: true,
            data: doctor,
        });
    } catch (err) {
        logger.error(`Add Doctor Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all doctors for a hospital
// @route   GET /api/v1/doctors
// @access  Private (Hospital)
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ hospital: req.hospital.id });

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors,
        });
    } catch (err) {
        logger.error(`Get Doctors Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

const mongoose = require('mongoose');

// @desc    Update doctor status
// @route   PUT /api/v1/doctors/:id/status
// @access  Private (Hospital)
exports.updateDoctorStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid Doctor ID format' });
        }

        let doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Make sure doctor belongs to hospital
        if (doctor.hospital.toString() !== req.hospital.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const oldStatus = doctor.status;
        doctor.status = req.body.status;
        await doctor.save();

        // Audit Log
        await createAuditLog(req.hospital.id, 'DOCTOR_STATUS_UPDATED', 'Doctor', doctor._id, {
            name: doctor.name,
            oldStatus,
            newStatus: doctor.status
        });

        // Emit real-time update
        getIO().to(req.hospital.id).emit('doctorUpdate');

        res.status(200).json({
            success: true,
            data: doctor,
        });
    } catch (err) {
        logger.error(`Update Doctor Status Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete doctor
// @route   DELETE /api/v1/doctors/:id
// @access  Private (Hospital)
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Make sure doctor belongs to hospital
        if (doctor.hospital.toString() !== req.hospital.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await doctor.deleteOne();

        // Audit Log
        await createAuditLog(req.hospital.id, 'DOCTOR_DELETED', 'Doctor', doctor._id, { name: doctor.name });

        // Emit real-time update
        getIO().to(req.hospital.id).emit('doctorUpdate');

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        logger.error(`Delete Doctor Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

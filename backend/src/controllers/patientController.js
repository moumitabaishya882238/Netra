const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const logger = require('../utils/logger');
const { getIO } = require('../utils/socket');
const createAuditLog = require('../utils/auditLogger');

// @desc    Admit a patient (updates bed counts)
// @route   POST /api/v1/patients
// @access  Private (Hospital)
exports.admitPatient = async (req, res) => {
    try {
        const { patientName, age, emergencyType, bedType } = req.body;
        const hospitalId = req.hospital.id;

        // 1. Fetch hospital first for descriptive error and debugging
        const hospitalCheck = await Hospital.findById(hospitalId);

        if (!hospitalCheck) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Log current state for debugging
        logger.info(`Admission attempt: Hospital ${hospitalId}, BedType ${bedType}, Available: ${hospitalCheck.infrastructure?.[bedType]?.available}`);

        if (!hospitalCheck.infrastructure?.[bedType] || hospitalCheck.infrastructure[bedType].available <= 0) {
            return res.status(400).json({
                success: false,
                message: `No available ${bedType.toUpperCase()} capacity. Current: ${hospitalCheck.infrastructure?.[bedType]?.available || 0}`
            });
        }

        // 2. Perform atomic decrement
        const query = {
            _id: hospitalId,
        };
        query[`infrastructure.${bedType}.available`] = { $gt: 0 };

        const update = {
            $inc: {}
        };
        update.$inc[`infrastructure.${bedType}.available`] = -1;

        const hospital = await Hospital.findOneAndUpdate(query, update, { new: true });

        if (!hospital) {
            // This would only happen if someone else took the last bed between the check and the update
            return res.status(400).json({
                success: false,
                message: `Concurrent admission occurred or capacity just reached zero. Please try again.`
            });
        }

        // 2. Create Patient record
        const patient = await Patient.create({
            hospital: hospitalId,
            patientName,
            age,
            emergencyType,
            bedType,
            status: 'Admitted'
        });

        // Audit Log
        await createAuditLog(hospitalId, 'PATIENT_ADMITTED', 'Patient', patient._id, {
            name: patient.patientName,
            bedType
        });

        // Emit real-time update
        getIO().to(hospitalId).emit('patientUpdate');
        getIO().to(hospitalId).emit('infraUpdate', { hospital });

        res.status(201).json({
            success: true,
            data: patient
        });
    } catch (err) {
        logger.error(`Admission Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all admitted patients for a hospital
// @route   GET /api/v1/patients
// @access  Private (Hospital)
exports.getPatients = async (req, res) => {
    try {
        const patients = await Patient.find({
            hospital: req.hospital.id,
            status: 'Admitted'
        }).sort('-admittedAt');

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });
    } catch (err) {
        logger.error(`Get Patients Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Discharge a patient (updates bed counts)
// @route   PUT /api/v1/patients/:id/discharge
// @access  Private (Hospital)
exports.dischargePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        if (patient.hospital.toString() !== req.hospital.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (patient.status === 'Discharged') {
            return res.status(400).json({ success: false, message: 'Patient already discharged' });
        }

        // 1. Update status
        patient.status = 'Discharged';
        patient.dischargedAt = Date.now();
        await patient.save();

        // 2. Increment available count atomically
        // We add a safety check to ensure available doesn't exceed total (though it shouldn't in normal flow)
        const hospital = await Hospital.findOneAndUpdate(
            {
                _id: req.hospital.id,
                [`infrastructure.${patient.bedType}.available`]: { $lt: 99999 } // Placeholder for "less than total"
            },
            { $inc: { [`infrastructure.${patient.bedType}.available`]: 1 } },
            { new: true }
        );

        // If for some reason the hospital wasn't found or validation failed, 
        // fallback to a simple update but log it
        if (!hospital) {
            logger.warn(`Discharge sync issue for hospital ${req.hospital.id}`);
            await Hospital.findByIdAndUpdate(req.hospital.id, {
                $inc: { [`infrastructure.${patient.bedType}.available`]: 1 }
            });
        }

        // Audit Log
        await createAuditLog(req.hospital.id, 'PATIENT_DISCHARGED', 'Patient', patient._id, {
            name: patient.patientName,
            bedType: patient.bedType
        });

        // Emit real-time update
        getIO().to(req.hospital.id).emit('patientUpdate');
        getIO().to(req.hospital.id).emit('infraUpdate', { hospital });

        res.status(200).json({
            success: true,
            data: patient
        });
    } catch (err) {
        logger.error(`Discharge Error: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

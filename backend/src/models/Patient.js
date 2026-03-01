const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    hospital: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hospital',
        required: true,
    },
    patientName: {
        type: String,
        required: [true, 'Please add a patient name'],
        trim: true,
    },
    age: {
        type: Number,
        required: [true, 'Please add patient age'],
    },
    emergencyType: {
        type: String,
        required: [true, 'Please add emergency type'],
        trim: true,
    },
    bedType: {
        type: String,
        required: [true, 'Please specify bed type'],
        enum: ['beds', 'icu', 'ventilators', 'emergency', 'maternity'],
    },
    status: {
        type: String,
        enum: ['Admitted', 'Discharged'],
        default: 'Admitted',
    },
    admittedAt: {
        type: Date,
        default: Date.now,
    },
    dischargedAt: {
        type: Date,
    },
});

module.exports = mongoose.model('Patient', PatientSchema);

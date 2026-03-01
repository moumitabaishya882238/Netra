const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    hospital: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hospital',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'PATIENT_ADMITTED',
            'PATIENT_DISCHARGED',
            'STOCK_ADDED',
            'STOCK_UPDATED',
            'STOCK_DELETED',
            'DOCTOR_ADDED',
            'DOCTOR_STATUS_UPDATED',
            'DOCTOR_DELETED',
            'INFRA_UPDATED'
        ],
    },
    entityType: {
        type: String,
        required: true,
        enum: ['Patient', 'Resource', 'Doctor', 'Hospital'],
    },
    entityId: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    details: {
        type: Object,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

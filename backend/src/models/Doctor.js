const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    hospital: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hospital',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please add a doctor name'],
        trim: true,
    },
    specialization: {
        type: String,
        required: [true, 'Please add a specialization'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Available', 'Busy', 'OnCall', 'OffDuty'],
        default: 'OffDuty',
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

// Update lastUpdated timestamp on status change
DoctorSchema.pre('save', async function () {
    if (this.isModified('status')) {
        this.lastUpdated = Date.now();
    }
});

module.exports = mongoose.model('Doctor', DoctorSchema);

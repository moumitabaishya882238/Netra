const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    hospital: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hospital',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please add a resource name'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Gases', 'Blood', 'Medicines', 'Equipment', 'Other'],
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    unit: {
        type: String,
        required: [true, 'Please add a unit (e.g., Liters, Units)'],
    },
    minThreshold: {
        type: Number,
        default: 10,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

// Update lastUpdated timestamp on quantity change
ResourceSchema.pre('save', async function () {
    this.lastUpdated = Date.now();
});

module.exports = mongoose.model('Resource', ResourceSchema);

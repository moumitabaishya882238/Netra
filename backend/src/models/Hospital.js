const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a hospital name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please add an official email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    registrationId: {
        type: String,
        required: [true, 'Please add a registration ID'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['hospital', 'admin'],
        default: 'hospital',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    address: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    pincode: {
        type: String,
        trim: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            index: '2dsphere',
        },
    },
    contactNumber: {
        type: String,
        trim: true,
    },
    adminName: {
        type: String,
        trim: true,
    },
    infrastructure: {
        beds: {
            total: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 0, min: 0 },
        },
        icu: {
            total: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 0, min: 0 },
        },
        ventilators: {
            total: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 0, min: 0 },
        },
        emergency: {
            total: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 0, min: 0 },
        },
        maternity: {
            total: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 0, min: 0 },
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Validate that available <= total for all infrastructure
HospitalSchema.pre('save', async function () {
    const infra = this.infrastructure;
    if (infra) {
        const keys = ['beds', 'icu', 'ventilators', 'emergency', 'maternity'];
        for (const key of keys) {
            if (infra[key] && infra[key].available > infra[key].total) {
                throw new Error(`${key.toUpperCase()} available count cannot exceed total capacity`);
            }
        }
    }
});

// Encrypt password using bcrypt
HospitalSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
HospitalSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Match user entered password to hashed password in database
HospitalSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for hospital status
HospitalSchema.virtual('status').get(function () {
    const infra = this.infrastructure;
    if (!infra) return 'NORMAL';

    const keys = ['beds', 'icu', 'ventilators', 'emergency', 'maternity'];
    let isCritical = false;
    let isHighLoad = false;

    for (const key of keys) {
        const item = infra[key];
        if (item && item.total > 0) {
            const ratio = item.available / item.total;
            if (ratio <= 0.1) isCritical = true;
            else if (ratio <= 0.25) isHighLoad = true;
        }
    }

    if (isCritical) return 'CRITICAL';
    if (isHighLoad) return 'HIGH LOAD';
    return 'NORMAL';
});

// Ensure virtuals are included in res.json()
HospitalSchema.set('toJSON', { virtuals: true });
HospitalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Hospital', HospitalSchema);

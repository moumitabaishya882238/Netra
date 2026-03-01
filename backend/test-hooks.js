require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./src/models/Doctor');
const Hospital = require('./src/models/Hospital');

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find a hospital
        const hospital = await Hospital.findOne();
        if (!hospital) {
            console.log('No hospital found to test with');
            process.exit(0);
        }

        console.log('Testing Doctor.create...');
        const doc = await Doctor.create({
            name: 'Test Doc',
            specialization: 'Testing',
            hospital: hospital._id,
            status: 'Available'
        });
        console.log('Doctor created successfully:', doc._id);

        console.log('Testing status update...');
        doc.status = 'Busy';
        await doc.save();
        console.log('Status updated successfully');

        // Cleanup
        await Doctor.findByIdAndDelete(doc._id);
        console.log('Test doctor deleted');

        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err.message);
        process.exit(1);
    }
};

test();

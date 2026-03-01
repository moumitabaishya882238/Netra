require('dotenv').config({ path: 'e:/Netra/backend/.env' });
const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');
const { getAllHospitals } = require('../src/controllers/hospitalController');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for testing...');
    } catch (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
};

const testGetAllHospitals = async () => {
    await connectDB();

    // Mock Express req and res
    const req = {
        hospital: { id: 'mock-id' } // Note: getAllHospitals doesn't currently use req.hospital.id to filter, it returns all
    };

    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            this.jsonData = data;
            return this;
        }
    };

    try {
        console.log('Testing getAllHospitals controller...');
        await getAllHospitals(req, res);

        if (res.statusCode === 200 && res.jsonData.success) {
            console.log('SUCCESS: API returned hospitals successfully.');
            console.log(`Count: ${res.jsonData.data.length}`);
            if (res.jsonData.data.length > 0) {
                const sample = res.jsonData.data[0];
                console.log('Sample Hospital Properties:', Object.keys(sample.toObject ? sample.toObject() : sample));
                console.log('Virtual Status:', sample.status);
            }
        } else {
            console.error('FAILED: Unexpected response:', res.statusCode, res.jsonData);
        }
    } catch (err) {
        console.error('ERROR during testing:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

testGetAllHospitals();

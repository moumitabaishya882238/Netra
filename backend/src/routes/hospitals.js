const express = require('express');
const {
    getProfile,
    updateProfile,
    updateInfrastructure,
    getAllHospitals,
} = require('../controllers/hospitalController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All routes in this file are protected

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/infrastructure', updateInfrastructure);
router.get('/map', getAllHospitals);

module.exports = router;

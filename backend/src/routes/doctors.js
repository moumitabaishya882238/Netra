const express = require('express');
const {
    addDoctor,
    getDoctors,
    updateDoctorStatus,
    deleteDoctor,
} = require('../controllers/doctorController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getDoctors)
    .post(addDoctor);

router.route('/:id/status')
    .put(updateDoctorStatus);

router.route('/:id')
    .delete(deleteDoctor);

module.exports = router;

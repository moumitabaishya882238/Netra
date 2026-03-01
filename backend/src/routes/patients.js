const express = require('express');
const {
    admitPatient,
    getPatients,
    dischargePatient
} = require('../controllers/patientController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getPatients)
    .post(admitPatient);

router.route('/:id/discharge')
    .put(dischargePatient);

module.exports = router;

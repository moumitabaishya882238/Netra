const express = require('express');
const {
    registerInit,
    register,
    login,
    getMe,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

router.post('/register/init', registerInit);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;

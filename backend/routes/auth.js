const express = require('express');
const router = express.Router();
const { register, login, logout, me, verify, resendCode } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify', verify);
router.post('/resend-code', resendCode);
router.get('/me', authMiddleware, me);

module.exports = router;
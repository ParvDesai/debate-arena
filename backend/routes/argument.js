const express = require('express');
const router = express.Router();
const { submitArgument, getArguments } = require('../controllers/argumentController');
const authMiddleware = require('../middleware/auth');

router.post('/submit', authMiddleware, submitArgument);
router.get('/:roomId', authMiddleware, getArguments);

module.exports = router;

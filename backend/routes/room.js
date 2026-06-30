const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoom, getAllRooms, getReplay } = require('../controllers/roomController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getAllRooms);
router.post('/create', authMiddleware, createRoom);
router.post('/join/:id', authMiddleware, joinRoom);
router.get('/replay/:id', authMiddleware, getReplay);
router.get('/:id', authMiddleware, getRoom);

module.exports = router;
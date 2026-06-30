const express = require('express');
const router = express.Router();
const TRENDING_TOPICS = require('../seed/topics');

router.get('/', (req, res) => {
    res.json({ topics: TRENDING_TOPICS });
});

module.exports = router;

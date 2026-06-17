const express = require('express');
const router = express.Router();
const { recommend, getHistory } = require('../controllers/outfit.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/recommend', recommend);
router.get('/history', getHistory);

module.exports = router;

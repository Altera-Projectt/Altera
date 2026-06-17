const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, me);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers } = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'src/uploads/' });

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);
router.get('/', restrictTo('ADMIN'), getAllUsers);

module.exports = router;

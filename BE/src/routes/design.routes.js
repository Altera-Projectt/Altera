const express = require('express');
const router = express.Router();
const { createDesign, getDesignById, getMyDesigns } = require('../controllers/design.controller');
const { protect } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'src/uploads/' });

router.use(protect);

router.post('/', upload.fields([{ name: 'customImage', maxCount: 1 }, { name: 'previewImage', maxCount: 1 }]), createDesign);
router.get('/my', getMyDesigns);
router.get('/:id', getDesignById);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createDesign, getDesignById, getMyDesigns, updateDesign, deleteDesign } = require('../controllers/design.controller');
const { protect } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'src/uploads/' });

router.use(protect);

/**
 * @swagger
 * /api/v1/designs:
 *   post:
 *     summary: Create a new custom shirt design
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               customImage:
 *                 type: string
 *                 format: binary
 *               previewImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Design created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', upload.fields([{ name: 'customImage', maxCount: 1 }, { name: 'previewImage', maxCount: 1 }]), createDesign);

/**
 * @swagger
 * /api/v1/designs/my:
 *   get:
 *     summary: Get all my designs
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My designs retrieved successfully
 */
router.get('/my', getMyDesigns);

/**
 * @swagger
 * /api/v1/designs/{id}:
 *   get:
 *     summary: Get design by ID
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Design retrieved successfully
 *       404:
 *         description: Design not found
 */
router.get('/:id', getDesignById);

/**
 * @swagger
 * /api/v1/designs/{id}:
 *   put:
 *     summary: Update design
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               customImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Design updated successfully
 */
router.put('/:id', upload.fields([{ name: 'customImage', maxCount: 1 }, { name: 'previewImage', maxCount: 1 }]), updateDesign);

/**
 * @swagger
 * /api/v1/designs/{id}:
 *   delete:
 *     summary: Delete design
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Design deleted successfully
 */
router.delete('/:id', deleteDesign);

module.exports = router;

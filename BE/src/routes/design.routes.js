const express = require('express');
const router = express.Router();
const {
  createDesign,
  getDesignById,
  getMyDesigns,
  updateDesign,
  deleteDesign,
  uploadDesign,
  generateDesign,
  clearGeneratedHistory,
  getGeneratedHistory,
  refineDesign,
  saveDesign,
  orderDesign,
} = require('../controllers/design.controller');
const { protect } = require('../middlewares/auth.middleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

/**
 * @swagger
 * /api/v1/designs/upload:
 *   post:
 *     summary: Upload a source image for Design Studio
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
 *               image:
 *                 type: string
 *                 format: binary
 *               shirtColor:
 *                 type: string
 *                 example: "white"
 */
router.post(
  '/upload',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'customImage', maxCount: 1 }, { name: 'previewImage', maxCount: 1 }]),
  uploadDesign
);

/**
 * @swagger
 * /api/v1/designs/generate:
 *   post:
 *     summary: Generate a design preview with AI
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "A vintage eagle print"
 *               style:
 *                 type: string
 *                 example: "Vintage"
 *               shirtType:
 *                 type: string
 *                 example: "T-shirt"
 *               colorPalette:
 *                 type: string
 *                 example: "Black, cream, faded red"
 *     responses:
 *       201:
 *         description: AI generated image URL and design ID returned
 *       503:
 *         description: Gemini API unavailable
 */
router.post('/generate', generateDesign);

/**
 * @swagger
 * /api/v1/designs/generate/history:
 *   get:
 *     summary: Get recent generated image history for the current user
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent generation history returned
 */
router.get('/generate/history', getGeneratedHistory);

/**
 * @swagger
 * /api/v1/designs/generate/history:
 *   delete:
 *     summary: Clear the current user's generation cache/history
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Generation cache cleared successfully
 */
router.delete('/generate/history', clearGeneratedHistory);

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
 * /api/v1/designs/{id}/refine:
 *   post:
 *     summary: Refine a generated design with a new prompt
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Make the eagle larger"
 */
router.post('/:id/refine', refineDesign);

/**
 * @swagger
 * /api/v1/designs/{id}/save:
 *   post:
 *     summary: Save a generated design
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/save', saveDesign);

/**
 * @swagger
 * /api/v1/designs/{id}/order:
 *   post:
 *     summary: Create an order from a saved design
 *     tags:
 *       - Designs
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/order', orderDesign);

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

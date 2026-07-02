const express = require('express');
const router = express.Router();
const stylistController = require('../controllers/stylist.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

/**
 * @swagger
 * /api/v1/stylist/quiz:
 *   post:
 *     summary: Analyze quiz answers and detect user style
 *     tags:
 *       - AI Stylist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               favoriteItem:
 *                 type: string
 *                 example: "Oversized Hoodie"
 *               favoriteColor:
 *                 type: string
 *                 example: "Black"
 *               personality:
 *                 type: string
 *                 example: "Minimal"
 *               occasion:
 *                 type: string
 *                 example: "University"
 *     responses:
 *       200:
 *         description: Detected style returned
 *       503:
 *         description: Gemini API unavailable
 */
router.post('/quiz', stylistController.quiz);

/**
 * @swagger
 * /api/v1/stylist/recommend:
 *   post:
 *     summary: Recommend products and styling guidance from a detected style
 *     tags:
 *       - AI Stylist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               style:
 *                 type: string
 *                 example: "Streetwear"
 *               gender:
 *                 type: string
 *                 example: "unisex"
 *               season:
 *                 type: string
 *                 example: "summer"
 *               budget:
 *                 type: number
 *                 example: 1000000
 *               occasion:
 *                 type: string
 *                 example: "Di hoc"
 *     responses:
 *       200:
 *         description: Outfit recommendation returned and saved to history
 *       400:
 *         description: Style is required
 *       503:
 *         description: Gemini API unavailable
 */
router.post('/recommend', stylistController.recommend);

/**
 * @swagger
 * /api/v1/stylist/save:
 *   post:
 *     summary: Save a stylist recommendation to user history
 *     tags:
 *       - AI Stylist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               style:
 *                 type: string
 *               reason:
 *                 type: string
 *               tips:
 *                 type: array
 *                 items:
 *                   type: string
 *               recommendedProducts:
 *                 type: array
 *                 items:
 *                   type: object
 */
router.post('/save', stylistController.save);

/**
 * @swagger
 * /api/v1/stylist/history:
 *   get:
 *     summary: Get saved stylist recommendation history
 *     tags:
 *       - AI Stylist
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', stylistController.history);

module.exports = router;

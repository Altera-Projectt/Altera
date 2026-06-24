const express = require('express');
const router = express.Router();
const { recommend, getHistory } = require('../controllers/outfit.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

/**
 * @swagger
 * /api/v1/outfits/recommend:
 *   post:
 *     summary: Get AI outfit recommendation
 *     tags:
 *       - Outfits
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - occasion
 *             properties:
 *               occasion:
 *                 type: string
 *                 example: "Đi làm"
 *               style:
 *                 type: string
 *                 example: "Streetwear"
 *               budget:
 *                 type: number
 *                 example: 500000
 *               preferences:
 *                 type: string
 *                 example: "Màu tối, phong cách đơn giản"
 *     responses:
 *       200:
 *         description: AI outfit recommendation returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendation:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 */
router.post('/recommend', recommend);

/**
 * @swagger
 * /api/v1/outfits/history:
 *   get:
 *     summary: Get outfit recommendation history of current user
 *     tags:
 *       - Outfits
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', getHistory);

module.exports = router;
